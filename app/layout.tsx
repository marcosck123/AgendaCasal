import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AgendaCasal 💕',
  description: 'Seu espaço compartilhado com a pessoa amada',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
