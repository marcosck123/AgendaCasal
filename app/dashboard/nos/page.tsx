'use client';

import { useAuth } from '@/ganchos/useAuth';
import Nos from '@/componentes/Nos';

export default function NosPage() {
  const { user } = useAuth();
  if (!user) return null;
  return <Nos userId={user.id} />;
}
