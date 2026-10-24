import React from 'react'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { PagesAdminClient } from './PagesAdminClient'

export const dynamic = 'force-dynamic'

export default async function AdminPagesPage() {
  const session = await getSession()
  if (!session) redirect('/admin/login')

  const [pages, newsCategories, galleries] = await Promise.all([
    prisma.static_pages.findMany({
      orderBy: [{ id: 'asc' }],
    }),
    prisma.news_categories.findMany({
      orderBy: { id: 'asc' },
      select: { id: true, name: true },
    }),
    prisma.galleries.findMany({
      orderBy: { created_at: 'desc' },
      select: { id: true, title: true },
    }),
  ])

  const serializedPages = pages.map((p) => ({
    ...p,
    updated_at: p.updated_at ? p.updated_at.toISOString() : null,
  }))

  return (
    <PagesAdminClient
      initialPages={serializedPages}
      newsCategories={newsCategories}
      galleries={galleries}
    />
  )
}
