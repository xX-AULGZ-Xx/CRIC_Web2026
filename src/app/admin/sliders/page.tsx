import React from 'react'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { Sliders } from 'lucide-react'

export default async function AdminSlidersPage() {
  const session = await getSession()
  if (!session) redirect('/admin/login')

  const sliders = await prisma.sliders.findMany({
    orderBy: { order_num: 'asc' },
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
          <Sliders className="w-6 h-6 text-orange-500" />
          <span>จัดการแบนเนอร์สไลด์หน้าแรก</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          สไลเดอร์ทั้งหมด ({sliders.length} ภาพ)
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 px-6">ลำดับ</th>
                <th className="py-3.5 px-4">หัวข้อสไลด์</th>
                <th className="py-3.5 px-4">คำบรรยายย่อย</th>
                <th className="py-3.5 px-4 text-center">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {sliders.map((s) => (
                <tr key={s.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-6 font-mono font-bold text-orange-400">
                    {s.order_num}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-white max-w-sm truncate">
                    {s.title}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate">
                    {s.subtitle || '-'}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        s.is_active
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {s.is_active ? 'แสดงผล' : 'ปิด'}
                    </span>
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
