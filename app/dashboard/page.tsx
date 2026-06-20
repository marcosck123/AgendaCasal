'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/ganchos/useAuth';
import Home from '@/componentes/Home';
import Calendar from '@/componentes/Calendar';
import Chat from '@/componentes/Chat';
import Nos from '@/componentes/Nos';
import Config from '@/componentes/Config';
import NotificationSetup from '@/componentes/NotificationSetup';

type Aba = 'home' | 'agenda' | 'conversa' | 'nos' | 'config';

const ABAS: { key: Aba; emoji: string; label: string }[] = [
  { key: 'home',     emoji: '🏠', label: 'Início' },
  { key: 'agenda',   emoji: '📅', label: 'Agenda' },
  { key: 'conversa', emoji: '💬', label: 'Chat' },
  { key: 'nos',      emoji: '💑', label: 'Nós' },
  { key: 'config',   emoji: '⚙️', label: 'Config' },
];

export default function Dashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [aba, setAba] = useState<Aba>('home');

  useEffect(() => {
    if (!loading && !user) router.push('/');
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50">
        <div className="animate-pulse text-stone-500 text-xl">Carregando... 💕</div>
      </div>
    );
  }

  const nomeUsuario = user.user_metadata?.nome || user.email?.split('@')[0] || 'Amor';

  return (
    <div className="flex flex-col h-dvh bg-stone-50 overflow-hidden">
      {/* Header — só aparece fora do chat */}
      {aba !== 'conversa' && (
        <header className="bg-white border-b border-stone-100 px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">💑</span>
            <h1 className="font-bold text-stone-800 text-base">AgendaCasal</h1>
          </div>
          <p className="text-xs text-stone-400">Olá, {nomeUsuario}!</p>
        </header>
      )}

      {/* Chat tem header próprio */}
      {aba === 'conversa' && (
        <header className="bg-stone-700 text-white px-4 py-3 flex items-center gap-3 shrink-0">
          <span className="text-xl">💬</span>
          <div>
            <p className="font-bold text-sm">Conversa</p>
            <p className="text-xs text-stone-300">com {nomeUsuario === 'Marcos' ? 'Ana' : 'Marcos'}</p>
          </div>
        </header>
      )}

      {/* Notificações (só na home) */}
      {aba === 'home' && <NotificationSetup userId={user.id} />}

      {/* Conteúdo */}
      <main className="flex-1 overflow-hidden">
        {aba === 'home' && (
          <div className="h-full overflow-y-auto">
            <Home userId={user.id} nomeUsuario={nomeUsuario} />
          </div>
        )}
        {aba === 'agenda' && (
          <div className="h-full overflow-y-auto px-3 py-3">
            <Calendar userId={user.id} nomeUsuario={nomeUsuario} />
          </div>
        )}
        {aba === 'conversa' && (
          <Chat userId={user.id} nomeUsuario={nomeUsuario} />
        )}
        {aba === 'nos' && (
          <Nos userId={user.id} />
        )}
        {aba === 'config' && (
          <div className="h-full overflow-y-auto">
            <Config userId={user.id} nomeUsuario={nomeUsuario} onLogout={logout} />
          </div>
        )}
      </main>

      {/* Nav inferior */}
      <nav className="bg-white border-t border-stone-100 shrink-0 safe-area-pb">
        <div className="flex">
          {ABAS.map(({ key, emoji, label }) => (
            <button
              key={key}
              onClick={() => setAba(key)}
              className={`relative flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors ${
                aba === key ? 'text-stone-800' : 'text-stone-400'
              }`}
            >
              <span className="text-xl">{emoji}</span>
              <span className="text-[10px] font-medium">{label}</span>
              {aba === key && (
                <div className="absolute bottom-0 w-6 h-0.5 bg-stone-700 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
