import React from 'react'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { ExecutivesAdminClient } from './ExecutivesAdminClient'

export const dynamic = 'force-dynamic'

export default async function AdminExecutivesPage() {
  const session = await getSession()
  if (!session) redirect('/admin/login')

  const allPersonnel = await prisma.personnel.findMany({
    orderBy: [{ order_num: 'asc' }, { id: 'asc' }],
    include: {
      personnel_categories: { select: { name: true } },
    },
  })

  return <ExecutivesAdminClient allPersonnel={allPersonnel} />
}
