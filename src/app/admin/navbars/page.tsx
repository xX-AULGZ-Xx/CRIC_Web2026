import React from 'react'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { NavbarsAdminClient } from './NavbarsAdminClient'

export const dynamic = 'force-dynamic'

export default async function AdminNavbarsPage() {
  const session = await getSession()
  if (!session) redirect('/admin/login')

  const [navbars, staticPages] = await Promise.all([
    prisma.navbars.findMany({
      orderBy: [{ order_num: 'asc' }, { id: 'asc' }],
    }),
    prisma.static_pages.findMany({
      select: { slug: true, title: true },
      orderBy: { id: 'asc' },
    }),
  ])

  return <NavbarsAdminClient initialNavbars={navbars} staticPages={staticPages} />
}
