import React from 'react'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { PersonnelPositionsClient } from './PersonnelPositionsClient'

export const dynamic = 'force-dynamic'

export default async function AdminPersonnelPositionsPage() {
  const session = await getSession()
  if (!session) redirect('/admin/login')

  const positions = await prisma.personnel_positions.findMany({
    orderBy: [{ order_num: 'asc' }, { id: 'asc' }],
    include: {
      _count: { select: { personnel_position_links: true } },
    },
  })

  return <PersonnelPositionsClient positions={positions} />
}
