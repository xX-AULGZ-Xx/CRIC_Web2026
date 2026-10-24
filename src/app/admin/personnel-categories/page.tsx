import React from 'react'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { PersonnelCategoriesClient } from './PersonnelCategoriesClient'

export const dynamic = 'force-dynamic'

export default async function AdminPersonnelCategoriesPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const session = await getSession()
  if (!session) redirect('/admin/login')

  const sp = searchParams ? await searchParams : {}
  const initialSubId = sp.sub_id ? Number(sp.sub_id) : null

  const [categories, personnel, specialDuties, navbars] = await Promise.all([
    prisma.personnel_categories.findMany({
      orderBy: [{ order_num: 'asc' }, { id: 'asc' }],
    }),
    prisma.personnel.findMany({
      where: { is_active: true },
      orderBy: [{ order_num: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        name: true,
        position: true,
        category_id: true,
        is_head: true,
        image_path: true,
      },
    }),
    prisma.personnel_special_duties.findMany(),
    prisma.navbars.findMany({
      orderBy: [{ parent_id: 'asc' }, { order_num: 'asc' }],
      select: {
        id: true,
        parent_id: true,
        label: true,
        url: true,
      },
    }),
  ])

  return (
    <PersonnelCategoriesClient
      categories={categories}
      personnel={personnel}
      specialDuties={specialDuties}
      navbars={navbars}
      initialSubId={initialSubId}
    />
  )
}
