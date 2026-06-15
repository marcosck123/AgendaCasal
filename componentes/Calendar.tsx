'use client';

import { useState } from 'react';
import { useReminders } from '@/ganchos/useReminders';
import { Lembrete } from '@/lib/supabase';

interface CalendarProps {
  userId: string;
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export default function Calendar({ userId }: CalendarProps) {
  const hoje = new Date();
  const [mesAtual, setMesAtual] = useState(hoje.getMonth());
  const [anoAtual, setAnoAtual] = useState(hoje.getFullYear());
  const [diaSelecionado, setDiaSelecionado] = useState<Date | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  const { reminders, addReminder, deleteReminder } = useReminders(userId);

  const mesAnterior = () => {
    if (mesAtual === 0) { setMesAtual(11); setAnoAtual(a => a - 1); }
    else setMesAtual(m => m - 1);
  };

  const proximoMes = () => {
    if (mesAtual === 11) { setMesAtual(0); setAnoAtual(a => a + 1); }
    else setMesAtual(m => m + 1);
  };

  const getDiasDoMes = () => {
    const primeiroDia = new Date(anoAtual, mesAtual, 1).getDay();
    const totalDias = new Date(anoAtual, mesAtual + 1, 0).getDate();
    const diasMesAnterior = new Date(anoAtual, mesAtual, 0).getDate();
    const dias: { data: Date; fora: boolean }[] = [];

    for (let i = primeiroDia - 1; i >= 0; i--) {
      dias.push({ data: new Date(anoAtual, mesAtual - 1, diasMesAnterior - i), fora: true });
    }
    for (let d = 1; d <= totalDias; d++) {
      dias.push({ data: new Date(anoAtual, mesAtual, d), fora: false });
    }
    const restante = 42 - dias.length;
    for (let d = 1; d <= restante; d++) {
      dias.push({ data: new Date(anoAtual, mesAtual + 1, d), fora: true });
    }
    return dias;
  };

  const dataParaStr = (data: Date) =>
    `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;

  const lembretesNoDia = (data: Date): Lembrete[] =>
    reminders.filter(r => r.data === dataParaStr(data));

  const isHoje = (data: Date) =>
    data.getDate() === hoje.getDate() &&
    data.getMonth() === hoje.getMonth() &&
    data.getFullYear() === hoje.getFullYear();

  const isSelecionado = (data: Date) =>
    diaSelecionado !== null &&
    data.getDate() === diaSelecionado.getDate() &&
    data.getMonth() === diaSelecionado.getMonth() &&
    data.getFullYear() === diaSelecionado.getFullYear();

  const abrirDia = (data: Date) => {
    setDiaSelecionado(data);
    setMostrarModal(true);
    setTitulo('');
    setDescricao('');
    setErro('');
  };

  const fecharModal = () => {
    setMostrarModal(false);
    setDiaSelecionado(null);
  };

  const salvarLembrete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !diaSelecionado) return;
    setEnviando(true);
    setErro('');
    const { error } = await addReminder(titulo, descricao, dataParaStr(diaSelecionado));
    if (error) { setErro(error); }
    else { setTitulo(''); setDescricao(''); }
    setEnviando(false);
  };

  const dias = getDiasDoMes();
  const lembretesNoDiaSelecionado = diaSelecionado ? lembretesNoDia(diaSelecionado) : [];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
      {/* Header */}
      <div className="bg-stone-700 text-white px-5 py-4 flex items-center justify-between">
        <button onClick={mesAnterior} className="p-2 hover:bg-stone-600 rounded-lg transition-colors font-bold text-xl leading-none">‹</button>
        <h2 className="font-semibold text-lg">{MESES[mesAtual]} {anoAtual}</h2>
        <button onClick={proximoMes} className="p-2 hover:bg-stone-600 rounded-lg transition-colors font-bold text-xl leading-none">›</button>
      </div>

      {/* Dias da semana */}
      <div className="grid grid-cols-7 bg-stone-50 border-b border-stone-100">
        {DIAS_SEMANA.map(d => (
          <div key={d} className="text-center text-xs font-semibold text-stone-400 py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Grade */}
      <div className="grid grid-cols-7">
        {dias.map((item, i) => {
          const lembretes = lembretesNoDia(item.data);
          const ehHoje = isHoje(item.data);
          const ehSelecionado = isSelecionado(item.data);

          return (
            <button
              key={i}
              onClick={() => !item.fora && abrirDia(item.data)}
              className={`relative flex flex-col items-center justify-start pt-2 pb-1.5 border-b border-r border-stone-50 min-h-[56px] transition-colors ${
                item.fora
                  ? 'text-stone-200 cursor-default'
                  : 'text-stone-700 hover:bg-amber-50 cursor-pointer'
              } ${ehSelecionado ? 'bg-amber-100' : ''}`}
            >
              <span className={`text-sm w-7 h-7 flex items-center justify-center rounded-full font-medium ${
                ehHoje ? 'bg-stone-700 text-white font-bold' : ''
              }`}>
                {item.data.getDate()}
              </span>
              {lembretes.length > 0 && !item.fora && (
                <div className="flex gap-0.5 mt-0.5">
                  {lembretes.slice(0, 3).map((_, idx) => (
                    <div key={idx} className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Modal bottom sheet */}
      {mostrarModal && diaSelecionado && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={fecharModal}>
          <div
            className="bg-white w-full rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-stone-200 rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-stone-800 text-base capitalize">
                {diaSelecionado.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
              <button onClick={fecharModal} className="text-stone-400 hover:text-stone-600 w-7 h-7 flex items-center justify-center rounded-full hover:bg-stone-100">✕</button>
            </div>

            {lembretesNoDiaSelecionado.length > 0 ? (
              <div className="space-y-2 mb-5">
                {lembretesNoDiaSelecionado.map(r => (
                  <div key={r.id} className="flex items-start justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                    <div>
                      <p className="font-semibold text-stone-800 text-sm">{r.titulo}</p>
                      {r.descricao && <p className="text-xs text-stone-500 mt-0.5">{r.descricao}</p>}
                    </div>
                    <button onClick={() => deleteReminder(r.id)} className="text-stone-300 hover:text-red-400 ml-3 shrink-0">🗑️</button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-stone-400 text-sm mb-5">Nenhum lembrete para este dia.</p>
            )}

            <form onSubmit={salvarLembrete} className="space-y-3 border-t border-stone-100 pt-4">
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">Adicionar lembrete</p>
              <input
                type="text"
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                placeholder="Título *"
                className="w-full px-4 py-2.5 border-2 border-stone-200 rounded-xl focus:outline-none focus:border-stone-400 text-stone-800 text-sm bg-stone-50"
                required
              />
              <input
                type="text"
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                placeholder="Descrição (opcional)"
                className="w-full px-4 py-2.5 border-2 border-stone-200 rounded-xl focus:outline-none focus:border-stone-400 text-stone-800 text-sm bg-stone-50"
              />
              {erro && <p className="text-red-500 text-xs">⚠️ {erro}</p>}
              <button
                type="submit"
                disabled={enviando || !titulo.trim()}
                className="w-full py-3 bg-stone-700 hover:bg-stone-800 disabled:bg-stone-300 text-white font-semibold rounded-xl transition-colors text-sm"
              >
                {enviando ? 'Salvando...' : 'Salvar 💕'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
