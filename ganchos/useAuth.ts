'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  register: (email: string, password: string, nome: string) => Promise<{ error: string | null; precisaConfirmar: boolean }>;
  verifyCode: (email: string, code: string) => Promise<{ error: string | null }>;
  resendCode: (email: string) => Promise<{ error: string | null }>;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  const logout = async (): Promise<void> => {
    await supabase.auth.signOut();
  };

  const register = async (
    email: string,
    password: string,
    nome: string
  ): Promise<{ error: string | null; precisaConfirmar: boolean }> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nome },
      },
    });

    if (error) {
      const msg = error.message || (error as { error_description?: string }).error_description || '';
      // Mensagem amigável para o erro clássico de SMTP
      if (/confirmation email|sending|smtp/i.test(msg) || !msg) {
        return { error: 'Não consegui enviar o e-mail de confirmação. Verifique a configuração de SMTP no Supabase.', precisaConfirmar: false };
      }
      return { error: msg, precisaConfirmar: false };
    }

    // O perfil e o casal são criados automaticamente pelo trigger no banco.
    // Se a confirmação de e-mail estiver desligada, já vem uma sessão ativa
    // e o onAuthStateChange loga direto — não precisa da tela de código.
    const precisaConfirmar = !data.session;
    return { error: null, precisaConfirmar };
  };

  // Valida o código de 6 dígitos recebido por e-mail no cadastro
  const verifyCode = async (email: string, code: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'signup' });
    if (error) {
      // fallback: código de login (caso a conta já esteja confirmada)
      const { error: e2 } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
      if (e2) return { error: 'Código inválido ou expirado. Tente reenviar.' };
    }
    return { error: null };
  };

  const resendCode = async (email: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) return { error: error.message };
    return { error: null };
  };

  return { user, loading, login, logout, register, verifyCode, resendCode };
}
