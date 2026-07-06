'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useCasalContext } from './CasalContext';

export function useCasalConfig() {
  const { casal } = useCasalContext();
  const casalId = casal?.id ?? null;
  const [config, setConfig] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const fetchConfig = useCallback(async () => {
    if (!casalId) return;
    const { data } = await supabase
      .from('casal_config')
      .select('chave, valor')
      .eq('casal_id', casalId);
    if (data) {
      const map: Record<string, string> = {};
      data.forEach((row: { chave: string; valor: string }) => { map[row.chave] = row.valor; });
      setConfig(map);
    }
    setLoading(false);
  }, [casalId]);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const setConfigValue = async (chave: string, valor: string) => {
    if (!casalId) return;
    await supabase
      .from('casal_config')
      .upsert({ casal_id: casalId, chave, valor }, { onConflict: 'casal_id,chave' });
    setConfig(prev => ({ ...prev, [chave]: valor }));
  };

  return { config, loading, setConfigValue, refetch: fetchConfig };
}
