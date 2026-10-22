import React from 'react'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { Users, Award } from 'lucide-react'

export default async function AdminPersonnelPage() {
  const session = await getSession()
  if (!session) redirect('/admin/login')

  const people = await prisma.personnel.findMany({
    include: { personnel_categories: true },
    orderBy: [{ order_num: 'asc' }, { id: 'asc' }],
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
          <Users className="w-6 h-6 text-orange-500" />
          <span>จัดการข้อมูลบุคลากร</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          รายชื่อคณะผู้บริหาร ครู และบุคลากรทั้งหมด ({people.length} ท่าน)
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 px-6">ชื่อ-สกุล</th>
                <th className="py-3.5 px-4">ตำแหน่ง</th>
                <th className="py-3.5 px-4">ฝ่าย/แผนก</th>
                <th className="py-3.5 px-4">ข้อมูลติดต่อ</th>
                <th className="py-3.5 px-4 text-center">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {people.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-6 font-bold text-white">
                    {p.name}
                  </td>
                  <td className="py-3.5 px-4 text-orange-400 font-medium">
                    {p.position}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">
                    {p.personnel_categories?.name || '-'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                    {p.contact_info || '-'}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        p.is_active
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {p.is_active ? 'เปิดใช้งาน' : 'ระงับ'}
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
