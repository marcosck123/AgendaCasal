'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/ganchos/useAuth';

const ABAS = [
  { path: '/dashboard',         emoji: '🏠', label: 'Início' },
  { path: '/dashboard/agenda',  emoji: '📅', label: 'Agenda' },
  { path: '/dashboard/conversa',emoji: '💬', label: 'Chat' },
  { path: '/dashboard/nos',     emoji: '💑', label: 'Nós' },
  { path: '/dashboard/config',  emoji: '⚙️', label: 'Config' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

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

  const isChat = pathname === '/dashboard/conversa';
  const nomeUsuario = user.user_metadata?.nome || user.email?.split('@')[0] || 'Amor';

  return (
    <div className="flex flex-col h-dvh bg-stone-50 overflow-hidden">
      {/* Header */}
      {!isChat ? (
        <header className="bg-white border-b border-stone-100 px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">💑</span>
            <h1 className="font-bold text-stone-800 text-base">AgendaCasal</h1>
          </div>
          <p className="text-xs text-stone-400">Olá, {nomeUsuario}!</p>
        </header>
      ) : (
        <header className="bg-stone-700 text-white px-4 py-3 flex items-center gap-3 shrink-0">
          <span className="text-xl">💬</span>
          <div>
            <p className="font-bold text-sm">Conversa</p>
            <p className="text-xs text-stone-300">com {nomeUsuario === 'Marcos' ? 'Ana' : 'Marcos'}</p>
          </div>
        </header>
      )}

      {/* Conteúdo */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>

      {/* Nav inferior */}
      <nav className="bg-white border-t border-stone-100 shrink-0 safe-area-pb">
        <div className="flex">
          {ABAS.map(({ path, emoji, label }) => {
            const ativo = pathname === path;
            return (
              <button
                key={path}
                onClick={() => router.push(path)}
                className={`relative flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors ${
                  ativo ? 'text-stone-800' : 'text-stone-400'
                }`}
              >
                <span className="text-xl">{emoji}</span>
                <span className="text-[10px] font-medium">{label}</span>
                {ativo && <div className="absolute bottom-0 w-6 h-0.5 bg-stone-700 rounded-full" />}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
