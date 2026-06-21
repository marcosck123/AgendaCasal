'use client';

import { useState } from 'react';
import { useCasalConfig } from '@/ganchos/useCasalConfig';
import { Avatar } from './UIKit';
import Icon from './Icon';

interface ConfigProps {
  userId: string;
  nomeUsuario: string;
  onLogout: () => void;
}

export default function Config({ nomeUsuario, onLogout }: ConfigProps) {
  const { config, setConfigValue, loading } = useCasalConfig();
  const [salvando, setSalvando] = useState<string | null>(null);

  const salvar = async (chave: string, valor: string) => {
    setSalvando(chave);
    await setConfigValue(chave, valor);
    setSalvando(null);
  };

  const diasJuntos = config['data_inicio']
    ? Math.floor((Date.now() - new Date(config['data_inicio']).getTime()) / 86400000)
    : null;

  // Determine who this user is based on nome
  const who = nomeUsuario.toLowerCase() === (config['nome_marcos'] || 'marcos').toLowerCase()
    ? 'marcos'
    : 'ana';

  if (loading) {
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
              <Avatar who={who} size="lg" label={nomeUsuario} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{nomeUsuario}</div>
                <div style={{ fontSize: 12.5, color: 'var(--soft)' }}>
                  Lembretes privados e mensagens ficam vinculados a esta conta.
                </div>
              </div>
            </div>
          </div>

          {/* O casal */}
          <div>
            <div className="eyebrow" style={{ padding: '2px 4px 8px' }}>O casal</div>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ marginBottom: 14 }}>
                <label className="field-label">Nome do Marcos</label>
                <input
                  className="input"
                  defaultValue={config['nome_marcos'] ?? 'Marcos'}
                  onBlur={e => salvar('nome_marcos', e.target.value || 'Marcos')}
                />
                {salvando === 'nome_marcos' && (
                  <span style={{ fontSize: 11, color: 'var(--status-online)' }}>Salvo ✓</span>
                )}
              </div>
              <div style={{ marginBottom: 14 }}>
                <label className="field-label">Nome da Ana</label>
                <input
                  className="input"
                  defaultValue={config['nome_amor'] ?? 'Ana'}
                  onBlur={e => salvar('nome_amor', e.target.value || 'Ana')}
                />
                {salvando === 'nome_amor' && (
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
              {diasJuntos !== null && (
                <p style={{ fontSize: 12, color: 'var(--romance)', marginTop: 10, fontWeight: 500 }}>
                  {diasJuntos.toLocaleString('pt-BR')} dias juntos 💕
                </p>
              )}
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
            Nosso · o espaço de vocês dois
          </p>
        </div>
      </div>
    </div>
  );
}
