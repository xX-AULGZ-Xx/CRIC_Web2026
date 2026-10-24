import React from 'react'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { NewsAdminClient } from './NewsAdminClient'

export const dynamic = 'force-dynamic'

export default async function AdminNewsPage() {
  const session = await getSession()
  if (!session) redirect('/admin/login')

  const [newsList, categories, galleries] = await Promise.all([
    prisma.news.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        news_categories: { select: { id: true, name: true } },
        news_tags: { select: { tag_name: true } },
      },
    }),
    prisma.news_categories.findMany({ orderBy: { id: 'asc' } }),
    prisma.galleries.findMany({
      orderBy: { created_at: 'desc' },
      select: { id: true, title: true },
    }),
  ])

  const serializedNews = newsList.map((n) => ({
    ...n,
    created_at: n.created_at ? n.created_at.toISOString() : null,
    updated_at: n.updated_at ? n.updated_at.toISOString() : null,
  }))

  return (
    <NewsAdminClient
      initialNews={serializedNews}
      categories={categories}
      galleries={galleries}
    />
  )
}
