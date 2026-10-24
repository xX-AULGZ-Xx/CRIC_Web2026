'use client'

import React, { useState } from 'react'
import { Link2, Search, Copy, Check, ExternalLink } from 'lucide-react'

interface PathEntry {
  category: 'system' | 'pages' | 'departments' | 'news'
  title: string
  path: string
  badge: string
}

export function PathsAdminClient({ entries }: { entries: PathEntry[] }) {
  const [tab, setTab] = useState<'all' | 'system' | 'pages' | 'departments' | 'news'>('all')
  const [search, setSearch] = useState('')
  const [copiedPath, setCopiedPath] = useState<string | null>(null)

  const handleCopy = (path: string) => {
    navigator.clipboard.writeText(path)
    setCopiedPath(path)
    setTimeout(() => setCopiedPath(null), 2000)
  }

  const filtered = entries.filter((e) => {
    const matchTab = tab === 'all' || e.category === tab
    const matchSearch =
      !search ||
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.path.toLowerCase().includes(search.toLowerCase())
    return matchTab && matchSearch
  })

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Link2 className="w-6 h-6 text-indigo-600" />
          รายการลิงก์ภายในระบบ (Internal Paths Directory)
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          รวมรายชื่อ URL ของหน้าเว็บทั้งหมดในระบบ สำหรับคัดลอกไปใส่ในโครงสร้างเมนู (Navbar) สไลด์แบนเนอร์ หรือข้อมูล ITA
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {[
            { key: 'all', label: `ทั้งหมด (${entries.length})` },
            { key: 'system', label: 'หน้าระบบหลัก' },
            { key: 'pages', label: 'หน้าเพจเนื้อหา' },
            { key: 'departments', label: 'แผนก/ฝ่ายบุคลากร' },
            { key: 'news', label: 'หมวดข่าว & ข่าวล่าสุด' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                tab === t.key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อหน้าหรือ URL..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
          />
        </div>
      </div>

      {/* Paths Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between gap-3"
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-indigo-50 text-indigo-700">
                  {item.badge}
                </span>
                <a
                  href={item.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-600"
                  title="เปิดดูหน้าเว็บ"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <h3 className="font-bold text-slate-800 text-sm line-clamp-1">{item.title}</h3>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <code className="text-xs font-mono text-indigo-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/80 truncate flex-1">
                {item.path}
              </code>
              <button
                onClick={() => handleCopy(item.path)}
                className="inline-flex items-center px-3 py-1.5 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl cursor-pointer shrink-0 transition-colors"
              >
                {copiedPath === item.path ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" /> คัดลอกแล้ว
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 mr-1" /> คัดลอก
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
