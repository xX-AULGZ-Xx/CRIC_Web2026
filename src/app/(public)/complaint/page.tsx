import React from 'react'
import type { Metadata } from 'next'
import { getSettings, getThemeClasses } from '@/lib/settings'
import { ComplaintClient } from './ComplaintClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'ศูนย์ร้องเรียนการทุจริตและประพฤติมิชอบ',
  description: 'ช่องทางรับเรื่องร้องเรียนการทุจริตและประพฤติมิชอบ วิทยาลัยการอาชีพเชียงราย',
}

export default async function ComplaintPage() {
  const settings = await getSettings()
  const theme = getThemeClasses(settings.theme_color)

  return (
    <ComplaintClient
      complaintTitle={settings.complaint_title}
      complaintDesc={settings.complaint_desc}
      primaryBg={theme.primaryBg}
      primaryText={theme.primaryText}
    />
  )
}
