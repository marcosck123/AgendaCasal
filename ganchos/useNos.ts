'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, BucketItem, TimelineItem, HumorDia } from '@/lib/supabase';

export function useNos(userId: string) {
  const [bucket, setBucket] = useState<BucketItem[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [humores, setHumores] = useState<HumorDia[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const hoje = new Date().toISOString().split('T')[0];
    const [b, t, h] = await Promise.all([
      supabase.from('bucket_list').select('*').order('created_at', { ascending: false }),
      supabase.from('timeline').select('*').order('data', { ascending: false }),
      supabase.from('humor_dia').select('*').eq('data', hoje),
    ]);
    if (b.data) setBucket(b.data as BucketItem[]);
    if (t.data) setTimeline(t.data as TimelineItem[]);
    if (h.data) setHumores(h.data as HumorDia[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const addBucket = async (titulo: string, descricao?: string) => {
    const { data } = await supabase.from('bucket_list').insert({ titulo, descricao, concluido: false, criado_por: userId }).select().single();
    if (data) setBucket(prev => [data as BucketItem, ...prev]);
  };

  const toggleBucket = async (id: string, concluido: boolean) => {
    await supabase.from('bucket_list').update({ concluido }).eq('id', id);
    setBucket(prev => prev.map(b => b.id === id ? { ...b, concluido } : b));
  };

  const deleteBucket = async (id: string) => {
    await supabase.from('bucket_list').delete().eq('id', id);
    setBucket(prev => prev.filter(b => b.id !== id));
  };

  const addTimeline = async (titulo: string, data: string, descricao?: string, foto_url?: string) => {
    const { data: row } = await supabase.from('timeline').insert({ titulo, data, descricao, foto_url, criado_por: userId }).select().single();
    if (row) setTimeline(prev => [row as TimelineItem, ...prev].sort((a, b) => b.data.localeCompare(a.data)));
  };

  const deleteTimeline = async (id: string) => {
    await supabase.from('timeline').delete().eq('id', id);
    setTimeline(prev => prev.filter(t => t.id !== id));
  };

  const registrarHumor = async (emoji: string, texto?: string) => {
    const hoje = new Date().toISOString().split('T')[0];
    await supabase.from('humor_dia').upsert({ usuario_id: userId, emoji, texto, data: hoje }, { onConflict: 'usuario_id,data' });
    setHumores(prev => {
      const filtered = prev.filter(h => h.usuario_id !== userId);
      return [...filtered, { id: '', usuario_id: userId, emoji, texto, data: hoje, created_at: '' }];
    });
  };

  return { bucket, timeline, humores, loading, addBucket, toggleBucket, deleteBucket, addTimeline, deleteTimeline, registrarHumor };
}
