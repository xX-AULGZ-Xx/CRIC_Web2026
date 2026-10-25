'use client'

import React, { useState } from 'react'
import {
  RefreshCw,
  CheckCircle2,
  Server,
  Database,
  Trash2,
  Sparkles,
  Loader2,
} from 'lucide-react'
import { swalError, swalSuccess } from '@/lib/sweetalert'

export default function AdminUpdatePage() {
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const runAction = async (action: string, successText: string) => {
    setLoadingAction(action)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: 'update', action }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error')
      setMessage(successText)
      swalSuccess('สำเร็จ', successText)
    } catch (err: any) {
      swalError('เกิดข้อผิดพลาด', err.message)
    } finally {
      setLoadingAction(null)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <RefreshCw className="w-6 h-6 text-indigo-600" />
          อัปเดตและบำรุงรักษาระบบ (System Update & Maintenance)
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          ตรวจสอบเวอร์ชันของระบบ ล้างหน่วยความจำแคช (Cache) และปรับปรุงโครงสร้างฐานข้อมูลให้เป็นปัจจุบัน
        </p>
      </div>

      {message && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-4 rounded-2xl flex items-center gap-3 text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Version Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
              Current Release
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Up to Date
            </span>
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-slate-800">
              CMS v2.6.0 (Next.js 16)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              ขับเคลื่อนด้วย Next.js 16.4.2 App Router, React 19.3, Tailwind CSS 4 และ Prisma MariaDB
            </p>
          </div>

          <button
            onClick={() =>
              runAction(
                'check_update',
                'ตรวจสอบเวอร์ชันล่าสุดแล้ว: ระบบของคุณเป็นเวอร์ชันล่าสุด (v2.6.0-nextjs16)'
              )
            }
            disabled={loadingAction !== null}
            className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors cursor-pointer"
          >
            {loadingAction === 'check_update' ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            ตรวจสอบการอัปเดตเวอร์ชันใหม่
          </button>
        </div>

        {/* Maintenance Tools */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Server className="w-5 h-5 text-indigo-600" />
            เครื่องมือดูแลรักษาระบบ
          </h3>

          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-800">
                  ล้างแคชหน้าเว็บไซต์ (Clear Next.js Cache)
                </div>
                <div className="text-xs text-slate-500">
                  บังคับโหลดข้อมูลเมนู ข่าวสาร และการตั้งค่าใหม่ทันที
                </div>
              </div>
              <button
                onClick={() =>
                  runAction(
                    'clear_cache',
                    'ล้างหน่วยความจำแคชหน้าเว็บไซต์ทั้งหมดเรียบร้อยแล้ว!'
                  )
                }
                disabled={loadingAction !== null}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl shrink-0 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 inline mr-1 text-red-500" />
                ล้างแคช
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-800">
                  ตรวจสอบโครงสร้างฐานข้อมูล (Verify DB Schema)
                </div>
                <div className="text-xs text-slate-500">
                  ตรวจสอบการเชื่อมต่อตารางฐานข้อมูล MariaDB ทั้ง 23 ตาราง
                </div>
              </div>
              <button
                onClick={() =>
                  runAction(
                    'sync_schema',
                    'ตรวจสอบโครงสร้างฐานข้อมูลสำเร็จ: ตารางทั้งหมดพร้อมใช้งานสมบูรณ์'
                  )
                }
                disabled={loadingAction !== null}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl shrink-0 cursor-pointer"
              >
                <Database className="w-3.5 h-3.5 inline mr-1 text-indigo-600" />
                ตรวจสอบ DB
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
