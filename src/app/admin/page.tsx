import React from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import {
  Newspaper,
  Users,
  ShieldAlert,
  Download,
  Images,
  GraduationCap,
  ArrowRight,
  Clock,
  History,
  CheckCircle2,
} from 'lucide-react'

export default async function AdminDashboardPage() {
  const session = await getSession()
  if (!session) {
    redirect('/admin/login')
  }

  const [
    newsCount,
    personnelCount,
    pendingComplaintsCount,
    downloadsCount,
    galleriesCount,
    curriculumsCount,
    recentComplaints,
    recentAuditLogs,
  ] = await Promise.all([
    prisma.news.count(),
    prisma.personnel.count({ where: { is_active: true } }),
    prisma.complaints.count({ where: { status: 'pending' } }),
    prisma.downloads.count(),
    prisma.galleries.count(),
    prisma.curriculums.count(),
    prisma.complaints.findMany({
      orderBy: { created_at: 'desc' },
      take: 5,
    }),
    prisma.audit_logs.findMany({
      include: { users: { select: { username: true } } },
      orderBy: { created_at: 'desc' },
      take: 6,
    }),
  ])

  const stats = [
    {
      label: 'ข่าวประชาสัมพันธ์',
      value: newsCount,
      href: '/admin/news',
      icon: Newspaper,
      color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    },
    {
      label: 'ครูและบุคลากร',
      value: personnelCount,
      href: '/admin/personnel',
      icon: Users,
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
    {
      label: 'เรื่องร้องเรียนรอดำเนินการ',
      value: pendingComplaintsCount,
      href: '/admin/complaints',
      icon: ShieldAlert,
      color: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    },
    {
      label: 'ไฟล์เอกสารดาวน์โหลด',
      value: downloadsCount,
      href: '/admin/downloads',
      icon: Download,
      color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    },
    {
      label: 'อัลบั้มภาพกิจกรรม',
      value: galleriesCount,
      href: '/admin/galleries',
      icon: Images,
      color: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    },
    {
      label: 'สาขาวิชาหลักสูตร',
      value: curriculumsCount,
      href: '/admin/curriculums',
      icon: GraduationCap,
      color: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    },
  ]

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-orange-600 to-amber-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-orange-600/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider font-extrabold text-orange-200 block mb-1">
            ยินดีต้อนรับสู่ระบบจัดการ
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            สวัสดี, {session.username} ({session.role})
          </h1>
          <p className="text-xs sm:text-sm text-orange-100 mt-1">
            ระบบ Next.js Full-stack CMS เชื่อมต่อ MariaDB เดิมเรียบร้อยแล้ว
          </p>
        </div>
        <Link
          href="/"
          target="_blank"
          className="px-5 py-2.5 bg-white text-slate-900 rounded-2xl font-extrabold text-xs sm:text-sm shadow-md hover:bg-orange-50 transition shrink-0"
        >
          เปิดดูเว็บไซต์จริง
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((s, idx) => {
          const Icon = s.icon
          return (
            <Link
              key={idx}
              href={s.href}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 hover:border-slate-700 transition flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded-2xl border ${s.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-black text-white font-mono block">
                  {s.value}
                </span>
                <span className="text-xs text-slate-400 font-medium block mt-1 line-clamp-1">
                  {s.label}
                </span>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Grid: Recent Complaints & Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Complaints */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5 text-white font-extrabold">
              <ShieldAlert className="w-5 h-5 text-rose-500" />
              <span>เรื่องร้องเรียนล่าสุด</span>
            </div>
            <Link
              href="/admin/complaints"
              className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1"
            >
              <span>ดูทั้งหมด</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-800">
            {recentComplaints.map((item) => (
              <div
                key={item.id}
                className="py-3 flex items-center justify-between gap-4"
              >
                <div className="overflow-hidden">
                  <span className="text-[11px] font-mono text-orange-400 font-bold block">
                    {item.ticket_number}
                  </span>
                  <h4 className="text-sm font-bold text-slate-200 truncate">{item.title}</h4>
                  <span className="text-[10px] text-slate-500">
                    {item.created_at ? new Date(item.created_at).toLocaleDateString('th-TH') : ''}
                  </span>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase shrink-0 ${
                  item.status === 'pending'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                }`}>
                  {item.status}
                </span>
              </div>
            ))}
            {recentComplaints.length === 0 && (
              <p className="text-xs text-slate-500 py-6 text-center">ไม่มีข้อมูลเรื่องร้องเรียน</p>
            )}
          </div>
        </div>

        {/* Recent Audit Logs */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5 text-white font-extrabold">
              <History className="w-5 h-5 text-blue-500" />
              <span>ประวัติการทำงาน (Audit Trail)</span>
            </div>
            <Link
              href="/admin/audit-logs"
              className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1"
            >
              <span>ดูทั้งหมด</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-800">
            {recentAuditLogs.map((log) => (
              <div key={log.id} className="py-2.5 flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                <div className="overflow-hidden">
                  <p className="text-xs text-slate-300">
                    <span className="font-bold text-white">{log.users?.username}</span>{' '}
                    <span className="text-slate-400">{log.action}</span> on{' '}
                    <span className="text-orange-400">{log.target_type}</span>
                  </p>
                  {log.details && (
                    <p className="text-[11px] text-slate-500 truncate">{log.details}</p>
                  )}
                  <span className="text-[10px] text-slate-600">
                    {log.created_at ? new Date(log.created_at).toLocaleString('th-TH') : ''}
                  </span>
                </div>
              </div>
            ))}
            {recentAuditLogs.length === 0 && (
              <p className="text-xs text-slate-500 py-6 text-center">ยังไม่มีประวัติกิจกรรม</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
