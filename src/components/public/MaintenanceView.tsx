'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  GraduationCap,
  Settings,
  Wrench,
  Sparkles,
  Globe,
  Database,
  FolderOpen,
  Lock,
  Phone,
  Mail,
  Clock,
} from 'lucide-react'
import { SiteSettings, getThemeClasses } from '@/lib/settings'
import { normalizeImageUrl } from '@/lib/url-helper'

interface MaintenanceViewProps {
  settings: SiteSettings
  dbStatusOk?: boolean
  storageStatusOk?: boolean
}

export function MaintenanceView({
  settings,
  dbStatusOk = true,
  storageStatusOk = true,
}: MaintenanceViewProps) {
  const themeColor = settings.theme_color || 'blue'
  const theme = getThemeClasses(themeColor)
  const logoSrc = settings.site_logo ? normalizeImageUrl(settings.site_logo) : ''
  const endTimeStr = settings.maintenance_end_time || ''

  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
  } | null>(null)

  useEffect(() => {
    if (!endTimeStr) return

    const updateTimer = () => {
      const target = new Date(endTimeStr).getTime()
      if (isNaN(target)) {
        setTimeLeft(null)
        return
      }
      const diff = target - Date.now()
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        return
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
      const minutes = Math.floor((diff / 1000 / 60) % 60)
      const seconds = Math.floor((diff / 1000) % 60)
      setTimeLeft({ days, hours, minutes, seconds })
    }

    updateTimer()
    const timer = setInterval(updateTimer, 1000)
    return () => clearInterval(timer)
  }, [endTimeStr])

  const cmsMode = settings.maintenance_mode || '1'

  return (
    <div className="min-h-screen flex flex-col justify-between text-slate-800 bg-slate-50 relative">
      {/* Background patterns / glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/5 blur-[120px]" />
      </div>

      {/* Header area */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          {logoSrc ? (
            <img
              src={logoSrc}
              className="w-12 h-12 object-contain transition duration-300 group-hover:scale-105"
              alt="College Logo"
            />
          ) : (
            <div
              className={`p-2.5 ${theme.primaryBg} ${theme.primaryHover} rounded-xl text-white shadow-lg transition duration-300 group-hover:scale-105`}
            >
              <GraduationCap className="w-6 h-6" />
            </div>
          )}
          <div className="flex flex-col justify-center max-w-[200px] sm:max-w-[320px] md:max-w-md my-auto">
            <h1 className="font-extrabold text-slate-900 text-sm sm:text-base md:text-lg leading-none tracking-tight truncate">
              {settings.site_name || 'วิทยาลัยการอาชีพเชียงราย'}
            </h1>
            <span className="text-[8px] sm:text-[9px] text-slate-400 font-semibold uppercase tracking-wide block leading-normal mt-1 whitespace-pre-line">
              {settings.site_name_en || 'College Web CMS System'}
            </span>
          </div>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-2xl bg-white border border-slate-100 shadow-xl rounded-3xl p-8 md:p-12 text-center space-y-8 relative">
          {/* Animated Custom Illustration */}
          <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-blue-500/5 animate-pulse" />
            <div
              className="absolute inset-4 rounded-full bg-blue-500/10 animate-ping"
              style={{ animationDuration: '3s' }}
            />
            <div className="absolute w-24 h-24 bg-slate-50 border border-slate-100 rounded-2xl shadow-sm flex items-center justify-center">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <div
                  className={`${theme.primaryText} animate-spin`}
                  style={{ animationDuration: '12s' }}
                >
                  <Settings className="w-12 h-12 stroke-[1.5]" />
                </div>
                <div
                  className="absolute text-slate-400 bottom-0 right-0 animate-bounce"
                  style={{ animationDuration: '2s' }}
                >
                  <Wrench className="w-6 h-6 stroke-2" />
                </div>
                <div className="absolute text-amber-500 top-0 left-0 animate-pulse">
                  <Sparkles className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Text Content */}
          <div className="space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold bg-amber-500/10 text-amber-700 rounded-full border border-amber-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span>UNDER MAINTENANCE</span>
            </span>
            <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
              ขออภัยในความไม่สะดวก <br />
              <span className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 bg-clip-text text-transparent">
                {settings.maintenance_title || 'ระบบอยู่ระหว่างการปรับปรุงชั่วคราว'}
              </span>
            </h2>
            <p className="text-xs md:text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
              {settings.maintenance_message ||
                'เรากำลังอัปเดตข้อมูลและปรับปรุงประสิทธิภาพระบบสารสนเทศของวิทยาลัย เพื่อให้พร้อมสำหรับการใช้งานที่ดีที่สุดของคุณและจะกลับมาเปิดให้บริการในเร็ว ๆ นี้'}
            </p>
          </div>

          {/* Countdown Timer if maintenance_end_time is set */}
          {timeLeft && (
            <div className="pt-4">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-3">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>กำหนดเปิดให้บริการอีกครั้งในอีก</span>
              </div>
              <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3">
                  <span className="text-2xl font-black text-slate-900 block font-mono">
                    {String(timeLeft.days).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    วัน
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3">
                  <span className="text-2xl font-black text-slate-900 block font-mono">
                    {String(timeLeft.hours).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    ชั่วโมง
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3">
                  <span className="text-2xl font-black text-slate-900 block font-mono">
                    {String(timeLeft.minutes).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    นาที
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3">
                  <span className="text-2xl font-black text-amber-600 block font-mono">
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    วินาที
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Subsystem Status Dashboard */}
          <div className="pt-6 border-t border-slate-100 text-left">
            <h3 className="text-xs font-bold text-slate-500 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>สถานะความพร้อมระบบย่อย (Subsystems Status)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50/60 border border-slate-100 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-white rounded-lg text-slate-500 shadow-sm border border-slate-100/50">
                    <Globe className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-600">
                    เว็บเซิร์ฟเวอร์หลัก (Web Server)
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shrink-0 whitespace-nowrap">
                  <span>พร้อมใช้งาน</span>
                </span>
              </div>

              <div className="p-3 bg-slate-50/60 border border-slate-100 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-white rounded-lg text-slate-500 shadow-sm border border-slate-100/50">
                    <Database className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-600">
                    ฐานข้อมูลระบบ (Database)
                  </span>
                </div>
                {dbStatusOk ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shrink-0 whitespace-nowrap">
                    <span>พร้อมใช้งาน</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20 animate-pulse shrink-0 whitespace-nowrap">
                    <span>ไม่พร้อมใช้งาน</span>
                  </span>
                )}
              </div>

              <div className="p-3 bg-slate-50/60 border border-slate-100 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-white rounded-lg text-slate-500 shadow-sm border border-slate-100/50">
                    <FolderOpen className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-600">
                    คลังเอกสารและไฟล์ (Storage)
                  </span>
                </div>
                {storageStatusOk ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shrink-0 whitespace-nowrap">
                    <span>พร้อมใช้งาน</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20 animate-pulse shrink-0 whitespace-nowrap">
                    <span>สิทธิ์ไฟล์มีปัญหา</span>
                  </span>
                )}
              </div>

              <div className="p-3 bg-slate-50/60 border border-slate-100 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-white rounded-lg text-slate-500 shadow-sm border border-slate-100/50">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-600">
                    ระบบจัดการหลังบ้าน (CMS)
                  </span>
                </div>
                {cmsMode === 'all' || cmsMode === '1' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 animate-pulse shrink-0 whitespace-nowrap">
                    <span>ปิดปรับปรุงระบบ</span>
                  </span>
                ) : cmsMode === 'specific' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 animate-pulse shrink-0 whitespace-nowrap">
                    <span>จำกัดพื้นที่เข้าถึง</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shrink-0 whitespace-nowrap">
                    <span>พร้อมใช้งาน</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Contact Info if available */}
          {(settings.contact_phone || settings.contact_email) && (
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500">
              {settings.contact_phone && (
                <a
                  href={`tel:${settings.contact_phone}`}
                  className="inline-flex items-center gap-1.5 hover:text-slate-800 transition"
                >
                  <Phone className="w-3.5 h-3.5 text-orange-500" />
                  <span>ติดต่อด่วน: {settings.contact_phone}</span>
                </a>
              )}
              {settings.contact_email && (
                <a
                  href={`mailto:${settings.contact_email}`}
                  className="inline-flex items-center gap-1.5 hover:text-slate-800 transition"
                >
                  <Mail className="w-3.5 h-3.5 text-orange-500" />
                  <span>{settings.contact_email}</span>
                </a>
              )}
            </div>
          )}

          {/* Action options */}
          <div className="pt-2 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link
              href="/admin/login"
              className={`px-5 py-3 ${theme.primaryBg} ${theme.primaryHover} text-white rounded-2xl text-xs font-bold shadow-md hover:shadow-lg transition flex items-center gap-2`}
            >
              <Lock className="w-3.5 h-3.5 opacity-80" />
              <span>เข้าสู่ระบบผู้ดูแลระบบ (สำหรับ Admin/Editor)</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer area */}
      <footer className="w-full py-6 text-center text-slate-400 text-xs relative z-10 border-t border-slate-100/60">
        <p>{settings.footer_text || settings.site_name || 'วิทยาลัยการอาชีพเชียงราย'}</p>
      </footer>
    </div>
  )
}

export default MaintenanceView
