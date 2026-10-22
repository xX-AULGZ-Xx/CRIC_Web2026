import React from 'react'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { History, Shield, Clock } from 'lucide-react'

export default async function AdminAuditLogsPage() {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    redirect('/admin')
  }

  const logs = await prisma.audit_logs.findMany({
    include: { users: { select: { username: true, role: true } } },
    orderBy: { created_at: 'desc' },
    take: 100,
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <History className="w-6 h-6 text-blue-500" />
            <span>ประวัติกิจกรรมระบบหลังบ้าน (Audit Logs)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            บันทึกประวัติการเปลี่ยนแปลงข้อมูลสำคัญในระบบ (แสดง 100 รายการล่าสุด)
          </p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 px-6">วัน-เวลา</th>
                <th className="py-3.5 px-4">ผู้ทำรายการ</th>
                <th className="py-3.5 px-4">กิจกรรม (Action)</th>
                <th className="py-3.5 px-4">เป้าหมาย (Target)</th>
                <th className="py-3.5 px-6">รายละเอียด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-6 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                    {log.created_at ? new Date(log.created_at).toLocaleString('th-TH') : '-'}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-white block">
                      {log.users?.username}
                    </span>
                    <span className="text-[10px] text-orange-400 uppercase font-semibold">
                      {log.users?.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 bg-slate-800 rounded-lg text-[10px] font-bold text-orange-400 uppercase">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-300">
                    {log.target_type} {log.target_id ? `(#${log.target_id})` : ''}
                  </td>
                  <td className="py-3.5 px-6 text-slate-400 text-xs">
                    {log.details || '-'}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    ยังไม่มีข้อมูลประวัติกิจกรรม
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
