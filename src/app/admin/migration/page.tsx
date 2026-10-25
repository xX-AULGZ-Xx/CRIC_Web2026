import React from 'react'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { listSafetySnapshots } from '@/lib/migration'
import { MigrationAdminClient } from './MigrationAdminClient'

export const dynamic = 'force-dynamic'

export default async function AdminMigrationPage() {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    redirect('/admin/login')
  }

  // Measure database tables count
  let tablesCount = 0
  try {
    const tablesResult: any[] = await prisma.$queryRawUnsafe('SHOW TABLES')
    tablesCount = tablesResult.length
  } catch {}

  const defaultLegacyPath = 'c:\\inetpub\\wwwroot\\cric_new26'

  // Safety snapshots
  let snapshots: { name: string; size: number; createdAt: string }[] = []
  try {
    snapshots = listSafetySnapshots().map((s) => ({
      name: s.name,
      size: s.size,
      createdAt: s.createdAt.toISOString(),
    }))
  } catch (err) {
    console.warn('Could not read snapshots:', err)
  }

  return (
    <MigrationAdminClient
      initialStats={{
        tablesCount,
        uploadsCount: 0,
        uploadsSizeMB: 0,
        defaultLegacyPath,
        legacyExists: true,
        legacyUploadsCount: 0,
        legacyUploadsSizeMB: 0,
        snapshots,
      }}
    />
  )
}
