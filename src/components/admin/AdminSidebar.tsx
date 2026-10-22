'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Newspaper,
  Users,
  GraduationCap,
  FileCheck2,
  ShieldAlert,
  Download,
  Images,
  Sliders,
  FileText,
  Settings,
  UserCog,
  History,
  LogOut,
  ExternalLink,
} from 'lucide-react'
import { UserSession, hasModuleAccess } from '@/lib/auth-types'

interface AdminSidebarProps {
  session: UserSession
}

export function AdminSidebar({ session }: AdminSidebarProps) {
  const pathname = usePathname()

  const navItems = [
    { label: 'แดชบอร์ด', href: '/admin', icon: LayoutDashboard, module: 'dashboard' },
    { label: 'จัดการข่าวสาร', href: '/admin/news', icon: Newspaper, module: 'news' },
    { label: 'ทำเนียบบุคลากร', href: '/admin/personnel', icon: Users, module: 'personnel' },
    { label: 'หลักสูตรการศึกษา', href: '/admin/curriculums', icon: GraduationCap, module: 'curriculums' },
    { label: 'การประเมิน ITA', href: '/admin/ita', icon: FileCheck2, module: 'ita' },
    { label: 'เรื่องร้องเรียน', href: '/admin/complaints', icon: ShieldAlert, module: 'complaints' },
    { label: 'ศูนย์ดาวน์โหลด', href: '/admin/downloads', icon: Download, module: 'downloads' },
    { label: 'คลังภาพกิจกรรม', href: '/admin/galleries', icon: Images, module: 'galleries' },
    { label: 'แบนเนอร์สไลด์', href: '/admin/sliders', icon: Sliders, module: 'sliders' },
    { label: 'หน้าคงที่ (Pages)', href: '/admin/pages', icon: FileText, module: 'pages' },
    { label: 'ตั้งค่าเว็บไซต์', href: '/admin/settings', icon: Settings, module: 'settings' },
    { label: 'ผู้ใช้งานระบบ', href: '/admin/users', icon: UserCog, module: 'users' },
    { label: 'ประวัติกิจกรรม (Logs)', href: '/admin/audit-logs', icon: History, module: 'logs' },
  ]

  const allowedNavs = navItems.filter((item) => {
    if (item.module === 'dashboard') return true
    if (item.module === 'users' || item.module === 'logs') return session.role === 'admin'
    return hasModuleAccess(session, item.module)
  })

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/admin/login'
  }

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 min-h-screen text-slate-300">
      <div>
        {/* Brand */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center text-white font-black text-base shadow-md">
              CR
            </div>
            <div>
              <h2 className="font-extrabold text-white text-sm leading-tight">CRIC Admin</h2>
              <span className="text-[10px] text-slate-400 font-medium block">ระบบจัดการข้อมูล</span>
            </div>
          </Link>
          <Link
            href="/"
            target="_blank"
            title="ดูหน้าเว็บไซต์จริง"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>

        {/* User status */}
        <div className="p-4 mx-3 my-3 bg-slate-800/60 rounded-2xl border border-slate-700/50 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-xs uppercase">
            {session.username.slice(0, 2)}
          </div>
          <div className="overflow-hidden">
            <h4 className="text-xs font-bold text-white truncate">{session.username}</h4>
            <span className="text-[10px] font-semibold text-orange-400 uppercase tracking-wider block">
              {session.role}
            </span>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="px-3 py-2 space-y-1">
          {allowedNavs.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
                  active
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Logout button */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </aside>
  )
}
