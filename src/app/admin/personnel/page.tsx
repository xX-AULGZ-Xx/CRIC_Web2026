import React from 'react'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { PersonnelAdminClient } from './PersonnelAdminClient'

export const dynamic = 'force-dynamic'

function getPersonnelRank(p: { position: string; is_executive: boolean | null }): number {
  const pos = (p.position || '').trim()
  if (pos.includes('ผู้อำนวยการ') && !pos.includes('รอง')) return 1 // ผู้อำนวยการ
  if (pos.includes('รองผู้อำนวยการ')) return 2 // รองผู้อำนวยการ
  if (p.is_executive) return 3 // ครู ทำหน้าที่รองผู้อำนวยการ (ผู้บริหาร)
  return 4 // บุคลากรทั่วไป
}

export default async function AdminPersonnelPage() {
  const session = await getSession()
  if (!session) redirect('/admin/login')

  const [personnelList, categories, positions, curriculums] = await Promise.all([
    prisma.personnel.findMany({
      include: {
        personnel_categories: { select: { id: true, name: true, order_num: true, parent_id: true } },
        personnel_position_links: { select: { position_id: true } },
        personnel_special_duties: {
          select: {
            id: true,
            category_id: true,
            special_position: true,
            is_head: true,
          },
        },
      },
    }),
    prisma.personnel_categories.findMany({
      orderBy: [{ parent_id: 'asc' }, { order_num: 'asc' }],
      select: { id: true, name: true, parent_id: true },
    }),
    prisma.personnel_positions.findMany({
      orderBy: [{ order_num: 'asc' }, { id: 'asc' }],
      select: { id: true, name: true },
    }),
    prisma.curriculums.findMany({
      orderBy: { id: 'asc' },
      select: { id: true, name: true },
    }),
  ])

  // Sort with Executives first (ผู้อำนวยการ -> รองผู้อำนวยการ -> ครู ทำหน้าที่รองผู้อำนวยการ -> บุคลากรทั่วไป)
  const sortedPersonnel = [...personnelList].sort((a, b) => {
    const rankA = getPersonnelRank(a)
    const rankB = getPersonnelRank(b)
    if (rankA !== rankB) return rankA - rankB

    const ordA = a.order_num ?? 9999
    const ordB = b.order_num ?? 9999
    if (ordA !== ordB) return ordA - ordB

    return a.id - b.id
  })

  return (
    <PersonnelAdminClient
      initialPersonnel={sortedPersonnel}
      categories={categories}
      positions={positions}
      curriculums={curriculums}
    />
  )
}
