import React from 'react'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { FileCheck2 } from 'lucide-react'

export default async function AdminItaPage() {
  const session = await getSession()
  if (!session) redirect('/admin/login')

  const mainTopics = await prisma.ita_main_topics.findMany({
    include: {
      ita_sub_topics: {
        include: {
          _count: { select: { ita_tables: true } },
        },
      },
    },
    orderBy: { order_no: 'asc' },
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
          <FileCheck2 className="w-6 h-6 text-orange-500" />
          <span>จัดการการประเมินคุณธรรมและความโปร่งใส (ITA)</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          หัวข้อการเปิดเผยข้อมูลสาธารณะ (OIT)
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 px-6">ปีงบประมาณ</th>
                <th className="py-3.5 px-4">หัวข้อหลัก (Main Topic)</th>
                <th className="py-3.5 px-4 text-center">หัวข้อย่อย</th>
                <th className="py-3.5 px-4">ลำดับ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {mainTopics.map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-6 font-mono font-bold text-orange-400">
                    {t.year}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-white max-w-md">
                    {t.name}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-slate-300">
                    {t.ita_sub_topics.length} หัวข้อ
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 font-mono">
                    {t.order_no}
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
