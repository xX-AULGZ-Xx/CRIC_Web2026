import React from 'react'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { Download } from 'lucide-react'

export default async function AdminDownloadsPage() {
  const session = await getSession()
  if (!session) redirect('/admin/login')

  const downloads = await prisma.downloads.findMany({
    include: { download_categories: true },
    orderBy: { created_at: 'desc' },
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
          <Download className="w-6 h-6 text-orange-500" />
          <span>จัดการศูนย์ดาวน์โหลดเอกสาร</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          เอกสารเผยแพร่ทั้งหมด ({downloads.length} ไฟล์)
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 px-6">ชื่อเอกสาร</th>
                <th className="py-3.5 px-4">หมวดหมู่</th>
                <th className="py-3.5 px-4 text-center">ดาวน์โหลด</th>
                <th className="py-3.5 px-4">วันที่อัปโหลด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {downloads.map((d) => (
                <tr key={d.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-6 font-bold text-white max-w-md truncate">
                    {d.title}
                  </td>
                  <td className="py-3.5 px-4 text-orange-400">
                    {d.download_categories?.name || 'ทั่วไป'}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-slate-400">
                    {Number(d.downloads_count || 0).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                    {d.created_at ? new Date(d.created_at).toLocaleDateString('th-TH') : '-'}
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
