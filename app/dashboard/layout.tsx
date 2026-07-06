'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/ganchos/useAuth';
import { CasalProvider, useCasalContext } from '@/ganchos/CasalContext';
import { supabase } from '@/lib/supabase';
import { Sheet, Heart } from '@/componentes/UIKit';
import Icon from '@/componentes/Icon';
import type { IconName } from '@/componentes/Icon';

const ABAS: { path: string; icon: IconName; label: string }[] = [
  { path: '/dashboard',          icon: 'home',     label: 'Início'   },
  { path: '/dashboard/agenda',   icon: 'calendar', label: 'Agenda'   },
  { path: '/dashboard/conversa', icon: 'chat',     label: 'Conversa' },
  { path: '/dashboard/nos',      icon: 'heart',    label: 'Nós'      },
  { path: '/dashboard/config',   icon: 'gear',     label: 'Config'   },
];

/** Oferece aceitar um convite pendente salvo antes do login (localStorage). */
function ConvitePendente() {
  const { solo, refresh, loading } = useCasalContext();
  const [codigo, setCodigo] = useState<string | null>(null);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    try {
      const c = localStorage.getItem('convite_pendente');
      if (c) setCodigo(c);
    } catch { /* ignore */ }
  }, []);

  if (loading || !codigo || !solo) return null;

  const fechar = () => {
    try { localStorage.removeItem('convite_pendente'); } catch { /* ignore */ }
    setCodigo(null);
  };

  const aceitar = async () => {
    setProcessando(true);
    setErro('');
    const { data, error } = await supabase.rpc('aceitar_convite', { p_codigo: codigo });
    setProcessando(false);
    const res = data as { success?: boolean; error?: string } | null;
    if (error || !res?.success) {
      setErro(res?.error || error?.message || 'Não foi possível aceitar o convite.');
      return;
    }
    await refresh();
    fechar();
  };

  return (
    <Sheet title="Convite pendente" onClose={fechar}>
      <div className="stack" style={{ gap: 14, textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}><Heart size={36} beat /></div>
        <p style={{ fontSize: 14.5, lineHeight: 1.5 }}>
          Você tem um convite para se juntar a alguém especial. Quer aceitar agora?
        </p>
        <div className="chip" style={{ alignSelf: 'center', fontSize: 16, fontWeight: 700, letterSpacing: '0.2em', padding: '8px 16px' }}>
          {codigo}
        </div>
        {erro && <p style={{ fontSize: 13, color: 'var(--danger)' }}>{erro}</p>}
        <div className="row" style={{ gap: 10 }}>
          <button className="btn" style={{ flex: 1 }} onClick={fechar}>Agora não</button>
          <button className="btn btn-primary" style={{ flex: 1.4, opacity: processando ? 0.6 : 1 }} disabled={processando} onClick={aceitar}>
            {processando ? 'Aceitando…' : 'Aceitar 💛'}
          </button>
        </div>
      </div>
    </Sheet>
  );
}

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
    <CasalProvider userId={user.id}>
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

        <ConvitePendente />

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
    </CasalProvider>
  );
}
