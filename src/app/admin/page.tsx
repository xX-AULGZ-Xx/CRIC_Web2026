import React from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import {
  Newspaper,
  Users,
  BookOpen,
  Download,
  Camera,
  AlertTriangle,
  Layout,
  Activity,
  Plus,
  Settings,
  Images,
  ArrowRight,
  Clock,
  Server,
  ShieldCheck,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const session = await getSession()
  if (!session) redirect('/admin/login')

  const [
    newsCount,
    publishedNewsCount,
    personnelCount,
    curriculumCount,
    downloadsCount,
    downloadsAgg,
    galleriesCount,
    complaintsCount,
    pendingComplaintsCount,
    pagesCount,
    recentLogs,
    recentNews,
  ] = await Promise.all([
    prisma.news.count().catch(() => 0),
    prisma.news.count({ where: { status: 'published' } }).catch(() => 0),
    prisma.personnel.count({ where: { is_active: true } }).catch(() => 0),
    prisma.curriculums.count().catch(() => 0),
    prisma.downloads.count().catch(() => 0),
    prisma.downloads.aggregate({ _sum: { downloads_count: true } }).catch(() => ({ _sum: { downloads_count: 0 } })),
    prisma.galleries.count().catch(() => 0),
    prisma.complaints.count().catch(() => 0),
    prisma.complaints.count({ where: { status: 'pending' } }).catch(() => 0),
    prisma.static_pages.count().catch(() => 0),
    prisma.audit_logs
      .findMany({
        take: 10,
        orderBy: { created_at: 'desc' },
        include: { users: { select: { username: true, role: true } } },
      })
      .catch(() => []),
    prisma.news
      .findMany({
        take: 5,
        orderBy: { created_at: 'desc' },
        include: { news_categories: true },
      })
      .catch(() => []),
  ])

  const totalDownloadHits = downloadsAgg?._sum?.downloads_count || 0

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            ยินดีต้อนรับ, {session.username} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            ระบบบริหารจัดการเนื้อหาเว็บไซต์ (CMS Admin Panel) — จัดการข้อมูลข่าวสาร บุคลากร หลักสูตร และโครงสร้างเว็บไซต์
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/news"
            className="inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            เพิ่มข่าวประชาสัมพันธ์
          </Link>
          <Link
            href="/admin/settings"
            className="inline-flex items-center px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-colors"
          >
            <Settings className="w-4 h-4 mr-1.5" />
            ตั้งค่าเว็บไซต์
          </Link>
        </div>
      </div>

      {/* Primary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Link
          href="/admin/news"
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                ข่าวสารและกิจกรรม
              </p>
              <h3 className="text-3xl font-extrabold text-slate-800 mt-2">
                {newsCount.toLocaleString()}
              </h3>
              <p className="text-xs text-emerald-600 font-medium mt-1">
                เผยแพร่แล้ว {publishedNewsCount.toLocaleString()} รายการ
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Newspaper className="w-6 h-6" />
            </div>
          </div>
        </Link>

        <Link
          href="/admin/personnel"
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                บุคลากรในสังกัด
              </p>
              <h3 className="text-3xl font-extrabold text-slate-800 mt-2">
                {personnelCount.toLocaleString()}
              </h3>
              <p className="text-xs text-slate-500 mt-1">สถานะปฏิบัติงานปัจจุบัน</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </Link>

        <Link
          href="/admin/curriculum"
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-200 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                หลักสูตรการศึกษา
              </p>
              <h3 className="text-3xl font-extrabold text-slate-800 mt-2">
                {curriculumCount.toLocaleString()}
              </h3>
              <p className="text-xs text-slate-500 mt-1">หลักสูตรและแผนการเรียน</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>
        </Link>

        <Link
          href="/admin/downloads"
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-sky-200 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                เอกสารดาวน์โหลด
              </p>
              <h3 className="text-3xl font-extrabold text-slate-800 mt-2">
                {downloadsCount.toLocaleString()}
              </h3>
              <p className="text-xs text-sky-600 font-medium mt-1">
                ยอดดาวน์โหลดรวม {totalDownloadHits.toLocaleString()} ครั้ง
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <Download className="w-6 h-6" />
            </div>
          </div>
        </Link>
      </div>

      {/* Secondary Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Link
          href="/admin/galleries"
          className="bg-white px-5 py-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-indigo-200 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500">อัลบั้มภาพกิจกรรม</div>
              <div className="text-lg font-bold text-slate-800">{galleriesCount} อัลบั้ม</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400" />
        </Link>

        <Link
          href="/admin/pages"
          className="bg-white px-5 py-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-indigo-200 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layout className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500">หน้าเพจเนื้อหา (Static Pages)</div>
              <div className="text-lg font-bold text-slate-800">{pagesCount} หน้า</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400" />
        </Link>

        <Link
          href="/admin/complaints"
          className="bg-white px-5 py-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-red-200 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500">เรื่องร้องเรียนทั้งหมด</div>
              <div className="text-lg font-bold text-slate-800 flex items-center gap-2">
                {complaintsCount} เรื่อง
                {pendingComplaintsCount > 0 && (
                  <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full font-semibold">
                    รอดำเนินการ {pendingComplaintsCount}
                  </span>
                )}
              </div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400" />
        </Link>
      </div>

      {/* Main 2-Column Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Recent News & Audit Logs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent News */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-indigo-600" />
                ข่าวสารและกิจกรรมล่าสุด
              </h2>
              <Link
                href="/admin/news"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                จัดการข่าวทั้งหมด &rarr;
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {recentNews.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-400">
                  ยังไม่มีรายการข่าวสารในระบบ
                </div>
              ) : (
                recentNews.map((item) => (
                  <div
                    key={item.id}
                    className="px-6 py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-800 truncate">
                        {item.title}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{item.news_categories?.name || 'ทั่วไป'}</span>
                        <span>•</span>
                        <span>เข้าชม {item.views || 0} ครั้ง</span>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 ${
                        item.status === 'published'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {item.status === 'published' ? 'เผยแพร่' : 'ฉบับร่าง'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Audit Logs */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600" />
                ประวัติการใช้งานระบบล่าสุด (Audit Logs)
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {recentLogs.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-400">
                  ยังไม่มีประวัติการทำรายการ
                </div>
              ) : (
                recentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="px-6 py-3.5 flex items-start justify-between gap-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span
                        className={`mt-0.5 px-2 py-0.5 text-[10px] font-bold uppercase rounded-md shrink-0 ${
                          log.action === 'CREATE'
                            ? 'bg-emerald-100 text-emerald-700'
                            : log.action === 'DELETE'
                            ? 'bg-red-100 text-red-700'
                            : log.action === 'LOGIN'
                            ? 'bg-sky-100 text-sky-700'
                            : 'bg-indigo-100 text-indigo-700'
                        }`}
                      >
                        {log.action}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm text-slate-700 font-medium truncate">
                          {log.details || `${log.action} on ${log.target_type}`}
                        </p>
                        <p className="text-xs text-slate-400">
                          โดย <span className="font-medium text-slate-600">{log.users?.username || 'System'}</span> • โมดูล: {log.target_type}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-slate-400 shrink-0 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {log.created_at
                        ? new Date(log.created_at).toLocaleString('th-TH', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '-'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right: Quick Links & System Status */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="font-bold text-slate-800 mb-4">ทางลัดจัดการข้อมูลด่วน</h2>
            <div className="grid grid-cols-1 gap-2.5">
              <Link
                href="/admin/sliders"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200/80 transition-colors text-sm font-medium"
              >
                <span className="flex items-center gap-2.5">
                  <Images className="w-4 h-4 text-indigo-500" />
                  จัดการสไลด์แบนเนอร์หน้าแรก
                </span>
                <ArrowRight className="w-4 h-4 opacity-60" />
              </Link>
              <Link
                href="/admin/personnel"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200/80 transition-colors text-sm font-medium"
              >
                <span className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-emerald-500" />
                  จัดการข้อมูลบุคลากร
                </span>
                <ArrowRight className="w-4 h-4 opacity-60" />
              </Link>
              <Link
                href="/admin/ita"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200/80 transition-colors text-sm font-medium"
              >
                <span className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                  จัดการข้อมูลประเมิน ITA
                </span>
                <ArrowRight className="w-4 h-4 opacity-60" />
              </Link>
              <Link
                href="/admin/navbars"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200/80 transition-colors text-sm font-medium"
              >
                <span className="flex items-center gap-2.5">
                  <Layout className="w-4 h-4 text-purple-500" />
                  แก้ไขโครงสร้างเมนูเว็บไซต์
                </span>
                <ArrowRight className="w-4 h-4 opacity-60" />
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Server className="w-5 h-5 text-indigo-600" />
              ข้อมูลระบบ (System Status)
            </h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <dt className="text-slate-500">แพลตฟอร์ม</dt>
                <dd className="font-semibold text-slate-800">Next.js 16.4.3 (App Router)</dd>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <dt className="text-slate-500">ฐานข้อมูล</dt>
                <dd className="font-semibold text-emerald-600">MariaDB / Prisma ORM</dd>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <dt className="text-slate-500">สิทธิ์ผู้ใช้งาน</dt>
                <dd className="font-semibold text-indigo-600 uppercase">{session.role}</dd>
              </div>
              <div className="flex justify-between py-1.5">
                <dt className="text-slate-500">สถานะเซิร์ฟเวอร์</dt>
                <dd className="font-semibold text-emerald-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  ออนไลน์ปกติ
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
