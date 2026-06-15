'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/ganchos/useAuth'
import Reminders from '@/componentes/Reminders'
import Chat from '@/componentes/Chat'
import AudioRecorder from '@/componentes/AudioRecorder'

type Tab = 'lembretes' | 'chat' | 'audios'

export default function Dashboard() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('lembretes')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-rose-50">
        <div className="animate-pulse text-rose-400 text-xl">Carregando... 💕</div>
      </div>
    )
  }

  if (!user) return null

  const tabs: { id: Tab; label: string; emoji: string }[] = [
    { id: 'lembretes', label: 'Lembretes', emoji: '📅' },
    { id: 'chat', label: 'Chat', emoji: '💬' },
    { id: 'audios', label: 'Áudios', emoji: '🎙️' },
  ]

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100">
      <header className="bg-white shadow-sm border-b border-rose-100">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-rose-600">AgendaCasal 💕</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-rose-400 hidden sm:block">{user.email}</span>
            <button
              onClick={logout}
              className="text-sm bg-rose-100 hover:bg-rose-200 text-rose-600 px-3 py-1.5 rounded-lg transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6 bg-white rounded-xl p-1 shadow-sm border border-rose-100">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-rose-400 hover:text-rose-600 hover:bg-rose-50'
              }`}
            >
              {tab.emoji} {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'lembretes' && <Reminders />}
        {activeTab === 'chat' && <Chat />}
        {activeTab === 'audios' && <AudioRecorder />}
      </div>
    </main>
  )
}
