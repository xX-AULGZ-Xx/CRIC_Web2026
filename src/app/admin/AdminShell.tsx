'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { UserSession } from '@/lib/auth'
import {
  ShieldCheck,
  Home,
  Images,
  Newspaper,
  Layout,
  Users,
  Award,
  FolderTree,
  Briefcase,
  BookOpen,
  FileCheck,
  AlertTriangle,
  Folder,
  Camera,
  Download,
  Cloud,
  Settings,
  UserCheck,
  Database,
  Archive,
  RefreshCw,
  Compass,
  Link2,
  ArrowRightLeft,
  LogOut,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react'

interface AdminShellProps {
  session: UserSession
  siteName: string
  pendingComplaints: number
  immichUrl?: string
  children: React.ReactNode
}

export function AdminShell({
  session,
  siteName,
  pendingComplaints,
  immichUrl,
  children,
}: AdminShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/admin/login')
      router.refresh()
    } catch {
      window.location.href = '/admin/login'
    }
  }

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    if (href === '/admin/curriculum') {
      return pathname.startsWith('/admin/curriculum')
    }
    return pathname === href || pathname.startsWith(href + '/')
  }

  const navLinkClass = (href: string) =>
    `flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
      isActive(href)
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
        : 'hover:bg-slate-800 hover:text-white text-slate-300'
    }`

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-6 bg-slate-950 font-bold text-white text-lg tracking-wider border-b border-slate-800 shrink-0">
        <div className="flex items-center">
          <ShieldCheck className="w-6 h-6 text-indigo-500 mr-2 shrink-0" />
          <span>CMS ADMIN</span>
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden text-slate-400 hover:text-white p-1"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-slate-800 flex items-center space-x-3 shrink-0">
        <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-lg shrink-0 uppercase">
          {session.username ? session.username.charAt(0) : 'A'}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium text-white truncate">
            {session.username}
          </div>
          <div className="text-xs text-slate-400 capitalize">
            {session.role}
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar-dark">
        <Link
          href="/admin"
          onClick={() => setMobileOpen(false)}
          className={navLinkClass('/admin')}
        >
          <Home className="w-5 h-5 mr-3 shrink-0" />
          ภาพรวมระบบ
        </Link>

        <Link
          href="/admin/sliders"
          onClick={() => setMobileOpen(false)}
          className={navLinkClass('/admin/sliders')}
        >
          <Images className="w-5 h-5 mr-3 shrink-0" />
          สไลด์แบนเนอร์
        </Link>

        {/* เนื้อหาหลัก */}
        <div className="pt-4 pb-1 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          เนื้อหาหลัก
        </div>

        <Link
          href="/admin/news"
          onClick={() => setMobileOpen(false)}
          className={navLinkClass('/admin/news')}
        >
          <Newspaper className="w-5 h-5 mr-3 shrink-0" />
          ข่าวสารและกิจกรรม
        </Link>

        <Link
          href="/admin/pages"
          onClick={() => setMobileOpen(false)}
          className={navLinkClass('/admin/pages')}
        >
          <Layout className="w-5 h-5 mr-3 shrink-0" />
          จัดการเพจ / หน้าเว็บ
        </Link>

        <Link
          href="/admin/personnel"
          onClick={() => setMobileOpen(false)}
          className={navLinkClass('/admin/personnel')}
        >
          <Users className="w-5 h-5 mr-3 shrink-0" />
          ทำเนียบบุคลากร
        </Link>

        <Link
          href="/admin/executives"
          onClick={() => setMobileOpen(false)}
          className={navLinkClass('/admin/executives')}
        >
          <Award className="w-5 h-5 mr-3 shrink-0 text-amber-500" />
          ทำเนียบผู้บริหาร
        </Link>

        <Link
          href="/admin/personnel-categories"
          onClick={() => setMobileOpen(false)}
          className={navLinkClass('/admin/personnel-categories')}
        >
          <FolderTree className="w-5 h-5 mr-3 shrink-0" />
          หมวดหมู่บุคลากร (แผนก/ฝ่าย)
        </Link>

        <Link
          href="/admin/personnel-positions"
          onClick={() => setMobileOpen(false)}
          className={navLinkClass('/admin/personnel-positions')}
        >
          <Briefcase className="w-5 h-5 mr-3 shrink-0" />
          จัดการตำแหน่งบุคลากร
        </Link>

        <Link
          href="/admin/curriculum"
          onClick={() => setMobileOpen(false)}
          className={navLinkClass('/admin/curriculum')}
        >
          <BookOpen className="w-5 h-5 mr-3 shrink-0" />
          หลักสูตรการศึกษา
        </Link>

        <Link
          href="/admin/ita"
          onClick={() => setMobileOpen(false)}
          className={navLinkClass('/admin/ita')}
        >
          <FileCheck className="w-5 h-5 mr-3 shrink-0" />
          จัดการข้อมูล ITA
        </Link>

        <Link
          href="/admin/complaints"
          onClick={() => setMobileOpen(false)}
          className={`flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            isActive('/admin/complaints')
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'hover:bg-slate-800 hover:text-white text-slate-300'
          }`}
        >
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-3 shrink-0" />
            <span>เรื่องร้องเรียน</span>
          </div>
          {pendingComplaints > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full animate-pulse">
              {pendingComplaints}
            </span>
          )}
        </Link>

        {/* สื่อและคลังเอกสาร */}
        <div className="pt-4 pb-1 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          สื่อและคลังเอกสาร
        </div>

        <Link
          href="/admin/media"
          onClick={() => setMobileOpen(false)}
          className={navLinkClass('/admin/media')}
        >
          <Folder className="w-5 h-5 mr-3 shrink-0" />
          คลังสื่อ (Media Library)
        </Link>

        <Link
          href="/admin/galleries"
          onClick={() => setMobileOpen(false)}
          className={navLinkClass('/admin/galleries')}
        >
          <Camera className="w-5 h-5 mr-3 shrink-0" />
          คลังภาพกิจกรรม
        </Link>

        <Link
          href="/admin/downloads"
          onClick={() => setMobileOpen(false)}
          className={navLinkClass('/admin/downloads')}
        >
          <Download className="w-5 h-5 mr-3 shrink-0" />
          ศูนย์ดาวน์โหลด
        </Link>

        {immichUrl && (
          <a
            href={immichUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors text-indigo-400 hover:bg-slate-800 hover:text-indigo-300 mt-2 border border-indigo-500/20 bg-indigo-500/5"
          >
            <Cloud className="w-5 h-5 mr-3 shrink-0" />
            <span>เปิดคลังภาพ Immich</span>
            <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-70" />
          </a>
        )}

        {/* การจัดการโครงสร้าง */}
        <div className="pt-4 pb-1 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          การจัดการโครงสร้าง
        </div>

        <Link
          href="/admin/settings"
          onClick={() => setMobileOpen(false)}
          className={navLinkClass('/admin/settings')}
        >
          <Settings className="w-5 h-5 mr-3 shrink-0" />
          ตั้งค่าเว็บไซต์
        </Link>

        <Link
          href="/admin/users"
          onClick={() => setMobileOpen(false)}
          className={navLinkClass('/admin/users')}
        >
          <UserCheck className="w-5 h-5 mr-3 shrink-0" />
          จัดการผู้ใช้งานและสิทธิ์
        </Link>

        <Link
          href="/admin/database"
          onClick={() => setMobileOpen(false)}
          className={navLinkClass('/admin/database')}
        >
          <Database className="w-5 h-5 mr-3 shrink-0" />
          จัดการฐานข้อมูล
        </Link>

        <Link
          href="/admin/migration"
          onClick={() => setMobileOpen(false)}
          className={navLinkClass('/admin/migration')}
        >
          <ArrowRightLeft className="w-5 h-5 mr-3 shrink-0" />
          โอนย้ายระบบเดิม
        </Link>

        <Link
          href="/admin/backups"
          onClick={() => setMobileOpen(false)}
          className={navLinkClass('/admin/backups')}
        >
          <Archive className="w-5 h-5 mr-3 shrink-0" />
          สำรองและกู้คืนข้อมูล
        </Link>

        <Link
          href="/admin/update"
          onClick={() => setMobileOpen(false)}
          className={navLinkClass('/admin/update')}
        >
          <RefreshCw className="w-5 h-5 mr-3 shrink-0" />
          อัปเดตระบบ
        </Link>

        <Link
          href="/admin/navbars"
          onClick={() => setMobileOpen(false)}
          className={navLinkClass('/admin/navbars')}
        >
          <Compass className="w-5 h-5 mr-3 shrink-0" />
          โครงสร้างเมนู (Navbar)
        </Link>

        <Link
          href="/admin/paths"
          onClick={() => setMobileOpen(false)}
          className={navLinkClass('/admin/paths')}
        >
          <Link2 className="w-5 h-5 mr-3 shrink-0" />
          รายการลิงก์ภายใน (Paths)
        </Link>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-800 shrink-0">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-red-400 bg-red-400/10 rounded-lg hover:bg-red-400/20 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 mr-2" />
          ออกจากระบบ
        </button>
      </div>
    </>
  )

  return (
    <div className="bg-slate-50 text-slate-800 antialiased selection:bg-indigo-500 selection:text-white flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex-col transition-all duration-300 z-20 shrink-0 hidden md:flex">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] bg-slate-900 text-slate-300 flex flex-col h-full z-10 shadow-2xl">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-10 sticky top-0 shrink-0">
          <div className="flex items-center">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden text-slate-500 hover:text-slate-700 focus:outline-none mr-4 cursor-pointer"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="text-lg font-medium text-slate-800 hidden sm:block truncate max-w-md">
              {siteName}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
              <span className="w-2 h-2 mr-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Live Web
            </span>
            <Link
              href="/"
              target="_blank"
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
            >
              ดูหน้าเว็บหลัก
              <ExternalLink className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-4 sm:p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
