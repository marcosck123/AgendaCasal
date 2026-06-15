import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  const { subscription, userId } = await req.json();
  if (!subscription || !userId) return NextResponse.json({ error: 'missing data' }, { status: 400 });

  await supabase.from('push_subscriptions').upsert(
    { user_id: userId, subscription: JSON.stringify(subscription) },
    { onConflict: 'user_id' }
  );

  return NextResponse.json({ ok: true });
}
