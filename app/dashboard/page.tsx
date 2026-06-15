'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/ganchos/useAuth';
import Calendar from '@/componentes/Calendar';
import Chat from '@/componentes/Chat';
import NotificationSetup from '@/componentes/NotificationSetup';

type Aba = 'agenda' | 'conversa';

export default function Dashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [aba, setAba] = useState<Aba>('agenda');

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
      {/* Header */}
      <header className="bg-white border-b border-stone-100 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xl">💑</span>
          <div>
            <h1 className="font-bold text-stone-800 text-base leading-tight">AgendaCasal</h1>
            <p className="text-xs text-stone-400 leading-tight">Olá, {nomeUsuario}!</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="text-xs text-stone-400 hover:text-stone-600 px-3 py-1.5 rounded-lg hover:bg-stone-100 transition-colors"
        >
          Sair
        </button>
      </header>

      <NotificationSetup userId={user.id} />

      {/* Conteúdo principal — ocupa todo o espaço restante */}
      <main className="flex-1 overflow-hidden">
        {aba === 'agenda' && (
          <div className="h-full overflow-y-auto px-3 py-3">
            <Calendar userId={user.id} nomeUsuario={nomeUsuario} />
          </div>
        )}
        {aba === 'conversa' && (
          <Chat userId={user.id} nomeUsuario={nomeUsuario} />
        )}
      </main>

      {/* Barra de navegação inferior */}
      <nav className="bg-white border-t border-stone-100 shrink-0 safe-area-pb">
        <div className="flex">
          <button
            onClick={() => setAba('agenda')}
            className={`relative flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
              aba === 'agenda' ? 'text-stone-800' : 'text-stone-400'
            }`}
          >
            <span className="text-2xl">📅</span>
            <span className="text-xs font-medium">Agenda</span>
            {aba === 'agenda' && (
              <div className="absolute bottom-0 w-8 h-0.5 bg-stone-700 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setAba('conversa')}
            className={`relative flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
              aba === 'conversa' ? 'text-stone-800' : 'text-stone-400'
            }`}
          >
            <span className="text-2xl">💬</span>
            <span className="text-xs font-medium">Conversa</span>
            {aba === 'conversa' && (
              <div className="absolute bottom-0 w-8 h-0.5 bg-stone-700 rounded-full" />
            )}
          </button>
        </div>
      </nav>
    </div>
  );
}
