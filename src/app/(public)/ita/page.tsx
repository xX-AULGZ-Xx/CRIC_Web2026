import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import prisma from '@/lib/prisma'
import { getSettings, getThemeClasses } from '@/lib/settings'
import {
  FileCheck2,
  ExternalLink,
  FileText,
  Calendar,
  FolderOpen,
} from 'lucide-react'

interface Props {
  searchParams: Promise<{
    year?: string
  }>
}

export default async function ItaPage(props: Props) {
  const searchParams = await props.searchParams

  // Get available years
  const rawYears = await prisma.ita_main_topics.findMany({
    select: { year: true },
    distinct: ['year'],
    orderBy: { year: 'desc' },
  })

  const years = rawYears.map((y) => y.year).filter(Boolean) as number[]
  if (years.length === 0) years.push(2569)

  const selectedYear = searchParams.year
    ? parseInt(searchParams.year, 10)
    : years[0]

  const [settings, mainTopics] = await Promise.all([
    getSettings(),
    prisma.ita_main_topics.findMany({
      where: { year: selectedYear },
      orderBy: { order_no: 'asc' },
      include: {
        ita_sub_topics: {
          orderBy: { order_no: 'asc' },
          include: {
            ita_tables: {
              orderBy: { order_no: 'asc' },
              include: {
                ita_items: {
                  orderBy: { order_no: 'asc' },
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
  ])

  const theme = getThemeClasses(settings.theme_color)

  const coverBanner =
    settings[`ita_cover_banner_${selectedYear}`] ||
    settings['ita_cover_banner'] ||
    ''

  const formatImagePath = (path: string) => {
    if (path.startsWith('http://') || path.startsWith('https://')) return path
    return path.startsWith('/') ? path : `/${path}`
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <FileCheck2 className="w-8 h-8 text-orange-600" />
          <span>การประเมินคุณธรรมและความโปร่งใส (ITA)</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1.5">
          การเปิดเผยข้อมูลสาธารณะ (Open Data Integrity and Transparency Assessment: OIT) ประจำปีงบประมาณ พ.ศ. {selectedYear}
        </p>
      </div>

      {/* Year Selection Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8">
        {years.map((y) => {
          const active = y === selectedYear
          return (
            <Link
              key={y}
              href={`/ita?year=${y}`}
              className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition flex items-center gap-2 ${
                active
                  ? `${theme.primaryBg} text-white shadow-md`
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>ประจำปี พ.ศ. {y}</span>
            </Link>
          )
        })}
      </div>

      {/* Cover Banner if exists */}
      {coverBanner && (
        <div className="relative aspect-21/9 sm:aspect-3/1 w-full rounded-3xl overflow-hidden mb-10 shadow-sm border border-slate-200">
          <Image
            src={formatImagePath(coverBanner)}
            alt={`ITA Banner ${selectedYear}`}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 1152px) 100vw, 1152px"
          />
        </div>
      )}

      {/* Topics & OIT Items Tree */}
      <div className="space-y-10">
        {mainTopics.map((mainTopic) => (
          <div
            key={mainTopic.id}
            className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs"
          >
            {/* Main Topic Header */}
            <div className={`p-5 sm:p-6 ${theme.accentBg} border-b border-orange-100 flex items-center gap-3`}>
              <h2 className="text-base sm:text-xl font-extrabold text-slate-900">
                {mainTopic.name}
              </h2>
            </div>

            {/* Sub Topics */}
            <div className="p-4 sm:p-6 space-y-6">
              {mainTopic.ita_sub_topics.map((subTopic) => (
                <div key={subTopic.id} className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-800 font-bold text-sm sm:text-base border-b border-slate-100 pb-2">
                    <span className="text-orange-600 font-extrabold">
                      {subTopic.code}
                    </span>
                    <span>{subTopic.name}</span>
                  </div>

                  {/* Tables */}
                  {subTopic.ita_tables.map((table) => (
                    <div
                      key={table.id}
                      className="border border-slate-200/70 rounded-2xl overflow-hidden"
                    >
                      <div className="bg-slate-50 px-4 py-2.5 font-bold text-xs sm:text-sm text-slate-700 flex items-center gap-2">
                        <FolderOpen className="w-4 h-4 text-slate-500" />
                        <span>{table.name}</span>
                      </div>

                      {/* Items */}
                      <div className="divide-y divide-slate-100">
                        {table.ita_items.map((item) => (
                          <div
                            key={item.id}
                            className="p-4 sm:p-5 hover:bg-slate-50/50 transition flex flex-col md:flex-row md:items-start justify-between gap-4"
                          >
                            <div className="space-y-1.5 max-w-2xl">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 ${theme.accentBg} ${theme.primaryText} rounded-md text-xs font-black`}>
                                  {item.item_code}
                                </span>
                                <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                                  {item.element_detail || item.info_detail || item.item_code}
                                </h4>
                              </div>
                              {item.info_detail && item.element_detail && (
                                <div
                                  className="text-xs text-slate-500 prose prose-slate max-w-none pt-1"
                                  dangerouslySetInnerHTML={{ __html: item.info_detail }}
                                />
                              )}
                            </div>

                            {/* Evidence Links */}
                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                              {item.ita_links.map((link) => {
                                const targetUrl = link.url ? (link.url.startsWith('http') ? link.url : `/${link.url.replace(/^\//, '')}`) : '#'
                                return (
                                  <a
                                    key={link.id}
                                    href={targetUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-orange-500 hover:text-orange-600 rounded-xl text-xs font-bold text-slate-700 transition shadow-2xs"
                                  >
                                    <FileText className="w-3.5 h-3.5 text-orange-500" />
                                    <span>{link.link_name || 'เอกสารหลักฐาน'}</span>
                                    <ExternalLink className="w-3 h-3 opacity-50" />
                                  </a>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}

        {mainTopics.length === 0 && (
          <div className="py-20 text-center text-slate-400 bg-white border border-dashed border-slate-200 rounded-3xl">
            <FileCheck2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-base font-semibold">
              ยังไม่มีข้อมูลการประเมิน ITA สำหรับปี พ.ศ. {selectedYear}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
