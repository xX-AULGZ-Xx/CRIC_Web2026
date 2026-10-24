import React from 'react'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { MigrationClient } from './MigrationClient'

export const dynamic = 'force-dynamic'

export default async function AdminDatabasePage() {
  const session = await getSession()
  if (!session) redirect('/admin/login')

  const [
    settingsCount,
    usersCount,
    navbarsCount,
    slidersCount,
    newsCount,
    newsCatCount,
    pagesCount,
    personnelCount,
    pCatCount,
    pPosCount,
    curriculumCount,
    galleriesCount,
    gImgCount,
    downloadsCount,
    dCatCount,
    complaintsCount,
    itaMainCount,
    itaSubCount,
    itaTableCount,
    itaItemCount,
    itaLinkCount,
    mediaCount,
    auditCount,
  ] = await Promise.all([
    prisma.settings.count().catch(() => 0),
    prisma.users.count().catch(() => 0),
    prisma.navbars.count().catch(() => 0),
    prisma.sliders.count().catch(() => 0),
    prisma.news.count().catch(() => 0),
    prisma.news_categories.count().catch(() => 0),
    prisma.static_pages.count().catch(() => 0),
    prisma.personnel.count().catch(() => 0),
    prisma.personnel_categories.count().catch(() => 0),
    prisma.personnel_positions.count().catch(() => 0),
    prisma.curriculums.count().catch(() => 0),
    prisma.galleries.count().catch(() => 0),
    prisma.gallery_images.count().catch(() => 0),
    prisma.downloads.count().catch(() => 0),
    prisma.download_categories.count().catch(() => 0),
    prisma.complaints.count().catch(() => 0),
    prisma.ita_main_topics.count().catch(() => 0),
    prisma.ita_sub_topics.count().catch(() => 0),
    prisma.ita_tables.count().catch(() => 0),
    prisma.ita_items.count().catch(() => 0),
    prisma.ita_links.count().catch(() => 0),
    prisma.media.count().catch(() => 0),
    prisma.audit_logs.count().catch(() => 0),
  ])

  const tables = [
    { name: 'settings', label: 'การตั้งค่าเว็บไซต์', count: settingsCount },
    { name: 'users', label: 'ผู้ใช้งานระบบ', count: usersCount },
    { name: 'navbars', label: 'โครงสร้างเมนู', count: navbarsCount },
    { name: 'sliders', label: 'สไลด์แบนเนอร์', count: slidersCount },
    { name: 'news', label: 'ข่าวประชาสัมพันธ์', count: newsCount },
    { name: 'news_categories', label: 'หมวดหมู่ข่าว', count: newsCatCount },
    { name: 'static_pages', label: 'หน้าเพจเนื้อหา', count: pagesCount },
    { name: 'personnel', label: 'ทำเนียบบุคลากร', count: personnelCount },
    { name: 'personnel_categories', label: 'แผนก/ฝ่ายบุคลากร', count: pCatCount },
    { name: 'personnel_positions', label: 'ตำแหน่งบุคลากร', count: pPosCount },
    { name: 'curriculums', label: 'หลักสูตรการศึกษา', count: curriculumCount },
    { name: 'galleries', label: 'อัลบั้มภาพกิจกรรม', count: galleriesCount },
    { name: 'gallery_images', label: 'รูปภาพในอัลบั้ม', count: gImgCount },
    { name: 'downloads', label: 'ไฟล์ศูนย์ดาวน์โหลด', count: downloadsCount },
    { name: 'download_categories', label: 'หมวดหมู่ดาวน์โหลด', count: dCatCount },
    { name: 'complaints', label: 'เรื่องร้องเรียน', count: complaintsCount },
    { name: 'ita_main_topics', label: 'หัวข้อหลัก ITA', count: itaMainCount },
    { name: 'ita_sub_topics', label: 'หัวข้อย่อย ITA', count: itaSubCount },
    { name: 'ita_tables', label: 'ตาราง ITA', count: itaTableCount },
    { name: 'ita_items', label: 'ข้อตัวชี้วัด ITA', count: itaItemCount },
    { name: 'ita_links', label: 'ลิงก์เอกสาร ITA', count: itaLinkCount },
    { name: 'media', label: 'คลังสื่ออัปโหลด', count: mediaCount },
    { name: 'audit_logs', label: 'ประวัติการใช้งานระบบ', count: auditCount },
  ]

  return <MigrationClient tables={tables} />
}
