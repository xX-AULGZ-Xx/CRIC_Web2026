import type { Metadata } from 'next'
import { Sarabun, Outfit } from 'next/font/google'
import './globals.css'
import { getSettings } from '@/lib/settings'

const sarabun = Sarabun({
  weight: ['400', '600', '700'],
  subsets: ['thai', 'latin'],
  variable: '--font-sarabun',
  display: 'swap',
  preload: true,
})

const outfit = Outfit({
  weight: ['600', '700'],
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
      <head />
      <body className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col antialiased">
        {children}
      </body>
    </html>
  )
}
