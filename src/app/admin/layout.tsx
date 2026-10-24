import React from 'react'
import { getSession } from '@/lib/auth'
import { getSettings } from '@/lib/settings'
import prisma from '@/lib/prisma'
import { AdminShell } from './AdminShell'

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

  const siteName = settings.site_name || 'ศูนย์การศึกษาพิเศษ ประจำจังหวัดเชียงราย'
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
