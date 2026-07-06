'use client';

import { useState } from 'react';
import { useNos } from '@/ganchos/useNos';
import { useCasalContext } from '@/ganchos/CasalContext';
import { ProgressRing, Sheet } from './UIKit';
import Icon from './Icon';

interface NosProps {
  userId: string;
}

const HUMOR_OPCOES = [
  { emoji: '😍', label: 'Apaixonado' },
  { emoji: '😊', label: 'Feliz' },
  { emoji: '😐', label: 'Normal' },
  { emoji: '😔', label: 'Triste' },
  { emoji: '😴', label: 'Cansado' },
  { emoji: '🥰', label: 'Romântico' },
  { emoji: '😂', label: 'Divertido' },
  { emoji: '😤', label: 'Estressado' },
];

export default function Nos({ userId }: NosProps) {
  const { parceiro, solo } = useCasalContext();
  const { bucket, timeline, humores, loading, addBucket, toggleBucket, deleteBucket, addTimeline, deleteTimeline, registrarHumor } = useNos(userId);
  const [sub, setSub] = useState<'lista' | 'momentos' | 'humor'>('lista');
  const [novoBucket, setNovoBucket] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [formMomento, setFormMomento] = useState({ titulo: '', data: new Date().toISOString().split('T')[0], descricao: '' });
  const [salvando, setSalvando] = useState(false);

  const meuHumor = humores.find(h => h.usuario_id === userId);
  const outroHumor = humores.find(h => h.usuario_id !== userId);

  const handleAddBucket = () => {
    if (!novoBucket.trim()) return;
    addBucket(novoBucket.trim());
    setNovoBucket('');
  };

  const handleAddTimeline = async () => {
    if (!formMomento.titulo.trim() || !formMomento.data) return;
    setSalvando(true);
    await addTimeline(formMomento.titulo, formMomento.data, formMomento.descricao);
    setFormMomento({ titulo: '', data: new Date().toISOString().split('T')[0], descricao: '' });
    setOpenForm(false);
    setSalvando(false);
  };

  const formatarData = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  const feitos = bucket.filter(b => b.concluido).length;

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--muted)' }}>Carregando...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* App bar */}
      <div className="appbar" style={{ paddingBottom: 10 }}>
        <span className="appbar-title">Nós</span>
        <div className="appbar-spacer" />
      </div>

      {/* Segmented control */}
      <div className="pad" style={{ paddingBottom: 12 }}>
        <div className="seg">
          {([['lista', 'Lista'], ['momentos', 'Momentos'], ['humor', 'Humor']] as const).map(([v, l]) => (
            <button key={v} className={sub === v ? 'on' : ''} onClick={() => setSub(v)}>{l}</button>
          ))}
        </div>
      </div>

      <div className="screen-scroll pad" style={{ paddingBottom: 24 }}>
        <div className="screen-enter section-gap" key={sub}>

          {/* LISTA (Bucket list) */}
          {sub === 'lista' && (
            <>
              <div className="card card-strong" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <ProgressRing value={feitos} max={bucket.length || 1} size={56} color="var(--accent)">
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{feitos}/{bucket.length}</span>
                </ProgressRing>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{solo ? 'Minha lista' : 'Lista do casal'}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>{solo ? 'sonhos pra viver' : 'coisas pra viver juntos'}</div>
                </div>
              </div>

              <div className="row" style={{ gap: 8 }}>
                <input
                  className="input"
                  placeholder="Adicionar um sonho…"
                  value={novoBucket}
                  onChange={e => setNovoBucket(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddBucket()}
                />
                <button
                  className="icon-btn"
                  style={{ background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)', flexShrink: 0 }}
                  onClick={handleAddBucket}
                >
                  <Icon name="plus" size={20} />
                </button>
              </div>

              {bucket.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--soft)' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🗒️</div>
                  <p>Lista vazia</p>
                  <p style={{ fontSize: 13, marginTop: 4 }}>Adicionem lugares para ir, coisas para fazer!</p>
                </div>
              ) : (
                <div className="stack" style={{ gap: 9 }}>
                  {bucket.map(item => (
                    <div
                      key={item.id}
                      className="card"
                      style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 15px', opacity: item.concluido ? 0.6 : 1 }}
                    >
                      <button
                        onClick={() => toggleBucket(item.id, !item.concluido)}
                        style={{
                          width: 24, height: 24, borderRadius: 8, flexShrink: 0,
                          border: `2px solid ${item.concluido ? 'var(--accent)' : 'var(--border-strong)'}`,
                          background: item.concluido ? 'var(--accent)' : 'transparent',
                          color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all var(--dur-base)', cursor: 'pointer',
                        }}
                      >
                        {item.concluido && <Icon name="check" size={15} />}
                      </button>
                      <span style={{
                        flex: 1, fontSize: 14.5,
                        textDecoration: item.concluido ? 'line-through' : 'none',
                        color: item.concluido ? 'var(--soft)' : 'var(--text)',
                      }}>
                        {item.titulo}
                      </span>
                      <button
                        className="icon-btn"
                        style={{ width: 32, height: 32, color: 'var(--soft)' }}
                        onClick={() => deleteBucket(item.id)}
                      >
                        <Icon name="trash" size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* MOMENTOS (Timeline) */}
          {sub === 'momentos' && (
            <>
              <button className="btn btn-block" onClick={() => setOpenForm(true)}>
                <Icon name="plus" size={18} /> Registrar um momento
              </button>

              {timeline.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--soft)' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📸</div>
                  <p>Nenhum momento ainda</p>
                  <p style={{ fontSize: 13, marginTop: 4 }}>Registrem datas especiais de vocês!</p>
                </div>
              ) : (
                <div style={{ position: 'relative', paddingLeft: 26 }}>
                  <div style={{
                    position: 'absolute', left: 6, top: 8, bottom: 8,
                    width: 2, background: 'var(--border)', borderRadius: 9,
                  }} />
                  <div className="stack" style={{ gap: 14 }}>
                    {[...timeline].sort((a, b) => b.data.localeCompare(a.data)).map(item => (
                      <div key={item.id} style={{ position: 'relative' }}>
                        <div style={{
                          position: 'absolute', left: -26, top: 6,
                          width: 14, height: 14, borderRadius: 99,
                          background: 'var(--romance)',
                          border: '3px solid var(--bg)',
                        }} />
                        <div className="card" style={{ padding: 15 }}>
                          <div style={{ fontSize: 11.5, color: 'var(--romance)', fontWeight: 600, letterSpacing: '0.02em' }}>
                            {formatarData(item.data)}
                          </div>
                          <div className="serif" style={{ fontSize: 17, fontWeight: 600, margin: '3px 0 4px' }}>
                            {item.titulo}
                          </div>
                          {item.descricao && (
                            <div style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.5 }}>
                              {item.descricao}
                            </div>
                          )}
                          <button
                            onClick={() => deleteTimeline(item.id)}
                            style={{
                              position: 'absolute', top: 12, right: 12,
                              color: 'var(--soft)', border: 'none', background: 'none', cursor: 'pointer',
                            }}
                          >
                            <Icon name="trash" size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {openForm && (
                <Sheet title="Novo momento" onClose={() => setOpenForm(false)}>
                  <div className="stack" style={{ gap: 14 }}>
                    <div>
                      <label className="field-label">Título</label>
                      <input
                        className="input"
                        autoFocus
                        placeholder="O que aconteceu?"
                        value={formMomento.titulo}
                        onChange={e => setFormMomento(p => ({ ...p, titulo: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="field-label">Data</label>
                      <input
                        className="input"
                        type="date"
                        value={formMomento.data}
                        onChange={e => setFormMomento(p => ({ ...p, data: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="field-label">Descrição <span style={{ color: 'var(--soft)' }}>(opcional)</span></label>
                      <textarea
                        className="input"
                        rows={3}
                        placeholder="Conta como foi…"
                        value={formMomento.descricao}
                        onChange={e => setFormMomento(p => ({ ...p, descricao: e.target.value }))}
                      />
                    </div>
                    <div className="row" style={{ gap: 10, marginTop: 4 }}>
                      <button className="btn" style={{ flex: 1 }} onClick={() => setOpenForm(false)}>Cancelar</button>
                      <button
                        className="btn btn-primary"
                        style={{ flex: 1.4, opacity: formMomento.titulo.trim() && !salvando ? 1 : 0.5 }}
                        disabled={!formMomento.titulo.trim() || salvando}
                        onClick={handleAddTimeline}
                      >
                        {salvando ? 'Salvando...' : 'Salvar'}
                      </button>
                    </div>
                  </div>
                </Sheet>
              )}
            </>
          )}

          {/* HUMOR */}
          {sub === 'humor' && (
            <>
              <div className="card card-strong" style={{ display: 'flex', gap: 12, padding: 18 }}>
                {(solo ? ['eu'] : ['eu', 'parceiro']).map(u => {
                  const h = u === 'eu'
                    ? (meuHumor ? { emoji: meuHumor.emoji, label: HUMOR_OPCOES.find(o => o.emoji === meuHumor.emoji)?.label ?? '' } : { emoji: '😐', label: 'Normal' })
                    : (outroHumor ? { emoji: outroHumor.emoji, label: HUMOR_OPCOES.find(o => o.emoji === outroHumor.emoji)?.label ?? '' } : { emoji: '❓', label: 'Sem registro' });
                  return (
                    <div key={u} style={{
                      flex: 1, textAlign: 'center', padding: '6px 4px',
                      borderRadius: 16,
                      background: u === 'eu' ? 'var(--accent-soft)' : 'transparent',
                    }}>
                      <div style={{ fontSize: 44, lineHeight: 1.1 }}>{h.emoji}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, marginTop: 6 }}>
                        {u === 'eu' ? 'Você' : (parceiro?.nome || 'Seu amor')}
                      </div>
                      <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>{h.label}</div>
                    </div>
                  );
                })}
              </div>

              <div className="card">
                <div className="eyebrow" style={{ marginBottom: 14 }}>Como você está hoje?</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
                  {HUMOR_OPCOES.map(h => {
                    const on = meuHumor?.emoji === h.emoji;
                    return (
                      <button
                        key={h.emoji}
                        onClick={() => registrarHumor(h.emoji)}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                          padding: '11px 4px',
                          borderRadius: 15,
                          border: `1px solid ${on ? 'var(--accent)' : 'var(--border)'}`,
                          background: on ? 'var(--accent-soft)' : 'var(--panel)',
                          transition: 'all var(--dur-base)', cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        <span style={{ fontSize: 26, lineHeight: 1 }}>{h.emoji}</span>
                        <span style={{
                          fontSize: 10.5,
                          color: on ? 'var(--accent)' : 'var(--soft)',
                          fontWeight: on ? 600 : 400,
                        }}>
                          {h.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p style={{ fontSize: 12, color: 'var(--soft)', marginTop: 14, lineHeight: 1.5 }}>
                  {solo ? 'Um registro por dia, só seu por enquanto.' : 'Seu amor vê seu humor na hora. Um registro por dia.'}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
