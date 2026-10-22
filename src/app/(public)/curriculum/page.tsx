import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import prisma from '@/lib/prisma'
import { getSettings, getThemeClasses } from '@/lib/settings'
import { GraduationCap, ArrowRight, BookOpen, Clock, ChevronRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{
    level?: string
  }>
}

export default async function CurriculumPage(props: Props) {
  const searchParams = await props.searchParams
  const levelFilter = searchParams.level

  const [settings, allCurriculums] = await Promise.all([
    getSettings(),
    prisma.curriculums.findMany({
      orderBy: { id: 'asc' },
    }),
  ])

  const theme = getThemeClasses(settings.theme_color)

  // Levels
  const levels = ['ทั้งหมด', 'ปวช.', 'ปวส.', 'ปวช.-ปวส.']

  const filtered = levelFilter && levelFilter !== 'ทั้งหมด'
    ? allCurriculums.filter((c) => c.level === levelFilter)
    : allCurriculums

  const formatImagePath = (path: string | null) => {
    if (!path) return '/assets/images/default-curriculum.jpg'
    if (path.startsWith('http://') || path.startsWith('https://')) return path
    return path.startsWith('/') ? path : `/${path}`
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          {settings.curriculum_page_title || 'สาขาวิชาที่เปิดสอน'}
        </h1>
        <p className="text-sm text-slate-500 mt-1.5">
          หลักสูตรการศึกษาและสาขาวิชาชีพที่เปิดรับสมัคร วิทยาลัยการอาชีพเชียงราย
        </p>
      </div>

      {/* Level Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8">
        {levels.map((lvl) => {
          const active = (lvl === 'ทั้งหมด' && (!levelFilter || levelFilter === 'ทั้งหมด')) || levelFilter === lvl
          return (
            <Link
              key={lvl}
              href={lvl === 'ทั้งหมด' ? '/curriculum' : `/curriculum?level=${encodeURIComponent(lvl)}`}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
                active
                  ? `${theme.primaryBg} text-white shadow-sm`
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {lvl === 'ทั้งหมด' ? 'ทุกระดับชั้น' : `ระดับ ${lvl}`}
            </Link>
          )
        })}
      </div>

      {/* Programs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {filtered.map((item) => (
          <article
            key={item.id}
            className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
          >
            <div className="aspect-video bg-slate-100 relative overflow-hidden">
              <Image
                src={formatImagePath(item.image_path)}
                alt={item.name}
                fill
                className="object-cover group-hover:scale-105 transition duration-500"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              <span
                className={`absolute top-3 left-3 px-3 py-1 ${theme.primaryBg} text-white rounded-full text-[10px] font-bold shadow-md`}
              >
                {item.level || 'ปวช.-ปวส.'}
              </span>
            </div>

            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl leading-snug group-hover:text-orange-600 transition">
                  <Link href={`/curriculum/${item.id}`}>{item.name}</Link>
                </h3>
                {item.description && (
                  <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                    {item.description.replace(/<[^>]*>/g, '')}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{item.duration || 'ระยะเวลาตามหลักสูตร'}</span>
                </span>
                <Link
                  href={`/curriculum/${item.id}`}
                  className={`${theme.primaryText} hover:underline flex items-center gap-0.5 font-bold`}
                >
                  <span>รายละเอียด</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
