'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, Lembrete, Categoria, ParaQuem } from '@/lib/supabase';
import { useCasalContext } from './CasalContext';

interface NovoLembrete {
  titulo: string;
  descricao: string;
  data: string;
  hora?: string;
  categoria?: Categoria;
  para_quem?: ParaQuem;
}

interface UseRemindersReturn {
  reminders: Lembrete[];
  loading: boolean;
  addReminder: (lembrete: NovoLembrete) => Promise<{ error: string | null }>;
  deleteReminder: (id: string) => Promise<{ error: string | null }>;
}

export function useReminders(userId: string | undefined): UseRemindersReturn {
  const { casal } = useCasalContext();
  const casalId = casal?.id ?? null;
  const [reminders, setReminders] = useState<Lembrete[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReminders = useCallback(async () => {
    if (!userId || !casalId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('lembretes')
      .select('*')
      .eq('casal_id', casalId)
      .order('data', { ascending: true });

    if (!error && data) {
      setReminders(data as Lembrete[]);
    }
    setLoading(false);
  }, [userId, casalId]);

  useEffect(() => {
    fetchReminders();
    const channel = supabase
      .channel('lembretes-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lembretes' }, () => {
        fetchReminders();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchReminders]);

  const addReminder = async (lembrete: NovoLembrete): Promise<{ error: string | null }> => {
    if (!userId) return { error: 'Usuário não autenticado' };
    if (!casalId) return { error: 'Casal não carregado ainda' };
    const { error } = await supabase.from('lembretes').insert({
      ...lembrete,
      criado_por: userId,
      casal_id: casalId,
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
