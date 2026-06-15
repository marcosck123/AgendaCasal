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
      <div className="min-h-screen flex items-center justify-center bg-rose-50">
        <div className="animate-pulse text-rose-400 text-xl">Carregando... 💕</div>
      </div>
    )
  }

  if (user) return null

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-rose-600 mb-2">AgendaCasal 💕</h1>
          <p className="text-rose-400">Seu espaço compartilhado com a pessoa amada</p>
        </div>
        <Auth />
      </div>
    </main>
  )
}
