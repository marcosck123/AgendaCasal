import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserProfile = {
  id: string;
  email: string;
  nome: string;
  casal_id: string;
  created_at: string;
};

export type Perfil = {
  id: string;
  nome: string;
  email: string | null;
  codigo_amigo: string;
  casal_id: string | null;
  created_at: string;
};

export type Casal = {
  id: string;
  membro_1: string;
  membro_2: string | null;
  data_inicio: string | null;
  created_at: string;
};

export type Convite = {
  id: string;
  codigo: string;
  criado_por: string;
  casal_id: string;
  usado_por: string | null;
  expira_em: string;
  created_at: string;
};

export type Categoria = 'romantico' | 'aniversario' | 'consulta' | 'viagem' | 'outro';
export type ParaQuem = 'os_dois' | 'so_eu' | 'so_amor';

export type Lembrete = {
  id: string;
  titulo: string;
  descricao: string;
  data: string;
  hora?: string;
  categoria?: Categoria;
  para_quem?: ParaQuem;
  casal_id: string;
  criado_por: string;
  created_at: string;
};

export type Mensagem = {
  id: string;
  conteudo: string;
  casal_id: string;
  enviado_por: string;
  nome_remetente: string;
  tipo: 'texto' | 'audio' | 'foto';
  duracao?: number;
  respondendo_id?: string;
  respondendo_preview?: string;
  created_at: string;
};

export type Reacao = {
  id: string;
  mensagem_id: string;
  usuario_id: string;
  emoji: string;
  created_at: string;
};

export type BucketItem = {
  id: string;
  casal_id?: string | null;
  titulo: string;
  descricao?: string;
  concluido: boolean;
  criado_por: string;
  created_at: string;
};

export type TimelineItem = {
  id: string;
  casal_id?: string | null;
  titulo: string;
  descricao?: string;
  data: string;
  foto_url?: string;
  criado_por: string;
  created_at: string;
};

export type HumorDia = {
  id: string;
  casal_id?: string | null;
  usuario_id: string;
  emoji: string;
  texto?: string;
  data: string;
  created_at: string;
};

export type CasalConfig = {
  id: string;
  casal_id?: string | null;
  chave: string;
  valor: string;
  updated_at: string;
};

export type Conquista = {
  id: string;
  usuario_id: string;
  codigo: string;
  desbloqueada_em: string;
};

export type Audio = {
  id: string;
  titulo: string;
  url: string;
  casal_id: string;
  gravado_por: string;
  duracao: number;
  created_at: string;
};
