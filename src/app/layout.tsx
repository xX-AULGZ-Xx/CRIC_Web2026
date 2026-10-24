import type { Metadata } from 'next'
import { Sarabun, Outfit } from 'next/font/google'
import './globals.css'
import { getSettings } from '@/lib/settings'

const sarabun = Sarabun({
  weight: ['400', '500', '600', '700'],
  subsets: ['thai', 'latin'],
  variable: '--font-sarabun',
  display: 'swap',
  preload: true,
})

const outfit = Outfit({
  weight: ['500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
  preload: true,
})

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings()
  return {
    title: {
      default: settings.site_name || 'วิทยาลัยการอาชีพเชียงราย',
      template: `%s | ${settings.site_name || 'วิทยาลัยการอาชีพเชียงราย'}`,
    },
    description:
      settings.site_name_en ||
      'Chiangrai Industrial And Community Education College',
    icons: {
      icon: settings.site_logo
        ? settings.site_logo.startsWith('/')
          ? settings.site_logo
          : `/${settings.site_logo}`
        : '/favicon.ico',
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
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cdnjs.cloudflare.com" />
        <link
          rel="preload"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
          as="style"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
          media="print"
          // @ts-expect-error onLoad attribute for asynchronous non-blocking stylesheet loading
          onLoad="this.media='all'"
        />
        <noscript>
          <link
            rel="stylesheet"
            href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
          />
        </noscript>
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col antialiased">
        {children}
      </body>
    </html>
  )
}
