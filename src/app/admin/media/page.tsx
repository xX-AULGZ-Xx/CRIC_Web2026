import React from 'react'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { MediaAdminClient } from './MediaAdminClient'

export const dynamic = 'force-dynamic'

export default async function AdminMediaPage() {
  const session = await getSession()
  if (!session) redirect('/admin/login')

  const mediaList = await prisma.media.findMany({
    orderBy: { created_at: 'desc' },
    include: {
      users: { select: { username: true } },
    },
  })

  const serialized = mediaList.map((m) => ({
    ...m,
    created_at: m.created_at ? m.created_at.toISOString() : null,
  }))

  return <MediaAdminClient initialMedia={serialized} />
}
