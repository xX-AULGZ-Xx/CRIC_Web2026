import React from 'react'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getSettings } from '@/lib/settings'
import { CurriculumAdminClient } from './CurriculumAdminClient'

export const dynamic = 'force-dynamic'

export default async function AdminCurriculumPage() {
  const session = await getSession()
  if (!session) redirect('/admin/login')

  const [curriculums, teachers, settings, parentNavbars] = await Promise.all([
    prisma.curriculums.findMany({ orderBy: { id: 'asc' } }),
    prisma.personnel.findMany({
      orderBy: [{ order_num: 'asc' }, { id: 'asc' }],
      select: { id: true, name: true, position: true, curriculum_id: true },
    }),
    getSettings(),
    prisma.navbars.findMany({
      where: { parent_id: null },
      orderBy: { order_num: 'asc' },
      select: { id: true, label: true },
    }),
  ])

  return (
    <CurriculumAdminClient
      curriculums={curriculums}
      teachers={teachers}
      introTitle={settings.curriculum_intro_title || 'หลักสูตรที่เปิดสอน'}
      introDesc={
        settings.curriculum_intro_desc ||
        'มุ่งเน้นการพัฒนาผู้เรียนด้วยหลักสูตรที่ทันสมัย ตอบโจทย์ความต้องการของผู้เรียนและสังคม'
      }
      parentNavbars={parentNavbars}
    />
  )
}
