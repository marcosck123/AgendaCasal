'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useCasalConfig() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const fetchConfig = useCallback(async () => {
    const { data } = await supabase.from('casal_config').select('chave, valor');
    if (data) {
      const map: Record<string, string> = {};
      data.forEach((row: { chave: string; valor: string }) => { map[row.chave] = row.valor; });
      setConfig(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const setConfigValue = async (chave: string, valor: string) => {
    await supabase.from('casal_config').upsert({ chave, valor }, { onConflict: 'chave' });
    setConfig(prev => ({ ...prev, [chave]: valor }));
  };

  return { config, loading, setConfigValue, refetch: fetchConfig };
}
