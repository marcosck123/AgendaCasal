'use client';

import { useEffect, useState } from 'react';

interface Props {
  userId: string;
}

export default function NotificationSetup({ userId }: Props) {
  const [status, setStatus] = useState<'idle' | 'asking' | 'granted' | 'denied'>('idle');

  useEffect(() => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'granted') setStatus('granted');
    else if (Notification.permission === 'denied') setStatus('denied');
  }, []);

  const ativar = async () => {
    setStatus('asking');
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') { setStatus('denied'); return; }
    setStatus('granted');

    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    });

    await fetch('/api/push-subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription: sub, userId }),
    });
  };

  if (status === 'granted' || status === 'denied') return null;

  return (
    <div className="mx-3 mt-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-semibold text-stone-700">Ativar notificações 🔔</p>
        <p className="text-xs text-stone-500">Receba avisos dos lembretes no celular</p>
      </div>
      <button
        onClick={ativar}
        disabled={status === 'asking'}
        className="shrink-0 px-3 py-1.5 bg-stone-700 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl disabled:opacity-50"
      >
        {status === 'asking' ? '...' : 'Ativar'}
      </button>
    </div>
  );
}
