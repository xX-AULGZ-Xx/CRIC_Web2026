import React from 'react'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getSettings } from '@/lib/settings'
import { SettingsForm } from './SettingsForm'

export const dynamic = 'force-dynamic'

export default async function AdminSettingsPage() {
  const session = await getSession()
  if (!session) redirect('/admin/login')

  const settings = await getSettings()

  return <SettingsForm initialSettings={settings} />
}
