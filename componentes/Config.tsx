'use client';

import { useState } from 'react';
import { useCasalConfig } from '@/ganchos/useCasalConfig';

interface ConfigProps {
  userId: string;
  nomeUsuario: string;
  onLogout: () => void;
}

export default function Config({ nomeUsuario, onLogout }: ConfigProps) {
  const { config, setConfigValue, loading } = useCasalConfig();
  const [salvando, setSalvando] = useState<string | null>(null);

  const campos = [
    { chave: 'nome_marcos', label: 'Nome (Marcos)', placeholder: 'Marcos', emoji: '🙋' },
    { chave: 'nome_amor', label: 'Nome do amor (Ana)', placeholder: 'Ana', emoji: '💌' },
    { chave: 'data_inicio', label: 'Data que ficaram juntos', placeholder: '', emoji: '💕', tipo: 'date' },
  ];

  const salvar = async (chave: string, valor: string) => {
    setSalvando(chave);
    await setConfigValue(chave, valor);
    setSalvando(null);
  };

  const diasJuntos = config['data_inicio']
    ? Math.floor((Date.now() - new Date(config['data_inicio']).getTime()) / 86400000)
    : null;

  if (loading) return <div className="p-6 text-center text-stone-400">Carregando...</div>;

  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <div className="bg-stone-700 rounded-2xl p-5 text-white text-center">
        <div className="text-5xl mb-3">👫</div>
        <p className="font-bold text-lg">{config['nome_marcos'] || 'Marcos'} & {config['nome_amor'] || 'Ana'}</p>
        {diasJuntos !== null && (
          <p className="text-stone-300 text-sm mt-1">{diasJuntos} dias juntos 💕</p>
        )}
      </div>

      {/* Campos */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">Personalizar</p>
        {campos.map(campo => (
          <div key={campo.chave} className="bg-white border border-stone-100 rounded-2xl px-4 py-3 shadow-sm">
            <p className="text-xs text-stone-400 mb-1">{campo.emoji} {campo.label}</p>
            <div className="flex gap-2">
              <input
                type={campo.tipo ?? 'text'}
                defaultValue={config[campo.chave] ?? ''}
                placeholder={campo.placeholder}
                onBlur={e => salvar(campo.chave, e.target.value)}
                className="flex-1 text-sm text-stone-800 focus:outline-none bg-transparent"
              />
              {salvando === campo.chave && <span className="text-xs text-stone-400">✓</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Info da conta */}
      <div className="bg-white border border-stone-100 rounded-2xl px-4 py-3 shadow-sm">
        <p className="text-xs text-stone-400 mb-1">👤 Conta</p>
        <p className="text-sm text-stone-800 font-medium">{nomeUsuario}</p>
      </div>

      {/* Logout */}
      <button
        onClick={onLogout}
        className="w-full py-3 border-2 border-stone-200 text-stone-600 font-semibold rounded-2xl hover:bg-stone-50 transition-colors text-sm"
      >
        Sair da conta
      </button>
    </div>
  );
}
