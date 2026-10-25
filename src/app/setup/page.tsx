import React from 'react'
import type { Metadata } from 'next'
import { checkSystemRequirements } from '@/lib/installer'
import { SetupClient } from './SetupClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'ระบบติดตั้งและเตรียมความพร้อมเซิร์ฟเวอร์ | CRiC Web CMS',
  description: 'Setup and installer wizard for CRiC Web CMS on new server deployment',
}

export default async function SetupPage() {
  const initialData = await checkSystemRequirements()

  return <SetupClient initialData={initialData} />
}
