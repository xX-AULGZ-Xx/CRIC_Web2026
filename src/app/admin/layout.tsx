import React from 'react'
import type { Metadata } from 'next'
import { getSession } from '@/lib/auth'
import { getSettings } from '@/lib/settings'
import prisma from '@/lib/prisma'
import { AdminShell } from './AdminShell'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings()
  const siteName = settings.site_name || 'วิทยาลัยการอาชีพเชียงราย'
  const customFavicon = settings.site_favicon
    ? settings.site_favicon.startsWith('/')
      ? settings.site_favicon
      : `/${settings.site_favicon}`
    : null

  return {
    title: {
      default: `ระบบจัดการหลังบ้าน | ${siteName}`,
      template: `%s | ระบบจัดการ ${siteName}`,
    },
    icons: {
      icon: [
        ...(customFavicon ? [{ url: customFavicon }] : []),
        { url: '/favicon.ico', sizes: 'any' },
        { url: '/icon.png', type: 'image/png', sizes: '32x32' },
      ],
      apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
      shortcut: customFavicon || '/favicon.ico',
    },
  }
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session) {
    return <>{children}</>
  }

  const [settings, pendingComplaints] = await Promise.all([
    getSettings(),
    prisma.complaints.count({ where: { status: 'pending' } }).catch(() => 0),
  ])

  const siteName = settings.site_name || 'วิทยาลัยการอาชีพเชียงราย'
  const immichUrl = settings.immich_server_url ? settings.immich_server_url.trim() : undefined

  return (
    <AdminShell
      session={session}
      siteName={siteName}
      pendingComplaints={pendingComplaints}
      immichUrl={immichUrl}
    >
      {children}
    </AdminShell>
  )
}
