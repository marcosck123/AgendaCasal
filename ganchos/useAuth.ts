'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  register: (email: string, password: string, nome: string) => Promise<{ error: string | null }>;
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
  ): Promise<{ error: string | null }> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nome },
      },
    });

    if (error) return { error: error.message };

    // Create user profile in casal_info table
    if (data.user) {
      const { error: profileError } = await supabase.from('casal_info').insert({
        id: data.user.id,
        email,
        nome,
      });
      if (profileError) console.error('Erro ao criar perfil:', profileError.message);
    }

    return { error: null };
  };

  return { user, loading, login, logout, register };
}
