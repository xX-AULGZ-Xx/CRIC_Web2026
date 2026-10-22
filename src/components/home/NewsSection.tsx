import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Eye, Newspaper, ChevronRight } from 'lucide-react'
import { getThemeClasses } from '@/lib/settings'

export interface NewsCardData {
  id: number
  title: string
  slug: string
  cover_image: string | null
  cover_position: string | null
  created_at: Date | null
  views: number | null
  category_name: string
}

interface NewsSectionProps {
  title: string
  subtitle: string
  newsList: NewsCardData[]
  viewAllUrl: string
  themeColor?: string
}

export function NewsSection({
  title,
  subtitle,
  newsList,
  viewAllUrl,
  themeColor = 'orange',
}: NewsSectionProps) {
  const theme = getThemeClasses(themeColor)

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
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">{subtitle}</p>
        </div>
        <Link
          href={viewAllUrl}
          className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition text-sm flex items-center justify-center gap-1.5 shrink-0 self-start sm:self-auto"
        >
          <span>ดูทั้งหมด</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {newsList.length === 0 ? (
        <div className="py-16 text-center text-slate-400 border border-dashed border-slate-200 rounded-3xl">
          <Newspaper className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-sm">อยู่ระหว่างการนำข้อมูลเข้าสู่ระบบ</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {newsList.map((item) => {
            const coverUrl = item.cover_image ? formatImagePath(item.cover_image) : null

            return (
              <article
                key={item.id}
                className="bg-white border border-slate-200/70 rounded-3xl overflow-hidden shadow-xs hover:shadow-xl transition duration-300 flex flex-col justify-between group"
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
                    {item.category_name}
                  </span>
                </div>

                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-[11px] text-slate-400 font-medium block mb-2">
                      {formatDate(item.created_at)}
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
                      <span>รายละเอียด</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
