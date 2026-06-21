'use client';

import { useAuth } from '@/ganchos/useAuth';
import Config from '@/componentes/Config';

export default function ConfigPage() {
  const { user, logout } = useAuth();
  if (!user) return null;
  const nomeUsuario = user.user_metadata?.nome || user.email?.split('@')[0] || 'Amor';
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Config userId={user.id} nomeUsuario={nomeUsuario} onLogout={logout} />
    </div>
  );
}
