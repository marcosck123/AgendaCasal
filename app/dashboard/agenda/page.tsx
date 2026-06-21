'use client';

import { useAuth } from '@/ganchos/useAuth';
import Calendar from '@/componentes/Calendar';

export default function AgendaPage() {
  const { user } = useAuth();
  if (!user) return null;
  const nomeUsuario = user.user_metadata?.nome || user.email?.split('@')[0] || 'Amor';
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Calendar userId={user.id} nomeUsuario={nomeUsuario} />
    </div>
  );
}
