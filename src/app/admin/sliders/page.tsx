import React from 'react'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { SlidersAdminClient } from './SlidersAdminClient'

export const dynamic = 'force-dynamic'

export default async function AdminSlidersPage() {
  const session = await getSession()
  if (!session) redirect('/admin/login')

  const sliders = await prisma.sliders.findMany({
    orderBy: [{ order_num: 'asc' }, { id: 'desc' }],
  })

  return <SlidersAdminClient initialSliders={sliders} />
}
