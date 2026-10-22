import React from 'react'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { NewsAdminClient } from './NewsAdminClient'

export default async function AdminNewsPage() {
  const session = await getSession()
  if (!session) redirect('/admin/login')

  const [newsList, categories] = await Promise.all([
    prisma.news.findMany({
      include: { news_categories: true },
      orderBy: { created_at: 'desc' },
    }),
    prisma.news_categories.findMany({
      orderBy: { id: 'asc' },
    }),
  ])

  return <NewsAdminClient newsList={newsList} categories={categories} />
}
