import React from 'react'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { UsersAdminClient } from './UsersAdminClient'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const session = await getSession()
  if (!session) redirect('/admin/login')

  const users = await prisma.users.findMany({
    orderBy: { id: 'asc' },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      allowed_pages: true,
      created_at: true,
    },
  })

  const serialized = users.map((u) => ({
    ...u,
    created_at: u.created_at ? u.created_at.toISOString() : null,
  }))

  return <UsersAdminClient initialUsers={serialized} currentUserId={session.id} />
}
