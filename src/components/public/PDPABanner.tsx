'use client'

import React, { useState, useEffect } from 'react'
import { Cookie, X, Check, ShieldCheck } from 'lucide-react'

interface PDPABannerProps {
  enabled?: boolean
  text?: string
}

export function PDPABanner({ enabled = true, text }: PDPABannerProps) {
  const [mounted, setMounted] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!enabled) return

    try {
      const consent = localStorage.getItem('cric_pdpa_consent')
      if (!consent) {
        // Small delay to prevent layout jump and allow page to render first
        const timer = setTimeout(() => {
          setIsVisible(true)
        }, 600)
        return () => clearTimeout(timer)
      }
    } catch {
      // If localStorage is unavailable, do nothing
    }
  }, [enabled])

  const handleAccept = () => {
    try {
      localStorage.setItem('cric_pdpa_consent', 'accepted')
    } catch {}
    setIsVisible(false)
  }

  const handleDecline = () => {
    try {
      localStorage.setItem('cric_pdpa_consent', 'declined')
    } catch {}
    setIsVisible(false)
  }

  if (!mounted || !enabled || !isVisible) {
    return null
  }

  const defaultText =
    'เว็บไซต์นี้ใช้คุกกี้เพื่อพัฒนาประสบการณ์การใช้งานของท่านตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล (PDPA) ท่านสามารถเลือกยอมรับหรือปฏิเสธการใช้งานคุกกี้ได้ตามความต้องการ'

  return (
    <aside
      aria-label="การแจ้งเตือนคุกกี้และข้อมูลส่วนบุคคล"
      className="fixed bottom-3 inset-x-3 sm:bottom-6 sm:right-6 sm:inset-x-auto sm:max-w-lg z-50 transition-all duration-300 ease-out transform translate-y-0 opacity-100"
    >
      <div className="bg-slate-900/95 backdrop-blur-md text-slate-100 border border-slate-700/80 rounded-2xl shadow-2xl p-4 sm:p-5 relative">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400">
              <Cookie className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>นโยบายความเป็นส่วนตัวและคุกกี้</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  PDPA
                </span>
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDecline}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            aria-label="ปิดการแจ้งเตือน"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <p className="text-xs sm:text-[13px] text-slate-300 leading-relaxed mb-4">
          {text && text.trim() ? text : defaultText}
        </p>

        {/* Actions Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-slate-800/80">
          <button
            type="button"
            onClick={handleDecline}
            className="px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/90 border border-slate-700 rounded-xl transition cursor-pointer"
          >
            ปฏิเสธ / จำเป็นเท่านั้น
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 rounded-xl shadow-md transition cursor-pointer"
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>ยอมรับทั้งหมด</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
