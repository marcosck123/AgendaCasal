'use client';

import { useAuth } from '@/ganchos/useAuth';
import Chat from '@/componentes/Chat';

export default function ConversaPage() {
  const { user } = useAuth();
  if (!user) return null;
  const nomeUsuario = user.user_metadata?.nome || user.email?.split('@')[0] || 'Amor';
  return <Chat userId={user.id} nomeUsuario={nomeUsuario} />;
}
