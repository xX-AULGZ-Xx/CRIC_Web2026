import React from 'react'
import prisma from '@/lib/prisma'
import { getSettings } from '@/lib/settings'
import { HomeSlider } from '@/components/home/HomeSlider'
import { QuickAccess } from '@/components/home/QuickAccess'
import { NewsSection, NewsCardData } from '@/components/home/NewsSection'
import { ExecutivesSection, ExecutiveData } from '@/components/home/ExecutivesSection'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [settings, slidersData, latestNewsData, executivesData, cat6NewsData, cat7NewsData] =
    await Promise.all([
      getSettings(),
      prisma.sliders.findMany({
        where: { is_active: true },
        orderBy: { order_num: 'asc' },
      }),
      prisma.news.findMany({
        where: { status: 'published' },
        include: { news_categories: true },
        orderBy: { created_at: 'desc' },
        take: 6,
      }),
      prisma.personnel.findMany({
        where: {
          is_active: true,
          OR: [
            { is_executive: true },
            { personnel_categories: { name: { contains: 'ผู้บริหาร' } } },
          ],
        },
        include: { personnel_categories: true },
        orderBy: [
          { personnel_categories: { order_num: 'asc' } },
          { order_num: 'asc' },
        ],
        take: 10,
      }),
      // Category 6: การเชิดชูเกียรติ
      prisma.news.findMany({
        where: { status: 'published', category_id: 6 },
        include: { news_categories: true },
        orderBy: { created_at: 'desc' },
        take: 3,
      }),
      // Category 7: รางวัลความสำเร็จ
      prisma.news.findMany({
        where: { status: 'published', category_id: 7 },
        include: { news_categories: true },
        orderBy: { created_at: 'desc' },
        take: 3,
      }),
    ])

  const mapNewsCard = (item: any): NewsCardData => ({
    id: item.id,
    title: item.title,
    slug: item.slug || String(item.id),
    cover_image: item.cover_image,
    cover_position: item.cover_position,
    created_at: item.created_at,
    views: item.views,
    category_name: item.news_categories?.name || 'ทั่วไป',
  })

  const latestNews = latestNewsData.map(mapNewsCard)
  const cat6News = cat6NewsData.map(mapNewsCard)
  const cat7News = cat7NewsData.map(mapNewsCard)

  const executives: ExecutiveData[] = executivesData.map((p) => ({
    id: p.id,
    name: p.name,
    position: p.position,
    image_path: p.image_path,
    contact_info: p.contact_info,
    cat_name: p.personnel_categories?.name || 'คณะผู้บริหาร',
    is_executive: p.is_executive,
  }))

  return (
    <div className="flex flex-col items-center w-full">
      {/* 1. Hero Sliders */}
      <HomeSlider sliders={slidersData} />

      {/* 2. Quick Access Services */}
      <QuickAccess />

      {/* 3. Latest News */}
      <NewsSection
        title="ข่าวประชาสัมพันธ์ล่าสุด"
        subtitle="อัปเดตข่าวสารกิจกรรม การศึกษา ผลงานของวิทยาลัยได้ที่นี่"
        newsList={latestNews}
        viewAllUrl="/news"
        themeColor={settings.theme_color}
      />

      {/* 4. Categorized News 6 */}
      {cat6News.length > 0 && (
        <NewsSection
          title="การเชิดชู เกียรติครูและบุคลากรดีเด่น"
          subtitle="ผลงานและความภาคภูมิใจของบุคลากรทางการศึกษา วิทยาลัยการอาชีพเชียงราย"
          newsList={cat6News}
          viewAllUrl="/news?category=6"
          themeColor={settings.theme_color}
        />
      )}

      {/* 5. Categorized News 7 */}
      {cat7News.length > 0 && (
        <NewsSection
          title="รางวัลความสำเร็จ"
          subtitle="รางวัลเชิดชูเกียรติ ความภาคภูมิใจ และผลงานดีเด่นของนักเรียนนักศึกษา"
          newsList={cat7News}
          viewAllUrl="/news?category=7"
          themeColor={settings.theme_color}
        />
      )}

      {/* 6. Executives Section */}
      <ExecutivesSection
        executives={executives}
        themeColor={settings.theme_color}
      />
    </div>
  )
}
