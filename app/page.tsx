'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/ganchos/useAuth'
import Auth from '@/componentes/Auth'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 16,
        background: 'linear-gradient(160deg, var(--bg) 60%, color-mix(in srgb, var(--romance) 6%, var(--bg)))',
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: 22,
          background: 'linear-gradient(135deg, var(--brand-grad-start), var(--brand-grad-end))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff7f0', fontSize: 22, fontWeight: 700, letterSpacing: '0.04em',
          boxShadow: '0 8px 32px color-mix(in srgb, var(--brand-grad-end) 35%, transparent)',
          animation: 'heart-beat 1.8s ease-in-out infinite',
        }}>♥</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1 }}>Nosso</div>
          <div style={{ fontSize: 13, color: 'var(--soft)', marginTop: 5 }}>o espaço de vocês dois</div>
        </div>
      </div>
    )
  }

  if (user) return null

  return <Auth />
}
