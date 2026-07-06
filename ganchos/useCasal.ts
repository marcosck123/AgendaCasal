'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, Perfil, Casal } from '@/lib/supabase';

export interface CasalState {
  perfil: Perfil | null;
  casal: Casal | null;
  parceiro: Perfil | null;
  solo: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useCasal(userId: string | undefined): CasalState {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [casal, setCasal] = useState<Casal | null>(null);
  const [parceiro, setParceiro] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);
  const casalIdRef = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;
    const { data: p } = await supabase
      .from('perfis')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    const perfilData = (p as Perfil | null) ?? null;
    setPerfil(perfilData);

    let casalData: Casal | null = null;
    let parceiroData: Perfil | null = null;

    if (perfilData?.casal_id) {
      const { data: c } = await supabase
        .from('casais')
        .select('*')
        .eq('id', perfilData.casal_id)
        .maybeSingle();
      casalData = (c as Casal | null) ?? null;

      const outroId = casalData
        ? (casalData.membro_1 === userId ? casalData.membro_2 : casalData.membro_1)
        : null;
      if (outroId) {
        const { data: par } = await supabase
          .from('perfis')
          .select('*')
          .eq('id', outroId)
          .maybeSingle();
        parceiroData = (par as Perfil | null) ?? null;
      }
    }

    casalIdRef.current = casalData?.id ?? null;
    setCasal(casalData);
    setParceiro(parceiroData);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    refresh();

    // Realtime: quando o parceiro entra/sai ou perfis mudam, recarrega
    const channel = supabase
      .channel(`casal-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'casais' }, () => {
        refresh();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'perfis' }, () => {
        refresh();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, refresh]);

  const solo = !casal || !casal.membro_2;

  return { perfil, casal, parceiro, solo, loading, refresh };
}
