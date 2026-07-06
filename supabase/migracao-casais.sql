-- ============================================================
-- Migração: arquitetura multi-casal para o app "Nosso"
-- Rode este script inteiro no SQL Editor do Supabase.
-- É idempotente: pode rodar mais de uma vez sem quebrar.
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- 0. Função utilitária: gera código de 6 chars A-Z0-9
-- ------------------------------------------------------------
create or replace function public.gerar_codigo_6()
returns text
language plpgsql
volatile
as $$
declare
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  resultado text := '';
  i int;
begin
  for i in 1..6 loop
    resultado := resultado || substr(chars, 1 + floor(random() * 36)::int, 1);
  end loop;
  return resultado;
end;
$$;

-- ------------------------------------------------------------
-- 1. Tabelas novas
-- ------------------------------------------------------------
create table if not exists public.casais (
  id uuid primary key default gen_random_uuid(),
  membro_1 uuid not null references auth.users(id) on delete cascade,
  membro_2 uuid null references auth.users(id) on delete set null,
  data_inicio date null,
  created_at timestamptz not null default now()
);

create table if not exists public.perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null default '',
  email text,
  codigo_amigo text unique not null default public.gerar_codigo_6(),
  casal_id uuid null references public.casais(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.convites (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null default public.gerar_codigo_6(),
  criado_por uuid not null references auth.users(id) on delete cascade,
  casal_id uuid not null references public.casais(id) on delete cascade,
  usado_por uuid null references auth.users(id),
  expira_em timestamptz not null default now() + interval '7 days',
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2. Coluna casal_id nas tabelas de dados existentes
--    (cada uma protegida caso a tabela não exista)
-- ------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['lembretes','mensagens','bucket_list','timeline','humor_dia','casal_config','reacoes'] loop
    if to_regclass('public.' || t) is not null then
      execute format('alter table public.%I add column if not exists casal_id uuid', t);
    end if;
  end loop;
end $$;

-- casal_config: o upsert passa a ser por (casal_id, chave)
do $$
begin
  if to_regclass('public.casal_config') is not null then
    -- remove unique antigo só na chave, se houver
    begin
      execute (
        select string_agg(format('alter table public.casal_config drop constraint %I;', conname), ' ')
        from pg_constraint
        where conrelid = 'public.casal_config'::regclass
          and contype = 'u'
          and array_length(conkey, 1) = 1
          and conkey[1] = (select attnum from pg_attribute where attrelid = 'public.casal_config'::regclass and attname = 'chave')
      );
    exception when others then null;
    end;
    if not exists (
      select 1 from pg_constraint
      where conrelid = 'public.casal_config'::regclass and conname = 'casal_config_casal_chave_uniq'
    ) then
      alter table public.casal_config add constraint casal_config_casal_chave_uniq unique (casal_id, chave);
    end if;
  end if;
end $$;

-- humor_dia: unique por (casal_id não precisa) usuario_id, data — já existente, mantém.

-- ------------------------------------------------------------
-- 3. Backfill: perfis para usuários existentes + casal inicial
-- ------------------------------------------------------------
do $$
declare
  n_users int;
  u record;
  novo_casal uuid;
  m1 uuid;
  m2 uuid;
  t text;
begin
  -- cria perfis faltantes
  for u in select id, email, raw_user_meta_data from auth.users loop
    insert into public.perfis (id, nome, email)
    values (
      u.id,
      coalesce(nullif(u.raw_user_meta_data->>'nome', ''), split_part(coalesce(u.email, 'Amor'), '@', 1)),
      u.email
    )
    on conflict (id) do nothing;
  end loop;

  select count(*) into n_users from auth.users;

  if n_users = 2 then
    -- casal com os dois usuários existentes (se ainda não tiverem casal)
    select id into m1 from auth.users order by created_at asc limit 1;
    select id into m2 from auth.users order by created_at asc offset 1 limit 1;
    if not exists (select 1 from public.perfis where id in (m1, m2) and casal_id is not null) then
      insert into public.casais (membro_1, membro_2) values (m1, m2) returning id into novo_casal;
      update public.perfis set casal_id = novo_casal where id in (m1, m2);
      -- todos os dados existentes passam a pertencer a esse casal
      foreach t in array array['lembretes','mensagens','bucket_list','timeline','humor_dia','casal_config','reacoes'] loop
        if to_regclass('public.' || t) is not null then
          execute format('update public.%I set casal_id = %L where casal_id is null or casal_id not in (select id from public.casais)', t, novo_casal);
        end if;
      end loop;
    end if;
  elsif n_users = 1 then
    select id into m1 from auth.users limit 1;
    if not exists (select 1 from public.perfis where id = m1 and casal_id is not null) then
      insert into public.casais (membro_1) values (m1) returning id into novo_casal;
      update public.perfis set casal_id = novo_casal where id = m1;
      foreach t in array array['lembretes','mensagens','bucket_list','timeline','humor_dia','casal_config','reacoes'] loop
        if to_regclass('public.' || t) is not null then
          execute format('update public.%I set casal_id = %L where casal_id is null or casal_id not in (select id from public.casais)', t, novo_casal);
        end if;
      end loop;
    end if;
  end if;

  -- garante casal solo para qualquer usuário que ainda esteja sem casal
  for u in select p.id from public.perfis p where p.casal_id is null loop
    insert into public.casais (membro_1) values (u.id) returning id into novo_casal;
    update public.perfis set casal_id = novo_casal where id = u.id;
  end loop;
end $$;

-- ------------------------------------------------------------
-- 4. Trigger: novo signup => perfil + casal solo
-- ------------------------------------------------------------
create or replace function public.handle_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  novo_casal uuid;
begin
  insert into public.casais (membro_1) values (new.id) returning id into novo_casal;
  insert into public.perfis (id, nome, email, casal_id)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'nome', ''), split_part(coalesce(new.email, 'Amor'), '@', 1)),
    new.email,
    novo_casal
  )
  on conflict (id) do update set casal_id = coalesce(perfis.casal_id, excluded.casal_id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_novo_usuario();

-- ------------------------------------------------------------
-- 5. RLS
-- ------------------------------------------------------------
alter table public.perfis enable row level security;
alter table public.casais enable row level security;
alter table public.convites enable row level security;

-- perfis: leitura para autenticados (mostrar nome de quem convidou), update no próprio
drop policy if exists perfis_select on public.perfis;
create policy perfis_select on public.perfis for select to authenticated using (true);
drop policy if exists perfis_update on public.perfis;
create policy perfis_update on public.perfis for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists perfis_insert on public.perfis;
create policy perfis_insert on public.perfis for insert to authenticated with check (id = auth.uid());

-- casais: membros veem/atualizam seu casal
drop policy if exists casais_select on public.casais;
create policy casais_select on public.casais for select to authenticated
  using (membro_1 = auth.uid() or membro_2 = auth.uid());
drop policy if exists casais_update on public.casais;
create policy casais_update on public.casais for update to authenticated
  using (membro_1 = auth.uid() or membro_2 = auth.uid());

-- convites: qualquer autenticado pode ler (tela de aceitar por código);
-- criador insere/deleta; quem aceita atualiza (via RPC security definer, mas mantém política)
drop policy if exists convites_select on public.convites;
create policy convites_select on public.convites for select to authenticated using (true);
drop policy if exists convites_insert on public.convites;
create policy convites_insert on public.convites for insert to authenticated with check (criado_por = auth.uid());
drop policy if exists convites_delete on public.convites;
create policy convites_delete on public.convites for delete to authenticated using (criado_por = auth.uid());
drop policy if exists convites_update on public.convites;
create policy convites_update on public.convites for update to authenticated
  using (usado_por is null) with check (usado_por = auth.uid());

-- tabelas de dados: acesso pelo casal
do $$
declare
  t text;
begin
  foreach t in array array['lembretes','mensagens','bucket_list','timeline','humor_dia','casal_config','reacoes'] loop
    if to_regclass('public.' || t) is not null then
      execute format('alter table public.%I enable row level security', t);
      execute format('drop policy if exists %I on public.%I', t || '_casal_select', t);
      execute format(
        'create policy %I on public.%I for select to authenticated using (casal_id in (select id from public.casais where membro_1 = auth.uid() or membro_2 = auth.uid()))',
        t || '_casal_select', t);
      execute format('drop policy if exists %I on public.%I', t || '_casal_insert', t);
      execute format(
        'create policy %I on public.%I for insert to authenticated with check (casal_id in (select id from public.casais where membro_1 = auth.uid() or membro_2 = auth.uid()))',
        t || '_casal_insert', t);
      execute format('drop policy if exists %I on public.%I', t || '_casal_update', t);
      execute format(
        'create policy %I on public.%I for update to authenticated using (casal_id in (select id from public.casais where membro_1 = auth.uid() or membro_2 = auth.uid()))',
        t || '_casal_update', t);
      execute format('drop policy if exists %I on public.%I', t || '_casal_delete', t);
      execute format(
        'create policy %I on public.%I for delete to authenticated using (casal_id in (select id from public.casais where membro_1 = auth.uid() or membro_2 = auth.uid()))',
        t || '_casal_delete', t);
    end if;
  end loop;
end $$;

-- ------------------------------------------------------------
-- 6. RPC: aceitar_convite(p_codigo)
-- ------------------------------------------------------------
create or replace function public.aceitar_convite(p_codigo text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_convite record;
  v_casal_convite record;
  v_meu_casal record;
  v_uid uuid := auth.uid();
  v_meu_casal_id uuid;
  t text;
begin
  if v_uid is null then
    return json_build_object('success', false, 'error', 'Você precisa estar conectado.');
  end if;

  select * into v_convite from public.convites where codigo = upper(trim(p_codigo));
  if not found then
    return json_build_object('success', false, 'error', 'Convite não encontrado.');
  end if;
  if v_convite.usado_por is not null then
    return json_build_object('success', false, 'error', 'Este convite já foi usado.');
  end if;
  if v_convite.expira_em < now() then
    return json_build_object('success', false, 'error', 'Este convite expirou.');
  end if;
  if v_convite.criado_por = v_uid then
    return json_build_object('success', false, 'error', 'Você não pode aceitar o próprio convite.');
  end if;

  select * into v_casal_convite from public.casais where id = v_convite.casal_id;
  if not found or v_casal_convite.membro_2 is not null then
    return json_build_object('success', false, 'error', 'Este casal já está completo.');
  end if;

  select casal_id into v_meu_casal_id from public.perfis where id = v_uid;
  if v_meu_casal_id = v_convite.casal_id then
    return json_build_object('success', false, 'error', 'Vocês já estão juntos.');
  end if;
  select * into v_meu_casal from public.casais where id = v_meu_casal_id;
  if found and v_meu_casal.membro_2 is not null then
    return json_build_object('success', false, 'error', 'Você já faz parte de um casal. Desfaça o vínculo antes.');
  end if;

  -- move os dados do casal solo de quem aceita para o casal do convite
  if v_meu_casal_id is not null then
    foreach t in array array['lembretes','mensagens','bucket_list','timeline','humor_dia','casal_config','reacoes'] loop
      if to_regclass('public.' || t) is not null then
        execute format('update public.%I set casal_id = %L where casal_id = %L', t, v_convite.casal_id, v_meu_casal_id);
      end if;
    end loop;
  end if;

  update public.casais set membro_2 = v_uid where id = v_convite.casal_id;
  update public.perfis set casal_id = v_convite.casal_id where id = v_uid;
  update public.convites set usado_por = v_uid where id = v_convite.id;

  -- apaga o casal solo antigo
  if v_meu_casal_id is not null and v_meu_casal_id <> v_convite.casal_id then
    delete from public.casais where id = v_meu_casal_id;
  end if;

  return json_build_object('success', true, 'casal_id', v_convite.casal_id);
end;
$$;

grant execute on function public.aceitar_convite(text) to authenticated;

-- ------------------------------------------------------------
-- 7. RPC: desfazer_vinculo()
-- ------------------------------------------------------------
create or replace function public.desfazer_vinculo()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_casal record;
  novo_casal uuid;
begin
  if v_uid is null then
    return json_build_object('success', false, 'error', 'Você precisa estar conectado.');
  end if;

  select c.* into v_casal
  from public.casais c
  join public.perfis p on p.casal_id = c.id
  where p.id = v_uid;

  if not found then
    return json_build_object('success', false, 'error', 'Casal não encontrado.');
  end if;
  if v_casal.membro_2 is null then
    return json_build_object('success', false, 'error', 'Você não está vinculado a ninguém.');
  end if;

  -- novo casal solo para quem saiu
  insert into public.casais (membro_1) values (v_uid) returning id into novo_casal;
  update public.perfis set casal_id = novo_casal where id = v_uid;

  -- o casal antigo fica com o membro que permaneceu
  if v_casal.membro_1 = v_uid then
    update public.casais set membro_1 = v_casal.membro_2, membro_2 = null where id = v_casal.id;
  else
    update public.casais set membro_2 = null where id = v_casal.id;
  end if;

  -- lembretes privados criados por quem saiu vão junto
  if to_regclass('public.lembretes') is not null then
    update public.lembretes set casal_id = novo_casal
    where casal_id = v_casal.id and criado_por = v_uid and para_quem = 'so_eu';
  end if;
  -- humor de quem saiu vai junto
  if to_regclass('public.humor_dia') is not null then
    update public.humor_dia set casal_id = novo_casal
    where casal_id = v_casal.id and usuario_id = v_uid;
  end if;
  -- demais dados compartilhados (mensagens, bucket, timeline, config, reações)
  -- permanecem arquivados com o casal antigo.

  -- invalida convites pendentes dos dois lados
  delete from public.convites where casal_id in (v_casal.id, novo_casal) and usado_por is null;

  return json_build_object('success', true, 'casal_id', novo_casal);
end;
$$;

grant execute on function public.desfazer_vinculo() to authenticated;

-- ------------------------------------------------------------
-- 8. Realtime nas tabelas novas (ignora erro se já adicionadas)
-- ------------------------------------------------------------
do $$
begin
  begin
    alter publication supabase_realtime add table public.casais;
  exception when others then null;
  end;
  begin
    alter publication supabase_realtime add table public.perfis;
  exception when others then null;
  end;
end $$;

-- Fim. ✅
