import React from 'react'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import { getSettings, getThemeClasses } from '@/lib/settings'
import { Download, FileText, Calendar, HardDrive, CheckCircle2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{
    category?: string
  }>
}

export default async function DownloadsPage(props: Props) {
  const searchParams = await props.searchParams
  const catParam = searchParams.category

  const [settings, categories, allDownloads] = await Promise.all([
    getSettings(),
    prisma.download_categories.findMany({
      orderBy: { order_num: 'asc' },
    }),
    prisma.downloads.findMany({
      include: { download_categories: true },
      orderBy: { created_at: 'desc' },
    }),
  ])

  const theme = getThemeClasses(settings.theme_color)

  const selectedCatId = catParam ? parseInt(catParam, 10) : undefined

  const filtered = selectedCatId
    ? allDownloads.filter((d) => d.category_id === selectedCatId)
    : allDownloads

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '0 B'
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`
  }

  const formatFilePath = (path: string) => {
    if (path.startsWith('http://') || path.startsWith('https://')) return path
    return path.startsWith('/') ? path : `/${path}`
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <Download className="w-8 h-8 text-orange-600" />
          <span>ศูนย์ดาวน์โหลดเอกสาร</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1.5">
          ดาวน์โหลดแบบฟอร์ม ประกาศ ระเบียบ และเอกสารเผยแพร่ต่างๆ ของวิทยาลัย
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8">
        <Link
          href="/downloads"
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
            !selectedCatId
              ? `${theme.primaryBg} text-white shadow-sm`
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          ทั้งหมด ({allDownloads.length})
        </Link>
        {categories.map((cat) => {
          const active = selectedCatId === cat.id
          const count = allDownloads.filter((d) => d.category_id === cat.id).length
          return (
            <Link
              key={cat.id}
              href={`/downloads?category=${cat.id}`}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
                active
                  ? `${theme.primaryBg} text-white shadow-sm`
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {cat.name} ({count})
            </Link>
          )
        })}
      </div>

      {/* Downloads List */}
      <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs divide-y divide-slate-100">
        {filtered.map((item) => {
          const fileUrl = formatFilePath(item.file_path)

          return (
            <div
              key={item.id}
              className="p-5 sm:p-6 hover:bg-slate-50/60 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {item.download_categories?.name || 'ทั่วไป'}
                  </span>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                    {item.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-0.5">
                    {item.created_at && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(item.created_at).toLocaleDateString('th-TH')}</span>
                      </span>
                    )}
                    {item.file_size ? (
                      <span className="flex items-center gap-1">
                        <HardDrive className="w-3.5 h-3.5" />
                        <span>{formatFileSize(item.file_size)}</span>
                      </span>
                    ) : null}
                    <span className="flex items-center gap-1">
                      <Download className="w-3.5 h-3.5" />
                      <span>{Number(item.downloads_count || 0).toLocaleString()} ครั้ง</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="sm:self-center shrink-0">
                <a
                  href={fileUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-2 px-5 py-2.5 ${theme.primaryBg} text-white font-bold rounded-xl text-xs sm:text-sm shadow-xs hover:opacity-95 transition`}
                >
                  <Download className="w-4 h-4" />
                  <span>ดาวน์โหลด</span>
                </a>
              </div>
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="py-20 text-center text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-base font-semibold">ไม่พบไฟล์เอกสารในหมวดหมู่นี้</p>
          </div>
        )}
      </div>
    </div>
  )
}
