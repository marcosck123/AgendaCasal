import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  // Vercel Cron secret check
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const hoje = new Date().toISOString().split('T')[0];

  // Lembretes de hoje
  const { data: lembretes } = await supabase
    .from('lembretes')
    .select('titulo, descricao, hora')
    .eq('data', hoje);

  if (!lembretes || lembretes.length === 0) return NextResponse.json({ sent: 0 });

  // Todas as subscriptions
  const { data: subs } = await supabase.from('push_subscriptions').select('subscription');
  if (!subs || subs.length === 0) return NextResponse.json({ sent: 0 });

  let sent = 0;
  for (const lembrete of lembretes) {
    const payload = JSON.stringify({
      title: `📅 ${lembrete.titulo}`,
      body: lembrete.descricao || (lembrete.hora ? `Às ${lembrete.hora}` : 'Hoje!'),
    });
    for (const sub of subs) {
      try {
        await webpush.sendNotification(JSON.parse(sub.subscription), payload);
        sent++;
      } catch {
        // subscription inválida — ignora
      }
    }
  }

  return NextResponse.json({ sent });
}
