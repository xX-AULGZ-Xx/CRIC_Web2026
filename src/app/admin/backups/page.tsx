import React from 'react'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import fs from 'fs/promises'
import path from 'path'
import { BackupsAdminClient } from './BackupsAdminClient'

export const dynamic = 'force-dynamic'

export default async function AdminBackupsPage() {
  const session = await getSession()
  if (!session) redirect('/admin/login')

  const backupDir = path.join(process.cwd(), 'public', 'backups')
  const backups = []

  try {
    await fs.mkdir(backupDir, { recursive: true })
    const entries = await fs.readdir(backupDir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.zip')) {
        const stat = await fs.stat(path.join(backupDir, entry.name))
        backups.push({
          name: entry.name,
          size: stat.size,
          created_at: stat.mtime.toISOString(),
          url: `/backups/${entry.name}`,
        })
      }
    }
    backups.sort((a, b) => b.created_at.localeCompare(a.created_at))
  } catch {
    // ignore
  }

  return <BackupsAdminClient initialBackups={backups} />
}
