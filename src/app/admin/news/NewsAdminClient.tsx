'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Newspaper,
  Plus,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Search,
  ExternalLink,
} from 'lucide-react'

export function NewsAdminClient({
  newsList,
  categories,
}: {
  newsList: any[]
  categories: any[]
}) {
  const router = useRouter()
  const [items, setItems] = useState(newsList)
  const [search, setSearch] = useState('')
  const [isProcessing, setIsProcessing] = useState<number | null>(null)

  const filtered = items.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase())
  )

  async function handleToggleStatus(id: number, currentStatus: string) {
    setIsProcessing(id)
    try {
      const res = await fetch('/api/admin/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle-status', id, status: currentStatus }),
      })
      const data = await res.json()
      if (data.success) {
        setItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: data.status } : item))
        )
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการเปลี่ยนสถานะ')
    } finally {
      setIsProcessing(null)
    }
  }

  async function handleDelete(id: number, title: string) {
    if (!confirm(`ยืนยันการลบข่าว: "${title}" หรือไม่?`)) return
    setIsProcessing(id)
    try {
      const res = await fetch('/api/admin/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      })
      const data = await res.json()
      if (data.success) {
        setItems((prev) => prev.filter((item) => item.id !== id))
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการลบ')
    } finally {
      setIsProcessing(null)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Newspaper className="w-6 h-6 text-orange-500" />
            <span>จัดการข่าวสารประชาสัมพันธ์</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            รายการข่าวทั้งหมด ({items.length} รายการ)
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อข่าว..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:border-orange-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 px-6">หัวข้อข่าว</th>
                <th className="py-3.5 px-4">หมวดหมู่</th>
                <th className="py-3.5 px-4 text-center">เข้าชม</th>
                <th className="py-3.5 px-4 text-center">สถานะ</th>
                <th className="py-3.5 px-4">วันที่ลงข่าว</th>
                <th className="py-3.5 px-6 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-4 px-6 font-bold text-white max-w-md">
                    <div className="flex items-center gap-2">
                      <span className="truncate">{item.title}</span>
                      <Link
                        href={`/news/${item.slug || item.id}`}
                        target="_blank"
                        className="text-slate-500 hover:text-white transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-slate-400">
                    <span className="px-2.5 py-1 bg-slate-800 rounded-lg text-[10px] font-semibold text-slate-300">
                      {item.news_categories?.name || 'ทั่วไป'}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center font-mono text-slate-400">
                    {Number(item.views || 0).toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <button
                      onClick={() => handleToggleStatus(item.id, item.status)}
                      disabled={isProcessing === item.id}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition ${
                        item.status === 'published'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                          : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-750'
                      }`}
                    >
                      {item.status === 'published' ? (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          <span>เผยแพร่</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3" />
                          <span>ฉบับร่าง</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="py-4 px-4 text-slate-500 text-[11px]">
                    {item.created_at ? new Date(item.created_at).toLocaleDateString('th-TH') : '-'}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => handleDelete(item.id, item.title)}
                      disabled={isProcessing === item.id}
                      className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                      title="ลบข่าว"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    ไม่พบข้อมูลข่าวสาร
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
