'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/ganchos/useAuth'
import Calendar from '@/componentes/Calendar'
import Chat from '@/componentes/Chat'
import AudioRecorder from '@/componentes/AudioRecorder'

type Overlay = 'chat' | 'audio' | null

export default function Dashboard() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const [overlay, setOverlay] = useState<Overlay>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50">
        <div className="animate-pulse text-stone-500 text-xl">Carregando... 💕</div>
      </div>
    )
  }

  if (!user) return null

  const nomeUsuario = user.user_metadata?.nome || user.email?.split('@')[0] || 'Amor'

  return (
    <main className="min-h-screen bg-gradient-to-br from-stone-50 to-amber-50 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-stone-800 tracking-tight">AgendaCasal 💑</h1>
          <div className="flex items-center gap-3">
            <span className="text-xs text-stone-400 hidden sm:block truncate max-w-[140px]">{user.email}</span>
            <button
              onClick={logout}
              className="text-sm bg-stone-100 hover:bg-stone-200 text-stone-600 px-3 py-1.5 rounded-lg transition-colors font-medium"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Calendar — main content */}
      <div className="flex-1 max-w-2xl w-full mx-auto px-2 py-2 pb-24">
        <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden min-h-[500px]">
          <Calendar userId={user.id} />
        </div>
      </div>

      {/* Floating action buttons */}
      <div className="fixed bottom-6 right-5 flex flex-col gap-3 z-20">
        <button
          onClick={() => setOverlay('audio')}
          title="Áudios"
          className="w-14 h-14 bg-stone-600 hover:bg-stone-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center text-2xl active:scale-95"
        >
          🎙️
        </button>
        <button
          onClick={() => setOverlay('chat')}
          title="Chat"
          className="w-14 h-14 bg-stone-700 hover:bg-stone-800 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center text-2xl active:scale-95"
        >
          💬
        </button>
      </div>

      {/* Overlay sheet */}
      {overlay && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOverlay(null)}
            aria-hidden="true"
          />

          {/* Sheet */}
          <div
            className="relative bg-white rounded-t-3xl shadow-2xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-stone-200" />
            </div>

            {/* Sheet header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100">
              <h2 className="text-base font-bold text-stone-800">
                {overlay === 'chat' ? '💬 Nossas Mensagens' : '🎙️ Nossos Áudios'}
              </h2>
              <button
                onClick={() => setOverlay(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 text-stone-400 text-lg transition-colors"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            {/* Sheet content */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {overlay === 'chat' && (
                <Chat userId={user.id} nomeUsuario={nomeUsuario} />
              )}
              {overlay === 'audio' && (
                <AudioRecorder userId={user.id} />
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
