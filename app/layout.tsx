import type { Metadata, Viewport } from 'next';
import './globals.css';
import PWARegister from '@/componentes/PWARegister';

export const metadata: Metadata = {
  title: 'AgendaCasal',
  description: 'Seu espaço compartilhado com a pessoa amada',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AgendaCasal',
  },
};

export const viewport: Viewport = {
  themeColor: '#44403c',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>
        <PWARegister />
        {children}
      </body>
    </html>
  );
}
