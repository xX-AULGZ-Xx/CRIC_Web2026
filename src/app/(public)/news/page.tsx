import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import prisma from '@/lib/prisma'
import { getSettings, getThemeClasses } from '@/lib/settings'
import { Newspaper, Eye, ChevronRight, Search, Calendar } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{
    category?: string
    q?: string
    page?: string
  }>
}

export default async function NewsPage(props: Props) {
  const searchParams = await props.searchParams
  const categoryParam = searchParams.category
  const searchQuery = searchParams.q || ''
  const currentPage = Math.max(1, parseInt(searchParams.page || '1', 10))
  const pageSize = 9

  const [settings, categories] = await Promise.all([
    getSettings(),
    prisma.news_categories.findMany({
      orderBy: { id: 'asc' },
    }),
  ])

  const theme = getThemeClasses(settings.theme_color)

  // Determine category filter
  let categoryId: number | undefined = undefined
  if (categoryParam) {
    const num = parseInt(categoryParam, 10)
    if (!isNaN(num)) {
      categoryId = num
    } else {
      const found = categories.find((c) => c.slug === categoryParam)
      if (found) categoryId = found.id
    }
  }

  const whereClause: any = {
    status: 'published',
  }

  if (categoryId) {
    whereClause.category_id = categoryId
  }

  if (searchQuery.trim()) {
    whereClause.OR = [
      { title: { contains: searchQuery.trim() } },
      { content: { contains: searchQuery.trim() } },
    ]
  }

  const [totalCount, newsList] = await Promise.all([
    prisma.news.count({ where: whereClause }),
    prisma.news.findMany({
      where: whereClause,
      include: { news_categories: true },
      orderBy: { created_at: 'desc' },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    }),
  ])

  const totalPages = Math.ceil(totalCount / pageSize)

  const formatImagePath = (path: string) => {
    if (path.startsWith('http://') || path.startsWith('https://')) return path
    return path.startsWith('/') ? path : `/${path}`
  }

  const formatDate = (date: Date | null) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('th-TH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full">
      {/* Header Banner */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          ข่าวประชาสัมพันธ์
        </h1>
        <p className="text-sm text-slate-500 mt-1.5">
          ศูนย์รวมข้อมูลข่าวสาร กิจกรรม และประกาศสำคัญของวิทยาลัยการอาชีพเชียงราย
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-8">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          <Link
            href="/news"
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
              !categoryId
                ? `${theme.primaryBg} text-white shadow-sm`
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            ทั้งหมด
          </Link>
          {categories.map((cat) => {
            const active = categoryId === cat.id
            return (
              <Link
                key={cat.id}
                href={`/news?category=${cat.id}`}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
                  active
                    ? `${theme.primaryBg} text-white shadow-sm`
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {cat.name}
              </Link>
            )
          })}
        </div>

        {/* Search Input */}
        <form
          action="/news"
          method="GET"
          className="flex items-center gap-2 max-w-md w-full md:w-auto"
        >
          {categoryId && (
            <input type="hidden" name="category" value={categoryId} />
          )}
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              name="q"
              defaultValue={searchQuery}
              placeholder="ค้นหาหัวข้อข่าว..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
            />
          </div>
          <button
            type="submit"
            className={`px-4 py-2 ${theme.primaryBg} text-white rounded-xl text-xs sm:text-sm font-bold transition hover:opacity-90`}
          >
            ค้นหา
          </button>
        </form>
      </div>

      {/* News Grid */}
      {newsList.length === 0 ? (
        <div className="py-20 text-center text-slate-400 border border-dashed border-slate-200 rounded-3xl bg-white">
          <Newspaper className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-base font-semibold">ไม่พบข่าวประชาสัมพันธ์ที่ตรงกับเงื่อนไข</p>
          <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนคำค้นหาหรือเลือกหมวดหมู่อื่น</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {newsList.map((item) => {
            const coverUrl = item.cover_image
              ? formatImagePath(item.cover_image)
              : null

            return (
              <article
                key={item.id}
                className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs hover:shadow-xl transition duration-300 flex flex-col justify-between group"
              >
                <div className="aspect-video bg-slate-100 relative overflow-hidden">
                  {coverUrl ? (
                    <Image
                      src={coverUrl}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-105 transition duration-500"
                      style={{
                        objectPosition: `center ${item.cover_position || '50%'}`,
                      }}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Newspaper className="w-10 h-10" />
                    </div>
                  )}
                  <span
                    className={`absolute top-3 left-3 px-3 py-1 ${theme.primaryBg} text-white rounded-full text-[10px] font-bold shadow-md`}
                  >
                    {item.news_categories?.name || 'ทั่วไป'}
                  </span>
                </div>

                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 mb-2">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatDate(item.created_at)}</span>
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-base sm:text-lg leading-snug line-clamp-2 group-hover:text-orange-600 transition">
                      <Link href={`/news/${item.slug || item.id}`}>
                        {item.title}
                      </Link>
                    </h3>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs font-semibold text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{Number(item.views || 0).toLocaleString()} เข้าชม</span>
                    </span>
                    <Link
                      href={`/news/${item.slug || item.id}`}
                      className={`${theme.primaryText} hover:underline flex items-center gap-0.5 font-bold`}
                    >
                      <span>อ่านต่อ</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-12">
          {Array.from({ length: totalPages }).map((_, i) => {
            const p = i + 1
            const isCurrent = p === currentPage
            const queryParams = new URLSearchParams()
            if (categoryId) queryParams.set('category', String(categoryId))
            if (searchQuery) queryParams.set('q', searchQuery)
            queryParams.set('page', String(p))

            return (
              <Link
                key={p}
                href={`/news?${queryParams.toString()}`}
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs sm:text-sm font-bold transition ${
                  isCurrent
                    ? `${theme.primaryBg} text-white shadow-sm`
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {p}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
