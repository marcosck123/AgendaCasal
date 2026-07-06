'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Lembrete } from '@/lib/supabase';
import { useCasalConfig } from '@/ganchos/useCasalConfig';
import { useCasalContext, iniciaisCasal } from '@/ganchos/CasalContext';
import { Heart, ProgressRing } from './UIKit';
import Icon from './Icon';

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

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

function saudacao() {
  const h = new Date().getHours();
  if (h < 6) return 'Boa madrugada';
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function catColor(cat?: string): string {
  const map: Record<string, string> = {
    romantico: 'var(--cat-romantico)',
    aniversario: 'var(--cat-aniversario)',
    consulta: 'var(--cat-consulta)',
    viagem: 'var(--cat-viagem)',
    outro: 'var(--cat-outro)',
  };
  return map[cat ?? 'outro'] ?? 'var(--cat-outro)';
}

interface HomeProps {
  userId: string;
  nomeUsuario: string;
}

interface LembreteRowProps {
  l: Lembrete;
  compact?: boolean;
  onAgenda?: () => void;
}

function LembreteRow({ l, compact = false, onAgenda }: LembreteRowProps) {
  return (
    <div
      className="card"
      onClick={onAgenda}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: compact ? '11px 14px' : '13px 15px',
        cursor: onAgenda ? 'pointer' : 'default',
      }}
    >
      <div style={{
        width: 4, alignSelf: 'stretch', borderRadius: 999,
        background: catColor(l.categoria), minHeight: 30,
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14, fontWeight: 500,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{l.titulo}</div>
        {l.descricao && !compact && (
          <div style={{
            fontSize: 12.5, color: 'var(--muted)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{l.descricao}</div>
        )}
      </div>
      {l.hora && (
        <span style={{ fontSize: 13, color: 'var(--muted)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
          {l.hora}
        </span>
      )}
    </div>
  );
}

interface LembreteBlocoProps {
  titulo: string;
  itens: Lembrete[];
}

function LembreteBloco({ titulo, itens }: LembreteBlocoProps) {
  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between', padding: '2px 4px 8px' }}>
        <span className="eyebrow">{titulo}</span>
      </div>
      {itens.length === 0 ? (
        <div className="card" style={{ padding: 16, color: 'var(--soft)', fontSize: 13, textAlign: 'center' }}>
          Nada marcado {titulo === 'Hoje' ? 'pra hoje' : 'pra amanhã'}.
        </div>
      ) : (
        <div className="stack" style={{ gap: 9 }}>
          {itens.map((l) => <LembreteRow key={l.id} l={l} />)}
        </div>
      )}
    </div>
  );
}

export default function Home({ userId, nomeUsuario }: HomeProps) {
  const { config } = useCasalConfig();
  const { perfil, parceiro, solo, casal } = useCasalContext();
  const router = useRouter();
  const [lembretes, setLembretes] = useState<Lembrete[]>([]);
  const [frase] = useState(() => FRASES[new Date().getDate() % FRASES.length]);

  const casalId = casal?.id ?? null;

  useEffect(() => {
    if (!casalId) return;
    const hoje = new Date().toISOString().split('T')[0];
    const amanha = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    supabase
      .from('lembretes')
      .select('*')
      .eq('casal_id', casalId)
      .in('data', [hoje, amanha])
      .order('data')
      .order('hora', { nullsFirst: false })
      .then(({ data }) => { if (data) setLembretes(data as Lembrete[]); });
  }, [casalId]);

  const dataInicio = config['data_inicio'] || '';
  const diasJuntos = dataInicio
    ? Math.floor((Date.now() - new Date(dataInicio + 'T00:00:00').getTime()) / 86400000)
    : 0;

  const hoje = new Date().toISOString().split('T')[0];
  const amanha = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  // Visibility filter
  const lembretesVisiveis = (lems: Lembrete[]) =>
    lems.filter(r => !r.para_quem || r.para_quem === 'os_dois' || r.criado_por === userId);

  const lembretesHoje = lembretesVisiveis(lembretes.filter(l => l.data === hoje));
  const lembretesAmanha = lembretesVisiveis(lembretes.filter(l => l.data === amanha));

  const proximaDataEspecial = lembretesVisiveis(lembretes)
    .filter(l => l.categoria === 'aniversario' || l.categoria === 'romantico')
    .sort((a, b) => a.data.localeCompare(b.data))[0];

  const diasParaEspecial = proximaDataEspecial
    ? Math.ceil((new Date(proximaDataEspecial.data).getTime() - Date.now()) / 86400000)
    : null;

  const hojeDate = new Date();
  const hojeStr = `${hojeDate.getDate()} de ${MESES[hojeDate.getMonth()]} de ${hojeDate.getFullYear()}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* App bar */}
      <div className="appbar">
        <div>
          <div className="row" style={{ gap: 7 }}>
            <span className="appbar-title">{saudacao()}, {nomeUsuario}</span>
            <Heart size={16} beat />
          </div>
          <div className="appbar-sub">{hojeStr}</div>
        </div>
        <div className="appbar-spacer" />
        <div style={{
          width: 40, height: 40, borderRadius: 13,
          background: 'linear-gradient(135deg, var(--brand-grad-start), var(--brand-grad-end))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff7f0', fontSize: 13, fontWeight: 700, letterSpacing: '0.03em',
        }}>
          {iniciaisCasal(perfil?.nome ?? nomeUsuario, parceiro?.nome)}
        </div>
      </div>

      {/* Scroll content */}
      <div className="screen-scroll pad" style={{ paddingBottom: 24 }}>
        <div className="section-gap screen-enter">

          {/* Solo: convite / Casal: Juntos há X dias */}
          {solo ? (
          <div
            className="card card-strong"
            onClick={() => router.push('/dashboard/config')}
            style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 18, cursor: 'pointer' }}
          >
            <div style={{
              width: 56, height: 56, borderRadius: 18, flexShrink: 0,
              background: 'var(--romance-soft)', color: 'var(--romance)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
            }}>💌</div>
            <div style={{ flex: 1 }}>
              <div className="eyebrow">Seu espaço</div>
              <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.02em' }}>
                Convide alguém especial 💌
              </div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
                Crie um convite e transformem isso aqui em &ldquo;Nosso&rdquo;.
              </div>
            </div>
            <Icon name="chevronR" size={18} />
          </div>
          ) : (
          <div className="card card-strong" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 18 }}>
            <ProgressRing value={diasJuntos} max={365} size={72} color="var(--romance)">
              <Heart size={20} beat />
            </ProgressRing>
            <div style={{ flex: 1 }}>
              <div className="eyebrow">Juntos há</div>
              <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.05 }}>
                {diasJuntos.toLocaleString('pt-BR')}{' '}
                <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--muted)' }}>dias</span>
              </div>
              {dataInicio && (
                <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
                  desde {new Date(dataInicio + 'T00:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              )}
            </div>
          </div>
          )}

          {/* Frase do dia */}
          <div className="card" style={{ display: 'flex', gap: 13, alignItems: 'flex-start' }}>
            <div style={{ color: 'var(--romance)', marginTop: 1 }}>
              <Icon name="sparkle" size={20} />
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Frase do dia</div>
              <p className="serif" style={{ fontSize: 17, lineHeight: 1.5 }}>{frase}</p>
            </div>
          </div>

          {/* Próxima data especial */}
          {proximaDataEspecial && diasParaEspecial !== null && diasParaEspecial >= 0 && (
            <div className="card" style={{
              textAlign: 'left', display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                background: 'var(--romance-soft)', color: 'var(--romance)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
              }}>
                {proximaDataEspecial.categoria === 'aniversario' ? '🎂' : '💕'}
              </div>
              <div style={{ flex: 1 }}>
                <div className="eyebrow" style={{ marginBottom: 4 }}>Próxima data especial</div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{proximaDataEspecial.titulo}</div>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                  {(() => {
                    const d = new Date(proximaDataEspecial.data + 'T00:00:00');
                    return `${d.getDate()} de ${MESES[d.getMonth()]}`;
                  })()}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--romance)', letterSpacing: '-0.03em' }}>
                  {diasParaEspecial === 0 ? '🎊' : diasParaEspecial}
                </div>
                <div style={{ fontSize: 11, color: 'var(--soft)' }}>
                  {diasParaEspecial === 0 ? 'hoje' : diasParaEspecial === 1 ? 'dia' : 'dias'}
                </div>
              </div>
            </div>
          )}

          {/* Lembretes hoje / amanhã */}
          <LembreteBloco titulo="Hoje" itens={lembretesHoje} />
          {lembretesAmanha.length > 0 && (
            <LembreteBloco titulo="Amanhã" itens={lembretesAmanha} />
          )}
        </div>
      </div>
    </div>
  );
}
