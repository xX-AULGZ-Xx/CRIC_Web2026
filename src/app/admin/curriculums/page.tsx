import React from 'react'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { GraduationCap } from 'lucide-react'

export default async function AdminCurriculumsPage() {
  const session = await getSession()
  if (!session) redirect('/admin/login')

  const curriculums = await prisma.curriculums.findMany({
    orderBy: { id: 'asc' },
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
          <GraduationCap className="w-6 h-6 text-orange-500" />
          <span>จัดการหลักสูตรและสาขาวิชาที่เปิดสอน</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          สาขาวิชาทั้งหมด ({curriculums.length} สาขา)
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 px-6">ชื่อสาขาวิชา</th>
                <th className="py-3.5 px-4">ระดับชั้น</th>
                <th className="py-3.5 px-4">รหัสสาขา</th>
                <th className="py-3.5 px-4">ระยะเวลาศึกษา</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {curriculums.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-6 font-bold text-white">
                    {c.name}
                  </td>
                  <td className="py-3.5 px-4 text-orange-400 font-bold">
                    {c.level || '-'}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-400">
                    {c.code || '-'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">
                    {c.duration || '-'}
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
