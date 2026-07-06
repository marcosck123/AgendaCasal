'use client';

import { useState } from 'react';
import { useReminders } from '@/ganchos/useReminders';
import { Lembrete, Categoria, ParaQuem } from '@/lib/supabase';
import { Sheet } from './UIKit';
import Icon from './Icon';

interface CalendarProps {
  userId: string;
  nomeUsuario: string;
}

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const DIAS_SEMANA_ABR = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

interface CatDef {
  id: Categoria;
  label: string;
  varc: string;
}

const CATEGORIAS: CatDef[] = [
  { id: 'romantico',   label: 'Romântico',   varc: '--cat-romantico'   },
  { id: 'aniversario', label: 'Aniversário', varc: '--cat-aniversario' },
  { id: 'consulta',    label: 'Consulta',    varc: '--cat-consulta'    },
  { id: 'viagem',      label: 'Viagem',      varc: '--cat-viagem'      },
  { id: 'outro',       label: 'Outro',       varc: '--cat-outro'       },
];

const PARA_QUEM_OPS: { value: ParaQuem; label: string }[] = [
  { value: 'os_dois', label: 'Os dois' },
  { value: 'so_eu',   label: 'Marcos'  },
  { value: 'so_amor', label: 'Ana'     },
];

function catColor(cat?: string) {
  const map: Record<string, string> = {
    romantico: 'var(--cat-romantico)',
    aniversario: 'var(--cat-aniversario)',
    consulta: 'var(--cat-consulta)',
    viagem: 'var(--cat-viagem)',
    outro: 'var(--cat-outro)',
  };
  return map[cat ?? 'outro'] ?? 'var(--cat-outro)';
}

function catLabel(cat?: string) {
  return CATEGORIAS.find(c => c.id === cat)?.label ?? 'Outro';
}

function isoToday() {
  return new Date().toISOString().split('T')[0];
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export default function Calendar({ userId, nomeUsuario: _nomeUsuario }: CalendarProps) {
  const hoje = new Date();
  const [ym, setYm] = useState({ y: hoje.getFullYear(), m: hoje.getMonth() });
  const [sel, setSel] = useState(isoToday());
  const [sheet, setSheet] = useState<'dia' | 'novo' | null>(null);
  const [view, setView] = useState<'calendario' | 'lista'>('calendario');

  // Form state
  const [form, setForm] = useState({
    titulo: '', descricao: '', hora: '',
    categoria: 'romantico' as Categoria,
    paraQuem: 'os_dois' as ParaQuem,
    data: isoToday(),
  });
  const setF = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const [repetir, setRepetir] = useState(false);
  const [dataFim, setDataFim] = useState(isoToday());
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  const { reminders, addReminder, deleteReminder } = useReminders(userId);

  const meus = reminders.filter(r =>
    !r.para_quem || r.para_quem === 'os_dois' || r.criado_por === userId
  );

  const prev = () => setYm(({ y, m }) => m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 });
  const next = () => setYm(({ y, m }) => m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 });

  const { y, m } = ym;
  const todayISO = isoToday();
  const startDow = new Date(y, m, 1).getDay();
  const daysIn = new Date(y, m + 1, 0).getDate();
  const mkIso = (d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

  const byDay: Record<string, Lembrete[]> = {};
  meus.forEach(l => { (byDay[l.data] = byDay[l.data] || []).push(l); });

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysIn; d++) cells.push(d);

  const openDia = (iso: string) => { setSel(iso); setSheet('dia'); };
  const openNovo = () => { setForm(f => ({ ...f, data: sel })); setSheet('novo'); };

  const handleSalvar = async () => {
    if (!form.titulo.trim()) return;
    setEnviando(true);
    setErro('');

    const datas: string[] = [];
    if (repetir && dataFim >= form.data) {
      const cur = new Date(form.data + 'T00:00:00');
      const fim = new Date(dataFim + 'T00:00:00');
      while (cur <= fim) {
        datas.push(cur.toISOString().split('T')[0]);
        cur.setDate(cur.getDate() + 1);
      }
    } else {
      datas.push(form.data);
    }

    let lastError = '';
    for (const d of datas) {
      const { error } = await addReminder({
        titulo: form.titulo,
        descricao: form.descricao,
        data: d,
        hora: form.hora || undefined,
        categoria: form.categoria,
        para_quem: form.paraQuem,
      });
      if (error) { lastError = error; break; }
    }

    if (lastError) {
      setErro(lastError);
    } else {
      setForm({ titulo: '', descricao: '', hora: '', categoria: 'romantico', paraQuem: 'os_dois', data: sel });
      setRepetir(false);
      setSheet('dia');
    }
    setEnviando(false);
  };

  const futuros = [...meus].sort((a, b) =>
    a.data.localeCompare(b.data) || (a.hora || '').localeCompare(b.hora || '')
  );
  const grupos: Record<string, Lembrete[]> = {};
  futuros.forEach(l => { (grupos[l.data] = grupos[l.data] || []).push(l); });
  const datas = Object.keys(grupos).sort();

  const diasSelecionado = meus.filter(l => l.data === sel).sort((a, b) =>
    (a.hora || '').localeCompare(b.hora || '')
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* App bar */}
      <div className="appbar">
        <span className="appbar-title">Agenda</span>
        <div className="appbar-spacer" />
        <button
          className="icon-btn"
          style={{ marginLeft: 8 }}
          onClick={() => { setSel(isoToday()); openNovo(); }}
          aria-label="Novo lembrete"
        >
          <Icon name="plus" size={20} />
        </button>
      </div>

      {/* Segmented control */}
      <div className="pad" style={{ paddingBottom: 12 }}>
        <div className="seg">
          <button className={view === 'calendario' ? 'on' : ''} onClick={() => setView('calendario')}>Calendário</button>
          <button className={view === 'lista' ? 'on' : ''} onClick={() => setView('lista')}>Lista</button>
        </div>
      </div>

      <div className="screen-scroll" style={{ paddingBottom: 24 }}>
        {view === 'calendario' ? (
          <div className="pad" style={{ paddingTop: 4 }}>
            {/* Month nav */}
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
              <button className="icon-btn" onClick={prev}><Icon name="chevronL" size={18} /></button>
              <div style={{ fontSize: 16, fontWeight: 600, textTransform: 'capitalize' }}>
                {MESES[m]} {y}
              </div>
              <button className="icon-btn" onClick={next}><Icon name="chevronR" size={18} /></button>
            </div>

            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 4 }}>
              {DIAS_SEMANA_ABR.map((d, i) => (
                <div key={i} style={{
                  textAlign: 'center', fontSize: 11, fontWeight: 600,
                  color: 'var(--soft)', padding: '4px 0',
                }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
              {cells.map((d, i) => {
                if (!d) return <div key={i} />;
                const iso = mkIso(d);
                const evs = byDay[iso] || [];
                const isToday = iso === todayISO;
                const isSel = iso === sel;
                const cats = Array.from(new Set(evs.map(e => e.categoria))).slice(0, 4);
                return (
                  <button
                    key={i}
                    onClick={() => openDia(iso)}
                    style={{
                      aspectRatio: '1 / 1.05', borderRadius: 13,
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      gap: 4, position: 'relative',
                      background: isSel ? 'var(--text)' : isToday ? 'var(--accent-soft)' : 'transparent',
                      color: isSel ? 'var(--bg)' : isToday ? 'var(--accent)' : 'var(--text)',
                      fontSize: 14, fontWeight: isToday || isSel ? 600 : 400,
                      transition: 'background var(--dur-base)',
                      border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    <span>{d}</span>
                    <span style={{ display: 'flex', gap: 2, height: 5 }}>
                      {cats.map((c, j) => (
                        <span key={j} style={{
                          width: 5, height: 5, borderRadius: 99,
                          background: isSel ? 'var(--bg)' : catColor(c),
                          display: 'inline-block',
                        }} />
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="row" style={{ flexWrap: 'wrap', gap: 10, marginTop: 18, justifyContent: 'center' }}>
              {CATEGORIAS.map(c => (
                <span key={c.id} className="row" style={{ gap: 6, fontSize: 11.5, color: 'var(--muted)' }}>
                  <span className="dot" style={{ background: `var(${c.varc})` }} /> {c.label}
                </span>
              ))}
            </div>
          </div>
        ) : (
          /* Lista view */
          <div className="pad section-gap" style={{ paddingTop: 6 }}>
            {datas.map(iso => {
              const d = new Date(iso + 'T00:00:00');
              const isToday = iso === todayISO;
              return (
                <div key={iso}>
                  <div className="row" style={{ gap: 10, padding: '2px 4px 8px', alignItems: 'baseline' }}>
                    <span style={{
                      fontSize: 22, fontWeight: 600, letterSpacing: '-0.03em',
                      color: isToday ? 'var(--accent)' : 'var(--text)',
                    }}>{d.getDate()}</span>
                    <span style={{ fontSize: 12, color: 'var(--soft)', textTransform: 'capitalize' }}>
                      {d.toLocaleDateString('pt-BR', { weekday: 'short' })} · {MESES[d.getMonth()].slice(0, 3)}
                    </span>
                    {isToday && (
                      <span className="chip" style={{ padding: '2px 9px', fontSize: 10.5, color: 'var(--accent)', borderColor: 'var(--accent)' }}>
                        hoje
                      </span>
                    )}
                  </div>
                  <div className="stack" style={{ gap: 8 }}>
                    {grupos[iso].map(l => (
                      <div
                        key={l.id}
                        className="card"
                        onClick={() => openDia(iso)}
                        style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: 14, cursor: 'pointer' }}
                      >
                        <div style={{
                          width: 4, alignSelf: 'stretch', minHeight: 34,
                          borderRadius: 999, background: catColor(l.categoria),
                        }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="row" style={{ gap: 8, marginBottom: 2 }}>
                            <span style={{ fontSize: 14.5, fontWeight: 600 }}>{l.titulo}</span>
                            {l.hora && (
                              <span style={{ fontSize: 12.5, color: 'var(--muted)', marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}>
                                {l.hora}
                              </span>
                            )}
                          </div>
                          {l.descricao && (
                            <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.4 }}>{l.descricao}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {datas.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--soft)', padding: '40px 0' }}>
                Nenhum lembrete cadastrado.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sheet: dia */}
      {sheet === 'dia' && (
        <Sheet
          title={new Date(sel + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          onClose={() => setSheet(null)}
        >
          {diasSelecionado.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--soft)', fontSize: 14, padding: '18px 0 24px' }}>
              Nenhum lembrete neste dia.
            </div>
          ) : (
            <div className="stack" style={{ gap: 9, marginBottom: 16 }}>
              {diasSelecionado.map(l => (
                <div key={l.id} className="card" style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: 14 }}>
                  <div style={{
                    width: 4, alignSelf: 'stretch', minHeight: 34,
                    borderRadius: 999, background: catColor(l.categoria),
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="row" style={{ gap: 8, marginBottom: 2 }}>
                      <span style={{ fontSize: 14.5, fontWeight: 600 }}>{l.titulo}</span>
                      {l.hora && (
                        <span style={{ fontSize: 12.5, color: 'var(--muted)', marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}>
                          {l.hora}
                        </span>
                      )}
                    </div>
                    {l.descricao && (
                      <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.4 }}>{l.descricao}</div>
                    )}
                    <div className="row" style={{ gap: 8, marginTop: 8 }}>
                      <span className="chip" style={{ padding: '3px 9px', fontSize: 11, color: catColor(l.categoria) }}>
                        <span className="dot" style={{ background: catColor(l.categoria) }} />
                        {catLabel(l.categoria)}
                      </span>
                    </div>
                  </div>
                  <button
                    className="icon-btn"
                    style={{ width: 34, height: 34, color: 'var(--danger)' }}
                    onClick={() => deleteReminder(l.id)}
                    aria-label="Excluir"
                  >
                    <Icon name="trash" size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <button className="btn btn-primary btn-block" onClick={openNovo}>
            <Icon name="plus" size={18} /> Adicionar lembrete
          </button>
        </Sheet>
      )}

      {/* Sheet: novo lembrete */}
      {sheet === 'novo' && (
        <Sheet title="Novo lembrete" onClose={() => setSheet('dia')}>
          <div className="stack" style={{ gap: 14 }}>
            <div>
              <label className="field-label">Título</label>
              <input
                className="input"
                placeholder="O que vão fazer?"
                value={form.titulo}
                autoFocus
                onChange={e => setF('titulo', e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">Descrição <span style={{ color: 'var(--soft)' }}>(opcional)</span></label>
              <textarea
                className="input"
                rows={2}
                placeholder="Detalhes…"
                value={form.descricao}
                onChange={e => setF('descricao', e.target.value)}
              />
            </div>
            {/* Toggle repetir */}
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="field-label" style={{ marginBottom: 0 }}>Repetir por período</span>
              <button
                type="button"
                className={'toggle' + (repetir ? ' on' : '')}
                onClick={() => setRepetir(r => !r)}
                aria-label="Repetir por período"
              >
                <span className="slider" />
              </button>
            </div>

            {!repetir ? (
              <div className="row" style={{ gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label className="field-label">Data</label>
                  <input className="input" type="date" value={form.data} onChange={e => setF('data', e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="field-label">Hora <span style={{ color: 'var(--soft)' }}>(opc.)</span></label>
                  <input className="input" type="time" value={form.hora} onChange={e => setF('hora', e.target.value)} />
                </div>
              </div>
            ) : (
              <div className="card" style={{ padding: 14, background: 'var(--accent-soft)', borderColor: 'var(--accent)' }}>
                <div className="row" style={{ gap: 12, marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label className="field-label">De</label>
                    <input className="input" type="date" value={form.data} onChange={e => setF('data', e.target.value)} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="field-label">Até</label>
                    <input className="input" type="date" value={dataFim} min={form.data}
                      onChange={e => setDataFim(e.target.value)} />
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="field-label">Hora <span style={{ color: 'var(--soft)' }}>(opc.)</span></label>
                  <input className="input" type="time" value={form.hora} onChange={e => setF('hora', e.target.value)} />
                </div>
                {form.data && dataFim && dataFim >= form.data && (
                  <p style={{ fontSize: 12, color: 'var(--accent)', marginTop: 10, fontWeight: 500 }}>
                    {(() => {
                      const dias = Math.round((new Date(dataFim + 'T00:00:00').getTime() - new Date(form.data + 'T00:00:00').getTime()) / 86400000) + 1;
                      return `Vai criar ${dias} lembrete${dias > 1 ? 's' : ''} (um por dia)`;
                    })()}
                  </p>
                )}
              </div>
            )}
            <div>
              <label className="field-label">Categoria</label>
              <div className="row" style={{ flexWrap: 'wrap', gap: 7 }}>
                {CATEGORIAS.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setF('categoria', c.id)}
                    className="chip"
                    style={{
                      cursor: 'pointer', padding: '7px 12px',
                      background: form.categoria === c.id
                        ? `color-mix(in srgb, var(${c.varc}) 14%, transparent)`
                        : 'var(--panel)',
                      borderColor: form.categoria === c.id ? `var(${c.varc})` : 'var(--border)',
                      color: form.categoria === c.id ? `var(${c.varc})` : 'var(--muted)',
                    }}
                  >
                    <span className="dot" style={{ background: `var(${c.varc})` }} /> {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="field-label">Para quem</label>
              <div className="seg">
                {PARA_QUEM_OPS.map(pq => (
                  <button
                    key={pq.value}
                    className={form.paraQuem === pq.value ? 'on' : ''}
                    onClick={() => setF('paraQuem', pq.value)}
                  >
                    {pq.label}
                  </button>
                ))}
              </div>
              {form.paraQuem !== 'os_dois' && (
                <p style={{ fontSize: 11.5, color: 'var(--soft)', marginTop: 8 }}>
                  Só {PARA_QUEM_OPS.find(p => p.value === form.paraQuem)?.label} vai ver este lembrete.
                </p>
              )}
            </div>

            {erro && (
              <p style={{ fontSize: 13, color: 'var(--danger)' }}>{erro}</p>
            )}

            <div className="row" style={{ gap: 10, marginTop: 4 }}>
              <button className="btn" style={{ flex: 1 }} onClick={() => setSheet('dia')}>Cancelar</button>
              <button
                className="btn btn-primary"
                style={{ flex: 1.4, opacity: form.titulo.trim() && !enviando ? 1 : 0.5 }}
                disabled={!form.titulo.trim() || enviando}
                onClick={handleSalvar}
              >
                {enviando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </Sheet>
      )}
    </div>
  );
}
