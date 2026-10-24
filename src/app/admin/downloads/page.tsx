import React from 'react'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { DownloadsAdminClient } from './DownloadsAdminClient'

export const dynamic = 'force-dynamic'

export default async function AdminDownloadsPage() {
  const session = await getSession()
  if (!session) redirect('/admin/login')

  const [downloads, categories] = await Promise.all([
    prisma.downloads.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        download_categories: { select: { id: true, name: true } },
      },
    }),
    prisma.download_categories.findMany({
      orderBy: [{ order_num: 'asc' }, { id: 'asc' }],
    }),
  ])

  const serialized = downloads.map((d) => ({
    ...d,
    created_at: d.created_at ? d.created_at.toISOString() : null,
  }))

  return <DownloadsAdminClient initialDownloads={serialized} categories={categories} />
}
