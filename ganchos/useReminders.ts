'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, Lembrete } from '@/lib/supabase';

interface UseRemindersReturn {
  reminders: Lembrete[];
  loading: boolean;
  addReminder: (titulo: string, descricao: string, data: string) => Promise<{ error: string | null }>;
  deleteReminder: (id: string) => Promise<{ error: string | null }>;
}

export function useReminders(userId: string | undefined, casalId?: string): UseRemindersReturn {
  const [reminders, setReminders] = useState<Lembrete[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReminders = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('lembretes')
      .select('*')
      .order('data', { ascending: true });

    if (!error && data) {
      setReminders(data as Lembrete[]);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchReminders();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('lembretes-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lembretes' },
        () => {
          fetchReminders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchReminders]);

  const addReminder = async (
    titulo: string,
    descricao: string,
    data: string
  ): Promise<{ error: string | null }> => {
    if (!userId) return { error: 'Usuário não autenticado' };

    const { error } = await supabase.from('lembretes').insert({
      titulo,
      descricao,
      data,
      criado_por: userId,
      casal_id: casalId ?? userId,
    });

    if (error) return { error: error.message };
    return { error: null };
  };

  const deleteReminder = async (id: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.from('lembretes').delete().eq('id', id);
    if (error) return { error: error.message };
    return { error: null };
  };

  return { reminders, loading, addReminder, deleteReminder };
}
