'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Archive,
  Plus,
  Download,
  RotateCcw,
  Trash2,
  Loader2,
  ShieldCheck,
} from 'lucide-react'

interface BackupFile {
  name: string
  size: number
  created_at: string
  url: string
}

export function BackupsAdminClient({
  initialBackups,
}: {
  initialBackups: BackupFile[]
}) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [restoringName, setRestoringName] = useState<string | null>(null)

  const handleCreateBackup = async () => {
    setCreating(true)
    try {
      const res = await fetch('/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: 'backups', action: 'create' }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'สร้างไฟล์สำรองไม่สำเร็จ')
      router.refresh()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setCreating(false)
    }
  }

  const handleRestore = async (name: string) => {
    if (!confirm(`ยืนยันการกู้คืนข้อมูลจากไฟล์สำรอง "${name}"?`)) return
    setRestoringName(name)
    try {
      const res = await fetch('/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'backups',
          action: 'restore',
          data: { filename: name },
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'กู้คืนไม่สำเร็จ')
      alert('กู้คืนข้อมูลจากไฟล์สำรองเรียบร้อยแล้ว')
      router.refresh()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setRestoringName(null)
    }
  }

  const handleDelete = async (name: string) => {
    if (!confirm(`ยืนยันการลบไฟล์สำรอง "${name}"?`)) return
    await fetch('/api/admin/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        module: 'backups',
        action: 'delete',
        data: { filename: name },
      }),
    })
    router.refresh()
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Archive className="w-6 h-6 text-indigo-600" />
            สำรองและกู้คืนข้อมูลระบบ (System Backups & Restore)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            สร้างไฟล์สำรองข้อมูลแบบเต็มระบบ (.zip รวมฐานข้อมูลและไฟล์อัปโหลด) ดาวน์โหลดเก็บไว้ หรือกู้คืนย้อนหลัง
          </p>
        </div>

        <button
          onClick={handleCreateBackup}
          disabled={creating}
          className="inline-flex items-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm cursor-pointer disabled:opacity-50"
        >
          {creating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> กำลังสร้างไฟล์สำรอง...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" /> สร้างไฟล์สำรองข้อมูลทันที (Full Backup)
            </>
          )}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            รายการไฟล์สำรองข้อมูลในเซิร์ฟเวอร์ ({initialBackups.length} ไฟล์)
          </h2>
        </div>

        {initialBackups.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            ยังไม่มีไฟล์สำรองข้อมูล กดปุ่ม &ldquo;สร้างไฟล์สำรองข้อมูลทันที&rdquo; ด้านบนเพื่อเริ่มต้น
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {initialBackups.map((b) => (
              <div
                key={b.name}
                className="rounded-2xl border border-slate-200 p-4 hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between gap-4 bg-slate-50/40"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                    <Archive className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-mono font-bold text-slate-800 text-xs break-all">
                      {b.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500">
                      <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-semibold text-slate-700">
                        {formatSize(b.size)}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(b.created_at).toLocaleString('th-TH')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-1.5 pt-3 border-t border-slate-200/70">
                  <a
                    href={b.url}
                    download
                    className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 mr-1" /> ดาวน์โหลด
                  </a>
                  <button
                    onClick={() => handleRestore(b.name)}
                    disabled={restoringName === b.name}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-xl cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1" />
                    {restoringName === b.name ? 'กำลังกู้คืน...' : 'กู้คืน'}
                  </button>
                  <button
                    onClick={() => handleDelete(b.name)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-xl cursor-pointer transition-colors"
                    title="ลบไฟล์สำรอง"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
