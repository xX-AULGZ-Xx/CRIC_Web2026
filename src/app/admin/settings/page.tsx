import React from 'react'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getSettings } from '@/lib/settings'
import { SettingsAdminClient } from './SettingsAdminClient'

export default async function AdminSettingsPage() {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    redirect('/admin')
  }

  const settings = await getSettings()

  return <SettingsAdminClient initialSettings={settings} />
}
