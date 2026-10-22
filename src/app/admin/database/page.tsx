import React from 'react'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { MigrationClient } from './MigrationClient'

export default async function AdminDatabasePage() {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    redirect('/admin')
  }

  return <MigrationClient />
}
