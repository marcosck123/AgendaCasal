'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/ganchos/useAuth';
import Icon from '@/componentes/Icon';
import type { IconName } from '@/componentes/Icon';

const ABAS: { path: string; icon: IconName; label: string }[] = [
  { path: '/dashboard',          icon: 'home',     label: 'Início'   },
  { path: '/dashboard/agenda',   icon: 'calendar', label: 'Agenda'   },
  { path: '/dashboard/conversa', icon: 'chat',     label: 'Conversa' },
  { path: '/dashboard/nos',      icon: 'heart',    label: 'Nós'      },
  { path: '/dashboard/config',   icon: 'gear',     label: 'Config'   },
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
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        color: 'var(--muted)',
        fontSize: 'var(--fs-16)',
      }}>
        Carregando...
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100dvh',
      background: 'var(--bg)',
      overflow: 'hidden',
    }}>
      {/* Conteúdo principal */}
      <main style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>

      {/* Tab bar */}
      <nav className="tabbar">
        {ABAS.map(({ path, icon, label }) => {
          const ativo = pathname === path;
          return (
            <button
              key={path}
              className={`tab${ativo ? ' on' : ''}`}
              onClick={() => router.push(path)}
            >
              <span className="tab-ico">
                <Icon name={icon} size={23} />
              </span>
              <span className="tab-label">{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
