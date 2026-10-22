import React from 'react'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { ComplaintsAdminClient } from './ComplaintsAdminClient'

export default async function AdminComplaintsPage() {
  const session = await getSession()
  if (!session) redirect('/admin/login')

  const complaintsList = await prisma.complaints.findMany({
    orderBy: { created_at: 'desc' },
  })

  return <ComplaintsAdminClient complaintsList={complaintsList} />
}
