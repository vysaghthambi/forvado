import type { Metadata, Viewport } from 'next'
import { Rajdhani, DM_Sans } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { Providers } from '@/components/providers'

const rajdhani = Rajdhani({ variable: '--font-heading', subsets: ['latin'], weight: ['400', '500', '600', '700'] })
const dmSans = DM_Sans({ variable: '--font-sans', subsets: ['latin'] })

export const viewport: Viewport = {
  themeColor: '#09090f',
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: 'Forvado — Football Tournament Tracker',
  description: 'Manage football tournaments end-to-end.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Forvado',
    startupImage: '/icons/apple-touch-icon.png',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${rajdhani.variable} ${dmSans.variable} antialiased`}>
        <Providers>{children}</Providers>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
