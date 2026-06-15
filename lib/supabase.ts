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

export type Lembrete = {
  id: string;
  titulo: string;
  descricao: string;
  data: string;
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
