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
      <div className="min-h-screen flex items-center justify-center bg-amber-50">
        <div className="animate-pulse text-stone-500 text-xl">Carregando... 💕</div>
      </div>
    )
  }

  if (user) return null

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 to-amber-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-stone-800 mb-2">AgendaCasal 💑</h1>
          <p className="text-stone-500">Seu espaço compartilhado com a pessoa amada</p>
        </div>
        <Auth />
      </div>
    </main>
  )
}
