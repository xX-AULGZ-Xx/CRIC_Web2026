import React from 'react'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { PathsAdminClient } from './PathsAdminClient'

export const dynamic = 'force-dynamic'

export default async function AdminPathsPage() {
  const session = await getSession()
  if (!session) redirect('/admin/login')

  const [pages, departments, newsCategories, recentNews] = await Promise.all([
    prisma.static_pages.findMany({ orderBy: { id: 'asc' } }),
    prisma.personnel_categories.findMany({ orderBy: { order_num: 'asc' } }),
    prisma.news_categories.findMany({ orderBy: { id: 'asc' } }),
    prisma.news.findMany({
      take: 20,
      orderBy: { created_at: 'desc' },
      select: { title: true, slug: true },
    }),
  ])

  const entries: Array<{
    category: 'system' | 'pages' | 'departments' | 'news'
    title: string
    path: string
    badge: string
  }> = [
    { category: 'system', title: 'หน้าแรกเว็บไซต์', path: '/', badge: 'ระบบหลัก' },
    { category: 'system', title: 'ข่าวสารและกิจกรรมทั้งหมด', path: '/news', badge: 'ระบบหลัก' },
    { category: 'system', title: 'ทำเนียบบุคลากรทั้งหมด', path: '/personnel', badge: 'ระบบหลัก' },
    { category: 'system', title: 'ทำเนียบผู้บริหาร', path: '/executives', badge: 'ระบบหลัก' },
    { category: 'system', title: 'หลักสูตรการศึกษาที่เปิดสอน', path: '/curriculum', badge: 'ระบบหลัก' },
    { category: 'system', title: 'คลังภาพกิจกรรม (Galleries)', path: '/galleries', badge: 'ระบบหลัก' },
    { category: 'system', title: 'ศูนย์ดาวน์โหลดเอกสาร', path: '/downloads', badge: 'ระบบหลัก' },
    { category: 'system', title: 'ข้อมูลการประเมินคุณธรรมและความโปร่งใส (ITA)', path: '/ita', badge: 'ระบบหลัก' },
    { category: 'system', title: 'ศูนย์รับเรื่องร้องเรียนและแจ้งเบาะแส', path: '/complaints', badge: 'ระบบหลัก' },
    { category: 'system', title: 'ติดต่อสถานศึกษา', path: '/contact', badge: 'ระบบหลัก' },
  ]

  pages.forEach((p) => {
    entries.push({
      category: 'pages',
      title: p.title,
      path: p.slug === 'home' ? '/' : `/page/${p.slug}`,
      badge: 'หน้าเพจ (Static Page)',
    })
  })

  departments.forEach((d) => {
    entries.push({
      category: 'departments',
      title: `บุคลากร: ${d.name}`,
      path: `/personnel?category=${d.id}`,
      badge: 'หมวดหมู่บุคลากร',
    })
  })

  newsCategories.forEach((c) => {
    entries.push({
      category: 'news',
      title: `หมวดข่าว: ${c.name}`,
      path: `/news?category=${c.slug}`,
      badge: 'หมวดหมู่ข่าว',
    })
  })

  recentNews.forEach((n) => {
    entries.push({
      category: 'news',
      title: n.title,
      path: `/news/${n.slug}`,
      badge: 'บทความข่าว',
    })
  })

  return <PathsAdminClient entries={entries} />
}
