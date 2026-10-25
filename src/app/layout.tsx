import type { Metadata } from 'next'
import { Sarabun, Outfit } from 'next/font/google'
import './globals.css'
import { getSettings } from '@/lib/settings'

const sarabun = Sarabun({
  weight: ['400', '700'],
  subsets: ['thai', 'latin'],
  variable: '--font-sarabun',
  display: 'swap',
  preload: true,
})

const outfit = Outfit({
  weight: ['600'],
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
  preload: true,
})

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings()
  const customFavicon = settings.site_favicon
    ? settings.site_favicon.startsWith('/')
      ? settings.site_favicon
      : `/${settings.site_favicon}`
    : null

  return {
    title: {
      default: settings.site_name || 'วิทยาลัยการอาชีพเชียงราย',
      template: `%s | ${settings.site_name || 'วิทยาลัยการอาชีพเชียงราย'}`,
    },
    description:
      settings.site_name_en ||
      'Chiangrai Industrial And Community Education College',
    icons: {
      icon: [
        ...(customFavicon ? [{ url: customFavicon }] : []),
        { url: '/favicon.ico', sizes: 'any' },
        { url: '/icon.png', type: 'image/png', sizes: '32x32' },
        { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      ],
      apple: [
        { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
      ],
      shortcut: customFavicon || '/favicon.ico',
    },
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="th"
      className={`${sarabun.variable} ${outfit.variable} scroll-smooth`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col antialiased">
        {children}
      </body>
    </html>
  )
}
