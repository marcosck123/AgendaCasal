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
  tipo: 'texto' | 'audio';
  duracao?: number;
  created_at: string;
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
