import type { Metadata, Viewport } from 'next'
import { Sarabun, Outfit } from 'next/font/google'
import './globals.css'
import { getSettings } from '@/lib/settings'
import { normalizeImageUrl } from '@/lib/url-helper'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

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

  const siteTitle = settings.site_name || 'วิทยาลัยการอาชีพเชียงราย'
  const siteDesc =
    settings.site_description ||
    'วิทยาลัยการอาชีพเชียงราย (Chiangrai Industrial and Community Education College) จัดการเรียนการสอนสายอาชีพ ปวช. และ ปวส. เสริมสร้างทักษะวิชาชีพสู่มาตรฐานสากล'
  const siteLogo = settings.site_logo
    ? normalizeImageUrl(settings.site_logo)
    : 'https://www.cric.ac.th/uploads/file_6a27706c88d814.68152088.webp'

  return {
    metadataBase: new URL('https://www.cric.ac.th'),
    title: {
      default: `${siteTitle} - จัดการศึกษาวิชาชีพ ปวช. และ ปวส. จ.เชียงราย`,
      template: `%s | ${siteTitle}`,
    },
    description: siteDesc,
    alternates: {
      canonical: './',
    },
    openGraph: {
      type: 'website',
      locale: 'th_TH',
      url: 'https://www.cric.ac.th',
      siteName: siteTitle,
      title: siteTitle,
      description: siteDesc,
      images: [
        {
          url: siteLogo,
          width: 1200,
          height: 630,
          alt: siteTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: siteTitle,
      description: siteDesc,
      images: [siteLogo],
    },
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
