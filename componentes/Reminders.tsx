'use client';

import { useState } from 'react';
import { useReminders } from '@/ganchos/useReminders';

interface RemindersProps {
  userId: string;
}

export default function Reminders({ userId }: RemindersProps) {
  const { reminders, loading, addReminder, deleteReminder } = useReminders(userId);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [data, setData] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !data) return;
    setEnviando(true);
    setErro('');

    const { error } = await addReminder(titulo, descricao, data);
    if (error) {
      setErro(error);
    } else {
      setTitulo('');
      setDescricao('');
      setData('');
      setMostrarForm(false);
    }
    setEnviando(false);
  };

  const formatarData = (dataStr: string) => {
    const date = new Date(dataStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const hoje = new Date();
  const lembretesFuturos = reminders.filter((r) => new Date(r.data) >= hoje);
  const lembretesPassados = reminders.filter((r) => new Date(r.data) < hoje);

  return (
    <div className="space-y-4">
      {/* Header com botão */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-stone-800">📅 Nossos Lembretes</h2>
        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          className="px-4 py-2 bg-stone-700 hover:bg-stone-800 text-white text-sm rounded-xl transition-colors shadow-sm"
        >
          {mostrarForm ? '✕ Cancelar' : '+ Novo lembrete'}
        </button>
      </div>

      {/* Formulário */}
      {mostrarForm && (
        <form
          onSubmit={handleAdd}
          className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3"
        >
          <h3 className="font-semibold text-stone-700">✨ Novo lembrete</h3>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Título do lembrete"
            className="w-full px-4 py-2 border-2 border-stone-200 rounded-xl focus:outline-none focus:border-stone-400 text-stone-800"
            required
          />
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descrição (opcional)"
            rows={3}
            className="w-full px-4 py-2 border-2 border-stone-200 rounded-xl focus:outline-none focus:border-stone-400 text-stone-800 resize-none"
          />
          <input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="w-full px-4 py-2 border-2 border-stone-200 rounded-xl focus:outline-none focus:border-stone-400 text-stone-800"
            required
          />
          {erro && <p className="text-red-500 text-sm">⚠️ {erro}</p>}
          <button
            type="submit"
            disabled={enviando}
            className="w-full py-2 bg-stone-700 hover:bg-stone-800 disabled:bg-stone-300 text-white font-semibold rounded-xl transition-colors"
          >
            {enviando ? 'Salvando...' : 'Salvar lembrete 💕'}
          </button>
        </form>
      )}

      {/* Lista */}
      {loading ? (
        <div className="text-center py-8 text-stone-400">Carregando lembretes... 💭</div>
      ) : reminders.length === 0 ? (
        <div className="text-center py-12 text-stone-400">
          <div className="text-4xl mb-3">📋</div>
          <p>Nenhum lembrete ainda</p>
          <p className="text-sm mt-1">Adicione datas especiais para não esquecer!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {lembretesFuturos.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">
                Próximos
              </p>
              <div className="space-y-2">
                {lembretesFuturos.map((r) => (
                  <div
                    key={r.id}
                    className="bg-white border-l-4 border-stone-400 rounded-xl p-4 shadow-sm flex justify-between items-start"
                  >
                    <div>
                      <p className="font-semibold text-stone-800">{r.titulo}</p>
                      {r.descricao && (
                        <p className="text-sm text-stone-500 mt-0.5">{r.descricao}</p>
                      )}
                      <p className="text-xs text-stone-500 mt-1">📅 {formatarData(r.data)}</p>
                    </div>
                    <button
                      onClick={() => deleteReminder(r.id)}
                      className="text-stone-300 hover:text-stone-500 transition-colors ml-3"
                      title="Excluir"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {lembretesPassados.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">
                Passados
              </p>
              <div className="space-y-2 opacity-60">
                {lembretesPassados.map((r) => (
                  <div
                    key={r.id}
                    className="bg-stone-50 border-l-4 border-stone-300 rounded-xl p-4 shadow-sm flex justify-between items-start"
                  >
                    <div>
                      <p className="font-semibold text-stone-500 line-through">{r.titulo}</p>
                      <p className="text-xs text-stone-400 mt-1">📅 {formatarData(r.data)}</p>
                    </div>
                    <button
                      onClick={() => deleteReminder(r.id)}
                      className="text-stone-300 hover:text-red-400 transition-colors ml-3"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
