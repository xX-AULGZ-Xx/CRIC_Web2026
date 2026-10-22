import React from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { FileText, ExternalLink } from 'lucide-react'

export default async function AdminPagesPage() {
  const session = await getSession()
  if (!session) redirect('/admin/login')

  const pages = await prisma.static_pages.findMany({
    orderBy: { id: 'asc' },
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
          <FileText className="w-6 h-6 text-orange-500" />
          <span>จัดการหน้าเนื้อหาคงที่ (Static Pages)</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          หน้าเนื้อหาทั้งหมด ({pages.length} หน้า)
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 px-6">ชื่อหน้าเนื้อหา</th>
                <th className="py-3.5 px-4">Slug (URL)</th>
                <th className="py-3.5 px-4">SEO Title</th>
                <th className="py-3.5 px-6 text-right">ลิงก์เปิดดู</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {pages.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-6 font-bold text-white">
                    {p.title}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-orange-400">
                    /pages/{p.slug}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate">
                    {p.meta_title || '-'}
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    <Link
                      href={p.slug === 'home' ? '/' : `/pages/${p.slug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition"
                    >
                      <span>เปิดดู</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
