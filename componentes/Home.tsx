'use client';

import { useEffect, useState } from 'react';
import { supabase, Lembrete } from '@/lib/supabase';
import { useCasalConfig } from '@/ganchos/useCasalConfig';

const FRASES = [
  'O amor não é olhar um para o outro, mas olhar juntos na mesma direção.',
  'Você é a melhor parte dos meus dias.',
  'Cada momento ao seu lado é um presente.',
  'Amar é encontrar em outra pessoa a sua própria felicidade.',
  'O que fazemos por amor fica além do bem e do mal.',
  'A felicidade é real quando compartilhada.',
  'Você transforma meus dias comuns em extraordinários.',
  'Com você, qualquer lugar se torna lar.',
  'Dois corações que batem juntos nunca estão sozinhos.',
  'Você é meu maior aventura e meu porto seguro.',
  'Amar é a forma mais bonita de ser corajoso.',
  'Nada me faz mais feliz do que estar ao seu lado.',
];

interface HomeProps {
  userId: string;
  nomeUsuario: string;
}

export default function Home({ userId, nomeUsuario }: HomeProps) {
  const { config } = useCasalConfig();
  const [lembretes, setLembretes] = useState<Lembrete[]>([]);
  const [frase] = useState(() => FRASES[new Date().getDate() % FRASES.length]);

  useEffect(() => {
    const hoje = new Date().toISOString().split('T')[0];
    const amanha = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    supabase
      .from('lembretes')
      .select('*')
      .in('data', [hoje, amanha])
      .order('data')
      .order('hora', { nullsFirst: false })
      .then(({ data }) => { if (data) setLembretes(data as Lembrete[]); });
  }, []);

  const dataInicio = config['data_inicio'];
  const diasJuntos = dataInicio
    ? Math.floor((Date.now() - new Date(dataInicio).getTime()) / 86400000)
    : null;

  const hoje = new Date().toISOString().split('T')[0];
  const amanha = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const lembretesHoje = lembretes.filter(l => l.data === hoje);
  const lembretesAmanha = lembretes.filter(l => l.data === amanha);

  const proximaDataEspecial = lembretes
    .filter(l => l.categoria === 'aniversario' || l.categoria === 'romantico')
    .sort((a, b) => a.data.localeCompare(b.data))[0];

  const diasParaEspecial = proximaDataEspecial
    ? Math.ceil((new Date(proximaDataEspecial.data).getTime() - Date.now()) / 86400000)
    : null;

  const nomeAmor = config['nome_amor'] || 'Amor';

  const saudacao = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <div className="space-y-4 px-3 py-4">
      {/* Saudação */}
      <div className="bg-gradient-to-br from-stone-700 to-stone-800 rounded-2xl p-5 text-white">
        <p className="text-stone-300 text-sm">{saudacao()},</p>
        <h2 className="text-2xl font-bold mt-0.5">{nomeUsuario} 💕</h2>
        {diasJuntos !== null && (
          <div className="mt-3 bg-white/10 rounded-xl px-4 py-2.5 inline-block">
            <p className="text-xs text-stone-300">Juntos há</p>
            <p className="text-xl font-bold">{diasJuntos} dias <span className="text-base">🥰</span></p>
          </div>
        )}
      </div>

      {/* Frase do dia */}
      <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
        <p className="text-xs font-semibold text-amber-600 mb-1">✨ Frase do dia</p>
        <p className="text-sm text-stone-700 italic">"{frase}"</p>
      </div>

      {/* Próxima data especial */}
      {proximaDataEspecial && diasParaEspecial !== null && diasParaEspecial >= 0 && (
        <div className="bg-pink-50 border border-pink-100 rounded-2xl px-4 py-3 flex items-center gap-3">
          <span className="text-2xl">🎉</span>
          <div>
            <p className="text-xs font-semibold text-pink-500">Próxima data especial</p>
            <p className="font-bold text-stone-800">{proximaDataEspecial.titulo}</p>
            <p className="text-xs text-stone-500">
              {diasParaEspecial === 0 ? 'Hoje! 🎊' : `em ${diasParaEspecial} dia${diasParaEspecial > 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
      )}

      {/* Lembretes de hoje */}
      <div>
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">Hoje</p>
        {lembretesHoje.length === 0 ? (
          <div className="bg-white border border-stone-100 rounded-2xl px-4 py-3 text-sm text-stone-400">
            Nenhum lembrete para hoje 🌿
          </div>
        ) : (
          <div className="space-y-2">
            {lembretesHoje.map(l => (
              <div key={l.id} className="bg-white border border-stone-100 rounded-2xl px-4 py-3 flex items-start gap-3 shadow-sm">
                <span className="text-lg mt-0.5">
                  {l.categoria === 'romantico' ? '💕' : l.categoria === 'aniversario' ? '🎂' : l.categoria === 'consulta' ? '🏥' : l.categoria === 'viagem' ? '✈️' : '📌'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-stone-800 text-sm">{l.titulo}</p>
                  {l.descricao && <p className="text-xs text-stone-500 mt-0.5 truncate">{l.descricao}</p>}
                  {l.hora && <p className="text-xs text-stone-400 mt-0.5">⏰ {l.hora}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lembretes de amanhã */}
      {lembretesAmanha.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">Amanhã</p>
          <div className="space-y-2">
            {lembretesAmanha.map(l => (
              <div key={l.id} className="bg-stone-50 border border-stone-100 rounded-2xl px-4 py-3 flex items-start gap-3">
                <span className="text-lg mt-0.5">
                  {l.categoria === 'romantico' ? '💕' : l.categoria === 'aniversario' ? '🎂' : l.categoria === 'consulta' ? '🏥' : l.categoria === 'viagem' ? '✈️' : '📌'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-stone-600 text-sm">{l.titulo}</p>
                  {l.hora && <p className="text-xs text-stone-400 mt-0.5">⏰ {l.hora}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pensamento para o amor */}
      <div className="bg-white border border-stone-100 rounded-2xl px-4 py-4 text-center shadow-sm">
        <p className="text-2xl mb-2">💌</p>
        <p className="text-sm text-stone-500">Mande uma mensagem para <span className="font-semibold text-stone-700">{nomeAmor}</span></p>
      </div>
    </div>
  );
}
