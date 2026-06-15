'use client';

import { useState } from 'react';
import { useReminders } from '@/ganchos/useReminders';
import { Lembrete, Categoria, ParaQuem } from '@/lib/supabase';

interface CalendarProps {
  userId: string;
  nomeUsuario: string;
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const CATEGORIAS: { value: Categoria; label: string; emoji: string; cor: string }[] = [
  { value: 'romantico',    label: 'Romântico',   emoji: '💕', cor: 'bg-pink-100 text-pink-700 border-pink-200' },
  { value: 'aniversario',  label: 'Aniversário', emoji: '🎂', cor: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'consulta',     label: 'Consulta',    emoji: '🏥', cor: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'viagem',       label: 'Viagem',      emoji: '✈️', cor: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'outro',        label: 'Outro',       emoji: '📌', cor: 'bg-stone-100 text-stone-700 border-stone-200' },
];

const PARA_QUEM: { value: ParaQuem; label: string; emoji: string }[] = [
  { value: 'os_dois', label: 'Os dois',    emoji: '💑' },
  { value: 'so_eu',   label: 'Só eu',      emoji: '🙋' },
  { value: 'so_amor', label: 'Só meu amor', emoji: '💌' },
];

const COR_CATEGORIA: Record<string, string> = {
  romantico:   'bg-pink-400',
  aniversario: 'bg-amber-400',
  consulta:    'bg-blue-400',
  viagem:      'bg-green-400',
  outro:       'bg-stone-400',
};

function getCatInfo(cat?: string) {
  return CATEGORIAS.find(c => c.value === cat) ?? CATEGORIAS[4];
}

export default function Calendar({ userId, nomeUsuario }: CalendarProps) {
  const hoje = new Date();
  const [mesAtual, setMesAtual] = useState(hoje.getMonth());
  const [anoAtual, setAnoAtual] = useState(hoje.getFullYear());
  const [diaSelecionado, setDiaSelecionado] = useState<Date | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);

  // Formulário
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [hora, setHora] = useState('');
  const [categoria, setCategoria] = useState<Categoria>('outro');
  const [paraQuem, setParaQuem] = useState<ParaQuem>('os_dois');
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

    for (let i = primeiroDia - 1; i >= 0; i--)
      dias.push({ data: new Date(anoAtual, mesAtual - 1, diasMesAnterior - i), fora: true });
    for (let d = 1; d <= totalDias; d++)
      dias.push({ data: new Date(anoAtual, mesAtual, d), fora: false });
    for (let d = 1; d <= 42 - dias.length; d++)
      dias.push({ data: new Date(anoAtual, mesAtual + 1, d), fora: true });

    return dias;
  };

  const dataParaStr = (data: Date) =>
    `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;

  const lembretesNoDia = (data: Date): Lembrete[] =>
    reminders.filter(r => r.data === dataParaStr(data));

  // Filtra por "para_quem": mostra se é "os_dois" ou se "criado_por" é o usuário atual
  const lembretesVisiveis = (lems: Lembrete[]) =>
    lems.filter(r => !r.para_quem || r.para_quem === 'os_dois' || r.criado_por === userId);

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
    setTitulo(''); setDescricao(''); setHora('');
    setCategoria('outro'); setParaQuem('os_dois'); setErro('');
  };

  const fecharModal = () => { setMostrarModal(false); setDiaSelecionado(null); };

  const salvarLembrete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !diaSelecionado) return;
    setEnviando(true);
    setErro('');
    const { error } = await addReminder({
      titulo,
      descricao,
      data: dataParaStr(diaSelecionado),
      hora: hora || undefined,
      categoria,
      para_quem: paraQuem,
    });
    if (error) { setErro(error); }
    else { setTitulo(''); setDescricao(''); setHora(''); }
    setEnviando(false);
  };

  const dias = getDiasDoMes();
  const lembretesNoDiaSelecionado = diaSelecionado
    ? lembretesVisiveis(lembretesNoDia(diaSelecionado))
    : [];

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
          <div key={d} className="text-center text-xs font-semibold text-stone-400 py-2">{d}</div>
        ))}
      </div>

      {/* Grade */}
      <div className="grid grid-cols-7">
        {dias.map((item, i) => {
          const lems = lembretesVisiveis(lembretesNoDia(item.data));
          const ehHoje = isHoje(item.data);
          const ehSelecionado = isSelecionado(item.data);

          return (
            <button
              key={i}
              onClick={() => !item.fora && abrirDia(item.data)}
              className={`relative flex flex-col items-center justify-start pt-2 pb-1.5 border-b border-r border-stone-50 min-h-[56px] transition-colors ${
                item.fora ? 'text-stone-200 cursor-default' : 'text-stone-700 hover:bg-amber-50 cursor-pointer'
              } ${ehSelecionado ? 'bg-amber-100' : ''}`}
            >
              <span className={`text-sm w-7 h-7 flex items-center justify-center rounded-full font-medium ${
                ehHoje ? 'bg-stone-700 text-white font-bold' : ''
              }`}>
                {item.data.getDate()}
              </span>
              {lems.length > 0 && !item.fora && (
                <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center max-w-[40px]">
                  {lems.slice(0, 3).map((r, idx) => (
                    <div
                      key={idx}
                      className={`w-1.5 h-1.5 rounded-full ${COR_CATEGORIA[r.categoria ?? 'outro'] ?? 'bg-stone-400'}`}
                    />
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
            className="bg-white w-full rounded-t-3xl max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-stone-200 rounded-full mx-auto mt-3 mb-4" />

            <div className="px-5 pb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-stone-800 text-base capitalize">
                  {diaSelecionado.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </h3>
                <button onClick={fecharModal} className="text-stone-400 hover:text-stone-600 w-7 h-7 flex items-center justify-center rounded-full hover:bg-stone-100">✕</button>
              </div>

              {/* Lembretes existentes */}
              {lembretesNoDiaSelecionado.length > 0 ? (
                <div className="space-y-2 mb-5">
                  {lembretesNoDiaSelecionado.map(r => {
                    const cat = getCatInfo(r.categoria);
                    const pq = PARA_QUEM.find(p => p.value === r.para_quem) ?? PARA_QUEM[0];
                    return (
                      <div key={r.id} className={`flex items-start justify-between border rounded-xl px-3 py-2.5 ${cat.cor}`}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-sm">{cat.emoji}</span>
                            <p className="font-semibold text-sm truncate">{r.titulo}</p>
                          </div>
                          {r.descricao && <p className="text-xs opacity-70 truncate">{r.descricao}</p>}
                          <div className="flex items-center gap-2 mt-1">
                            {r.hora && <span className="text-xs opacity-60">⏰ {r.hora}</span>}
                            <span className="text-xs opacity-60">{pq.emoji} {pq.label}</span>
                          </div>
                        </div>
                        <button onClick={() => deleteReminder(r.id)} className="text-current opacity-30 hover:opacity-70 ml-2 shrink-0">🗑️</button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-stone-400 text-sm mb-5">Nenhum lembrete para este dia.</p>
              )}

              {/* Formulário novo lembrete */}
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

                <input
                  type="time"
                  value={hora}
                  onChange={e => setHora(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-stone-200 rounded-xl focus:outline-none focus:border-stone-400 text-stone-800 text-sm bg-stone-50"
                />

                {/* Categoria */}
                <div>
                  <p className="text-xs text-stone-400 mb-1.5">Categoria</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {CATEGORIAS.map(cat => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setCategoria(cat.value)}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                          categoria === cat.value ? cat.cor + ' ring-2 ring-offset-1 ring-stone-400' : 'border-stone-200 text-stone-500 bg-white'
                        }`}
                      >
                        {cat.emoji} {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Para quem */}
                <div>
                  <p className="text-xs text-stone-400 mb-1.5">Para quem</p>
                  <div className="flex gap-2">
                    {PARA_QUEM.map(pq => (
                      <button
                        key={pq.value}
                        type="button"
                        onClick={() => setParaQuem(pq.value)}
                        className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl border text-xs font-medium transition-all ${
                          paraQuem === pq.value
                            ? 'bg-stone-700 text-white border-stone-700'
                            : 'border-stone-200 text-stone-500 bg-white hover:bg-stone-50'
                        }`}
                      >
                        <span className="text-lg">{pq.emoji}</span>
                        {pq.label}
                      </button>
                    ))}
                  </div>
                </div>

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
        </div>
      )}
    </div>
  );
}
