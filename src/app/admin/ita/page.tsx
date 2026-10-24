import React from 'react'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { ItaAdminClient } from './ItaAdminClient'

export const dynamic = 'force-dynamic'

export default async function AdminItaPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const session = await getSession()
  if (!session) redirect('/admin/login')

  const sp = searchParams ? await searchParams : {}
  const paramYear = sp.year ? Number(sp.year) : undefined
  const paramActiveTable = sp.active_table ? Number(sp.active_table) : undefined

  const [mainTopics, settingsRows] = await Promise.all([
    prisma.ita_main_topics.findMany({
      orderBy: [{ year: 'desc' }, { order_no: 'asc' }, { id: 'asc' }],
      include: {
        ita_sub_topics: {
          orderBy: [{ order_no: 'asc' }, { id: 'asc' }],
          include: {
            ita_tables: {
              orderBy: [{ order_no: 'asc' }, { id: 'asc' }],
              include: {
                ita_items: {
                  orderBy: [{ order_no: 'asc' }, { id: 'asc' }],
                  include: {
                    ita_links: {
                      orderBy: { id: 'asc' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.settings.findMany({
      where: {
        setting_key: {
          startsWith: 'ita_',
        },
      },
    }),
  ])

  const settingsMap: Record<string, string> = {}
  settingsRows.forEach((r) => {
    settingsMap[r.setting_key] = r.setting_value || ''
  })

  const yearSet = new Set<number>()
  mainTopics.forEach((m) => yearSet.add(m.year))
  if (yearSet.size === 0) yearSet.add(2569)
  const availableYears = Array.from(yearSet).sort((a, b) => b - a)

  const selectedYear = paramYear && availableYears.includes(paramYear) ? paramYear : availableYears[0]

  return (
    <ItaAdminClient
      mainTopics={mainTopics as any}
      availableYears={availableYears}
      settingsMap={settingsMap}
      initialYear={selectedYear}
      initialActiveTableId={paramActiveTable}
    />
  )
}
