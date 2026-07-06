'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase, Convite, Perfil } from '@/lib/supabase';
import { useAuth } from '@/ganchos/useAuth';
import { Heart } from '@/componentes/UIKit';

export default function JuntarPage() {
  const params = useParams<{ codigo: string }>();
  const codigo = (params?.codigo ?? '').toString().toUpperCase();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [convite, setConvite] = useState<Convite | null>(null);
  const [remetente, setRemetente] = useState<Perfil | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [aceitando, setAceitando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    if (!codigo) return;
    (async () => {
      const { data } = await supabase
        .from('convites')
        .select('*')
        .eq('codigo', codigo)
        .maybeSingle();
      const c = (data as Convite | null) ?? null;
      setConvite(c);
      if (!c) {
        setErro('Convite não encontrado. Confira o código ou peça um novo.');
      } else if (c.usado_por) {
        setErro('Este convite já foi usado.');
      } else if (new Date(c.expira_em).getTime() < Date.now()) {
        setErro('Este convite expirou. Peça um novo.');
      } else {
        const { data: p } = await supabase
          .from('perfis')
          .select('*')
          .eq('id', c.criado_por)
          .maybeSingle();
        setRemetente((p as Perfil | null) ?? null);
      }
      setCarregando(false);
    })();
  }, [codigo]);

  const irParaLogin = () => {
    try { localStorage.setItem('convite_pendente', codigo); } catch { /* ignore */ }
    router.push('/');
  };

  const aceitar = async () => {
    if (!user) { irParaLogin(); return; }
    setAceitando(true);
    setErro('');
    const { data, error } = await supabase.rpc('aceitar_convite', { p_codigo: codigo });
    setAceitando(false);
    const res = data as { success?: boolean; error?: string } | null;
    if (error || !res?.success) {
      setErro(res?.error || error?.message || 'Não foi possível aceitar o convite.');
      return;
    }
    try { localStorage.removeItem('convite_pendente'); } catch { /* ignore */ }
    setSucesso(true);
    setTimeout(() => router.push('/dashboard'), 1800);
  };

  const nomeRemetente = remetente?.nome || 'Alguém especial';

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 20, padding: '0 26px',
      background: 'linear-gradient(160deg, var(--bg) 60%, color-mix(in srgb, var(--romance) 6%, var(--bg)))',
      textAlign: 'center',
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: 22,
        background: 'linear-gradient(135deg, var(--brand-grad-start), var(--brand-grad-end))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 8px 32px color-mix(in srgb, var(--brand-grad-end) 35%, transparent)',
        animation: 'heart-beat 1.8s ease-in-out infinite',
      }}>
        <Heart size={30} color="#fff7f0" />
      </div>

      {carregando || (authLoading && !erro) ? (
        <div style={{ color: 'var(--muted)' }}>Carregando convite…</div>
      ) : sucesso ? (
        <div className="card card-strong" style={{ padding: 24, maxWidth: 380, width: '100%' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>💛</div>
          <div style={{ fontSize: 19, fontWeight: 600, letterSpacing: '-0.02em' }}>Vocês estão juntos!</div>
          <p style={{ fontSize: 13.5, color: 'var(--muted)', marginTop: 6 }}>Levando você para o Nosso…</p>
        </div>
      ) : erro && !remetente ? (
        <div className="card card-strong" style={{ padding: 24, maxWidth: 380, width: '100%' }}>
          <div style={{ fontSize: 34, marginBottom: 8 }}>😕</div>
          <p style={{ fontSize: 14.5, lineHeight: 1.5 }}>{erro}</p>
          <button className="btn btn-block" style={{ marginTop: 16 }} onClick={() => router.push('/')}>
            Ir para o início
          </button>
        </div>
      ) : (
        <div className="card card-strong" style={{ padding: 24, maxWidth: 380, width: '100%' }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Convite</div>
          <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.3 }}>
            {nomeRemetente} te convidou para o Nosso 💛
          </div>
          <p style={{ fontSize: 13.5, color: 'var(--muted)', marginTop: 8, lineHeight: 1.5 }}>
            Um espaço só de vocês dois: agenda, conversa, memórias e muito mais.
          </p>
          <div className="chip" style={{
            margin: '16px auto 0', fontSize: 15, fontWeight: 700, letterSpacing: '0.2em', padding: '7px 16px',
          }}>
            {codigo}
          </div>
          {erro && <p style={{ fontSize: 13, color: 'var(--danger)', marginTop: 12 }}>{erro}</p>}
          {user ? (
            <button
              className="btn btn-primary btn-block"
              style={{ marginTop: 18, opacity: aceitando ? 0.6 : 1 }}
              disabled={aceitando || !!convite?.usado_por}
              onClick={aceitar}
            >
              {aceitando ? 'Aceitando…' : 'Aceitar convite 💛'}
            </button>
          ) : (
            <>
              <button className="btn btn-primary btn-block" style={{ marginTop: 18 }} onClick={irParaLogin}>
                Entrar para aceitar
              </button>
              <p style={{ fontSize: 12, color: 'var(--soft)', marginTop: 10 }}>
                Faça login ou crie sua conta — o convite fica guardado.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
