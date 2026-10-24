import React from 'react'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { History, Clock, User, Activity, Database } from 'lucide-react'

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

  const getActionColor = (action: string) => {
    const act = action.toUpperCase()
    if (act.includes('CREATE') || act.includes('ADD')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    }
    if (act.includes('DELETE') || act.includes('REMOVE')) {
      return 'bg-rose-50 text-rose-700 border-rose-200'
    }
    if (act.includes('UPDATE') || act.includes('EDIT')) {
      return 'bg-amber-50 text-amber-700 border-amber-200'
    }
    return 'bg-indigo-50 text-indigo-700 border-indigo-200'
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2.5">
            <History className="w-6 h-6 text-indigo-600" />
            <span>ประวัติกิจกรรมระบบหลังบ้าน (Audit Logs)</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            บันทึกประวัติการเปลี่ยนแปลงข้อมูลสำคัญในระบบ (แสดง {logs.length} รายการล่าสุด)
          </p>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
          ยังไม่มีข้อมูลประวัติกิจกรรมในระบบ
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {logs.map((log) => (
            <div
              key={log.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase border ${getActionColor(
                      log.action
                    )}`}
                  >
                    <Activity className="w-3 h-3 inline mr-1 -mt-0.5" />
                    {log.action}
                  </span>
                  <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {log.created_at
                      ? new Date(log.created_at).toLocaleString('th-TH')
                      : '-'}
                  </span>
                </div>

                <div className="text-sm font-medium text-slate-800 leading-relaxed bg-slate-50 rounded-xl p-3 border border-slate-100">
                  {log.details || 'ไม่มีรายละเอียดเพิ่มเติม'}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="font-bold text-slate-700">
                    {log.users?.username || 'System'}
                  </span>
                  {log.users?.role && (
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-semibold uppercase text-slate-500">
                      {log.users.role}
                    </span>
                  )}
                </div>

                <div className="font-mono text-[11px] text-slate-400 flex items-center gap-1">
                  <Database className="w-3 h-3" />
                  <span>
                    {log.target_type}
                    {log.target_id ? ` #${log.target_id}` : ''}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
