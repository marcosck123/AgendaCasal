'use client';

import { useState } from 'react';
import { supabase, Convite } from '@/lib/supabase';
import { useCasalConfig } from '@/ganchos/useCasalConfig';
import { useCasalContext } from '@/ganchos/CasalContext';
import { Avatar, Sheet, Heart } from './UIKit';
import Icon from './Icon';

interface ConfigProps {
  userId: string;
  nomeUsuario: string;
  onLogout: () => void;
}

export default function Config({ userId, nomeUsuario, onLogout }: ConfigProps) {
  const { config, setConfigValue, loading } = useCasalConfig();
  const { perfil, casal, parceiro, solo, loading: casalLoading, refresh } = useCasalContext();
  const [salvando, setSalvando] = useState<string | null>(null);

  // Convite
  const [convite, setConvite] = useState<Convite | null>(null);
  const [criandoConvite, setCriandoConvite] = useState(false);
  const [codigoInput, setCodigoInput] = useState('');
  const [aceitando, setAceitando] = useState(false);
  const [erroConvite, setErroConvite] = useState('');
  const [celebrando, setCelebrando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  // Desfazer vínculo
  const [confirmDesfazer, setConfirmDesfazer] = useState(false);
  const [desfazendo, setDesfazendo] = useState(false);

  const salvar = async (chave: string, valor: string) => {
    setSalvando(chave);
    await setConfigValue(chave, valor);
    setSalvando(null);
  };

  const salvarNome = async (nome: string) => {
    if (!nome.trim()) return;
    setSalvando('nome');
    await supabase.from('perfis').update({ nome: nome.trim() }).eq('id', userId);
    await refresh();
    setSalvando(null);
  };

  const criarConvite = async () => {
    if (!casal) return;
    setCriandoConvite(true);
    setErroConvite('');
    const { data, error } = await supabase
      .from('convites')
      .insert({ criado_por: userId, casal_id: casal.id })
      .select()
      .single();
    setCriandoConvite(false);
    if (error || !data) {
      setErroConvite(error?.message || 'Não foi possível criar o convite.');
      return;
    }
    setConvite(data as Convite);
  };

  const compartilharConvite = async () => {
    if (!convite) return;
    const link = `${window.location.origin}/juntar/${convite.codigo}`;
    const texto = `Vem dividir o "Nosso" comigo 💛 ${link}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Nosso', text: texto, url: link }); } catch { /* cancelado */ }
    } else {
      try {
        await navigator.clipboard.writeText(link);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
      } catch { /* ignore */ }
    }
  };

  const aceitarCodigo = async () => {
    const codigo = codigoInput.trim().toUpperCase();
    if (!codigo) return;
    setAceitando(true);
    setErroConvite('');
    const { data, error } = await supabase.rpc('aceitar_convite', { p_codigo: codigo });
    setAceitando(false);
    const res = data as { success?: boolean; error?: string } | null;
    if (error || !res?.success) {
      setErroConvite(res?.error || error?.message || 'Não foi possível aceitar o convite.');
      return;
    }
    setCodigoInput('');
    setCelebrando(true);
    await refresh();
    setTimeout(() => setCelebrando(false), 2600);
  };

  const desfazer = async () => {
    setDesfazendo(true);
    const { data, error } = await supabase.rpc('desfazer_vinculo');
    setDesfazendo(false);
    const res = data as { success?: boolean; error?: string } | null;
    if (error || !res?.success) {
      setErroConvite(res?.error || error?.message || 'Não foi possível desfazer o vínculo.');
    }
    setConfirmDesfazer(false);
    await refresh();
  };

  const diasJuntos = config['data_inicio']
    ? Math.floor((Date.now() - new Date(config['data_inicio']).getTime()) / 86400000)
    : null;

  const nomeExibido = perfil?.nome || nomeUsuario;

  if (loading || casalLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--muted)' }}>
        Carregando...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* App bar */}
      <div className="appbar">
        <span className="appbar-title">Configurações</span>
      </div>

      <div className="screen-scroll pad" style={{ paddingBottom: 24 }}>
        <div className="section-gap screen-enter">

          {/* Conectado como */}
          <div>
            <div className="eyebrow" style={{ padding: '2px 4px 8px' }}>Conectado como</div>
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14 }}>
              <Avatar who="marcos" size="lg" label={nomeExibido} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{nomeExibido}</div>
                <div style={{ fontSize: 12.5, color: 'var(--soft)' }}>
                  Lembretes privados e mensagens ficam vinculados a esta conta.
                </div>
              </div>
            </div>
          </div>

          {/* Juntar-se / Parceiro */}
          {solo ? (
            <div>
              <div className="eyebrow" style={{ padding: '2px 4px 8px' }}>Vamos nos juntar 💛</div>
              <div className="card" style={{ padding: 16 }}>
                {perfil?.codigo_amigo && (
                  <div style={{ marginBottom: 14 }}>
                    <label className="field-label">Seu código de amigo</label>
                    <div className="chip" style={{ fontSize: 15, fontWeight: 700, letterSpacing: '0.18em', padding: '7px 14px' }}>
                      {perfil.codigo_amigo}
                    </div>
                  </div>
                )}

                {convite ? (
                  <div style={{ textAlign: 'center', marginBottom: 14 }}>
                    <div className="eyebrow" style={{ marginBottom: 8 }}>Convite criado</div>
                    <div style={{
                      fontSize: 34, fontWeight: 700, letterSpacing: '0.24em',
                      color: 'var(--romance)', marginBottom: 10,
                    }}>
                      {convite.codigo}
                    </div>
                    <button className="btn btn-primary btn-block" onClick={compartilharConvite}>
                      {copiado ? 'Link copiado ✓' : 'Compartilhar convite 💌'}
                    </button>
                    <p style={{ fontSize: 11.5, color: 'var(--soft)', marginTop: 8 }}>
                      Vale por 7 dias. Quem receber entra em /juntar/{convite.codigo}.
                    </p>
                  </div>
                ) : (
                  <button
                    className="btn btn-primary btn-block"
                    style={{ marginBottom: 14, opacity: criandoConvite ? 0.6 : 1 }}
                    disabled={criandoConvite}
                    onClick={criarConvite}
                  >
                    <Icon name="heart" size={17} /> {criandoConvite ? 'Criando…' : 'Criar convite'}
                  </button>
                )}

                <div>
                  <label className="field-label">Tenho um código</label>
                  <div className="row" style={{ gap: 8 }}>
                    <input
                      className="input"
                      placeholder="EX.: AB12CD"
                      value={codigoInput}
                      maxLength={6}
                      style={{ textTransform: 'uppercase', letterSpacing: '0.12em' }}
                      onChange={e => setCodigoInput(e.target.value.toUpperCase())}
                    />
                    <button
                      className="btn"
                      style={{ flexShrink: 0, opacity: codigoInput.trim().length === 6 && !aceitando ? 1 : 0.5 }}
                      disabled={codigoInput.trim().length !== 6 || aceitando}
                      onClick={aceitarCodigo}
                    >
                      {aceitando ? '…' : 'Juntar'}
                    </button>
                  </div>
                </div>

                {erroConvite && (
                  <p style={{ fontSize: 13, color: 'var(--danger)', marginTop: 10 }}>{erroConvite}</p>
                )}
              </div>
            </div>
          ) : (
            <div>
              <div className="eyebrow" style={{ padding: '2px 4px 8px' }}>O casal</div>
              <div className="card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <Avatar who="ana" size="lg" label={parceiro?.nome || 'Seu amor'} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>{parceiro?.nome || 'Seu amor'}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--soft)' }}>vocês dividem este espaço 💛</div>
                  </div>
                  <Heart size={18} beat />
                </div>
                {diasJuntos !== null && (
                  <p style={{ fontSize: 12, color: 'var(--romance)', fontWeight: 500, marginBottom: 10 }}>
                    {diasJuntos.toLocaleString('pt-BR')} dias juntos 💕
                  </p>
                )}
                <button
                  className="btn btn-block"
                  onClick={() => setConfirmDesfazer(true)}
                  style={{
                    color: 'var(--danger)',
                    borderColor: 'color-mix(in srgb, var(--danger) 35%, transparent)',
                  }}
                >
                  Desfazer vínculo
                </button>
                {erroConvite && (
                  <p style={{ fontSize: 13, color: 'var(--danger)', marginTop: 10 }}>{erroConvite}</p>
                )}
              </div>
            </div>
          )}

          {/* Perfil / datas */}
          <div>
            <div className="eyebrow" style={{ padding: '2px 4px 8px' }}>{solo ? 'Meu espaço' : 'Nosso espaço'}</div>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ marginBottom: 14 }}>
                <label className="field-label">Seu nome</label>
                <input
                  className="input"
                  defaultValue={nomeExibido}
                  onBlur={e => salvarNome(e.target.value)}
                />
                {salvando === 'nome' && (
                  <span style={{ fontSize: 11, color: 'var(--status-online)' }}>Salvo ✓</span>
                )}
              </div>
              <div>
                <label className="field-label">Quando tudo começou</label>
                <input
                  className="input"
                  type="date"
                  defaultValue={config['data_inicio'] ?? ''}
                  onBlur={e => salvar('data_inicio', e.target.value)}
                />
                {salvando === 'data_inicio' && (
                  <span style={{ fontSize: 11, color: 'var(--status-online)' }}>Salvo ✓</span>
                )}
              </div>
              <p style={{ fontSize: 11.5, color: 'var(--soft)', marginTop: 8 }}>
                Salva automático ao sair do campo.
              </p>
            </div>
          </div>

          {/* Aparência */}
          <div>
            <div className="eyebrow" style={{ padding: '2px 4px 8px' }}>Aparência</div>
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16 }}>
              <div style={{ color: 'var(--accent)' }}><Icon name="sparkle" size={20} /></div>
              <div style={{ flex: 1, fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
                O tema segue as preferências do sistema (claro / escuro).
              </div>
            </div>
          </div>

          {/* Sair */}
          <button
            className="btn btn-block"
            onClick={onLogout}
            style={{
              color: 'var(--danger)',
              borderColor: 'color-mix(in srgb, var(--danger) 35%, transparent)',
              marginTop: 4,
            }}
          >
            <Icon name="logout" size={18} /> Sair da conta
          </button>

          <p style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--soft)' }}>
            Nosso · {solo ? 'seu espaço, por enquanto só seu' : 'o espaço de vocês dois'}
          </p>
        </div>
      </div>

      {/* Confirmação de desfazer vínculo */}
      {confirmDesfazer && (
        <Sheet title="Desfazer vínculo?" onClose={() => setConfirmDesfazer(false)}>
          <div className="stack" style={{ gap: 14 }}>
            <p style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--muted)' }}>
              Vocês vão deixar de dividir este espaço. Seus lembretes privados e seu humor vão com você;
              as memórias compartilhadas ficam guardadas com {parceiro?.nome || 'a outra pessoa'}.
            </p>
            <div className="row" style={{ gap: 10 }}>
              <button className="btn" style={{ flex: 1 }} onClick={() => setConfirmDesfazer(false)}>Cancelar</button>
              <button
                className="btn"
                style={{
                  flex: 1.3,
                  color: 'var(--danger)',
                  borderColor: 'color-mix(in srgb, var(--danger) 45%, transparent)',
                  opacity: desfazendo ? 0.6 : 1,
                }}
                disabled={desfazendo}
                onClick={desfazer}
              >
                {desfazendo ? 'Desfazendo…' : 'Desfazer vínculo'}
              </button>
            </div>
          </div>
        </Sheet>
      )}

      {/* Celebração ao aceitar convite */}
      {celebrando && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
          background: 'color-mix(in srgb, var(--bg) 82%, transparent)',
          backdropFilter: 'blur(6px)',
        }}>
          <Heart size={72} beat />
          <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em' }}>Vocês estão juntos! 💛</div>
          <div style={{ fontSize: 14, color: 'var(--muted)' }}>Agora o espaço é de vocês dois.</div>
        </div>
      )}
    </div>
  );
}
