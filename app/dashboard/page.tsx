'use client';

import { useAuth } from '@/ganchos/useAuth';
import Home from '@/componentes/Home';
import NotificationSetup from '@/componentes/NotificationSetup';

export default function DashboardHome() {
  const { user } = useAuth();
  if (!user) return null;
  const nomeUsuario = user.user_metadata?.nome || user.email?.split('@')[0] || 'Amor';
  return (
    <div className="h-full overflow-y-auto">
      <NotificationSetup userId={user.id} />
      <Home userId={user.id} nomeUsuario={nomeUsuario} />
    </div>
  );
}
