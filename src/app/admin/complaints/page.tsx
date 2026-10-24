import React from 'react'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { ComplaintsAdminClient } from './ComplaintsAdminClient'

export const dynamic = 'force-dynamic'

export default async function AdminComplaintsPage() {
  const session = await getSession()
  if (!session) redirect('/admin/login')

  const complaints = await prisma.complaints.findMany({
    orderBy: { created_at: 'desc' },
  })

  const serialized = complaints.map((c) => ({
    ...c,
    incident_date: c.incident_date ? c.incident_date.toISOString() : null,
    created_at: c.created_at ? c.created_at.toISOString() : null,
    updated_at: c.updated_at ? c.updated_at.toISOString() : null,
  }))

  return <ComplaintsAdminClient initialComplaints={serialized} />
}
