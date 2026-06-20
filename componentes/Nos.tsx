'use client';

import { useState } from 'react';
import { useNos } from '@/ganchos/useNos';

interface NosProps {
  userId: string;
}

const HUMORES = ['😍', '😊', '😐', '😔', '😴', '🥰', '😂', '😤'];

export default function Nos({ userId }: NosProps) {
  const { bucket, timeline, humores, loading, addBucket, toggleBucket, deleteBucket, addTimeline, deleteTimeline, registrarHumor } = useNos(userId);
  const [aba, setAba] = useState<'bucket' | 'timeline' | 'humor'>('bucket');
  const [novoBucket, setNovoBucket] = useState('');
  const [novaTimeline, setNovaTimeline] = useState({ titulo: '', data: '', descricao: '' });
  const [mostrarFormTimeline, setMostrarFormTimeline] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const meuHumor = humores.find(h => h.usuario_id === userId);
  const outroHumor = humores.find(h => h.usuario_id !== userId);

  const handleAddBucket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoBucket.trim()) return;
    await addBucket(novoBucket.trim());
    setNovoBucket('');
  };

  const handleAddTimeline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaTimeline.titulo.trim() || !novaTimeline.data) return;
    setSalvando(true);
    await addTimeline(novaTimeline.titulo, novaTimeline.data, novaTimeline.descricao);
    setNovaTimeline({ titulo: '', data: '', descricao: '' });
    setMostrarFormTimeline(false);
    setSalvando(false);
  };

  const formatarData = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  if (loading) return <div className="text-center py-16 text-stone-400">Carregando... 💕</div>;

  return (
    <div className="flex flex-col h-full">
      {/* Sub-abas */}
      <div className="flex border-b border-stone-100 bg-white shrink-0">
        {([['bucket', '🗒️ Lista'], ['timeline', '📸 Momentos'], ['humor', '💭 Humor']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setAba(key)}
            className={`flex-1 py-3 text-xs font-semibold transition-colors ${aba === key ? 'text-stone-800 border-b-2 border-stone-700' : 'text-stone-400'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* BUCKET LIST */}
        {aba === 'bucket' && (
          <div className="p-4 space-y-4">
            <form onSubmit={handleAddBucket} className="flex gap-2">
              <input
                type="text"
                value={novoBucket}
                onChange={e => setNovoBucket(e.target.value)}
                placeholder="Adicionar à lista de desejos..."
                className="flex-1 px-4 py-2.5 bg-white border-2 border-stone-200 rounded-xl focus:outline-none focus:border-stone-400 text-stone-800 text-sm"
              />
              <button type="submit" className="px-4 py-2.5 bg-stone-700 text-white rounded-xl text-sm font-semibold">+</button>
            </form>

            {bucket.length === 0 ? (
              <div className="text-center py-12 text-stone-400">
                <div className="text-4xl mb-3">🗒️</div>
                <p>Lista vazia</p>
                <p className="text-sm mt-1">Adicionem lugares para ir, coisas para fazer!</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">
                  {bucket.filter(b => !b.concluido).length} pendentes · {bucket.filter(b => b.concluido).length} concluídos
                </p>
                {bucket.map(item => (
                  <div key={item.id} className={`bg-white border border-stone-100 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm ${item.concluido ? 'opacity-60' : ''}`}>
                    <button
                      onClick={() => toggleBucket(item.id, !item.concluido)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                        item.concluido ? 'bg-stone-700 border-stone-700 text-white' : 'border-stone-300'
                      }`}
                    >
                      {item.concluido && '✓'}
                    </button>
                    <p className={`flex-1 text-sm ${item.concluido ? 'line-through text-stone-400' : 'text-stone-800'}`}>
                      {item.titulo}
                    </p>
                    <button onClick={() => deleteBucket(item.id)} className="text-stone-300 hover:text-red-400 transition-colors">🗑️</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TIMELINE */}
        {aba === 'timeline' && (
          <div className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm font-semibold text-stone-700">Nossa história</p>
              <button
                onClick={() => setMostrarFormTimeline(!mostrarFormTimeline)}
                className="px-3 py-1.5 bg-stone-700 text-white text-xs rounded-xl"
              >
                {mostrarFormTimeline ? '✕' : '+ Momento'}
              </button>
            </div>

            {mostrarFormTimeline && (
              <form onSubmit={handleAddTimeline} className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
                <input
                  type="text"
                  value={novaTimeline.titulo}
                  onChange={e => setNovaTimeline(p => ({ ...p, titulo: e.target.value }))}
                  placeholder="Título do momento *"
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-stone-400"
                  required
                />
                <input
                  type="date"
                  value={novaTimeline.data}
                  onChange={e => setNovaTimeline(p => ({ ...p, data: e.target.value }))}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-stone-400"
                  required
                />
                <textarea
                  value={novaTimeline.descricao}
                  onChange={e => setNovaTimeline(p => ({ ...p, descricao: e.target.value }))}
                  placeholder="Descrição (opcional)"
                  rows={2}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-stone-400 resize-none"
                />
                <button
                  type="submit"
                  disabled={salvando}
                  className="w-full py-2 bg-stone-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50"
                >
                  {salvando ? 'Salvando...' : 'Salvar momento 💕'}
                </button>
              </form>
            )}

            {timeline.length === 0 ? (
              <div className="text-center py-12 text-stone-400">
                <div className="text-4xl mb-3">📸</div>
                <p>Nenhum momento ainda</p>
                <p className="text-sm mt-1">Registrem datas especiais de vocês!</p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-stone-200" />
                <div className="space-y-4 pl-10">
                  {timeline.map(item => (
                    <div key={item.id} className="relative">
                      <div className="absolute -left-6 w-4 h-4 bg-stone-700 rounded-full border-2 border-white shadow" />
                      <div className="bg-white border border-stone-100 rounded-2xl p-4 shadow-sm">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-stone-800 text-sm">{item.titulo}</p>
                            <p className="text-xs text-stone-400 mt-0.5">📅 {formatarData(item.data)}</p>
                            {item.descricao && <p className="text-sm text-stone-600 mt-1.5">{item.descricao}</p>}
                          </div>
                          <button onClick={() => deleteTimeline(item.id)} className="text-stone-300 hover:text-red-400 ml-2 shrink-0">🗑️</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* HUMOR */}
        {aba === 'humor' && (
          <div className="p-4 space-y-5">
            <div className="bg-white border border-stone-100 rounded-2xl p-5 shadow-sm">
              <p className="text-sm font-semibold text-stone-700 mb-4">Como você está hoje?</p>
              <div className="grid grid-cols-4 gap-3">
                {HUMORES.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => registrarHumor(emoji)}
                    className={`text-3xl p-2 rounded-xl transition-all ${
                      meuHumor?.emoji === emoji ? 'bg-stone-100 scale-110 ring-2 ring-stone-400' : 'hover:bg-stone-50 hover:scale-105'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              {meuHumor && (
                <p className="text-center text-sm text-stone-500 mt-4">
                  Você está {meuHumor.emoji} hoje
                </p>
              )}
            </div>

            {outroHumor && (
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center">
                <p className="text-xs font-semibold text-amber-600 mb-2">Seu amor hoje</p>
                <p className="text-5xl">{outroHumor.emoji}</p>
              </div>
            )}

            {!outroHumor && (
              <div className="bg-stone-50 border border-stone-100 rounded-2xl p-4 text-center text-stone-400">
                <p className="text-sm">Seu amor ainda não registrou o humor de hoje</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
