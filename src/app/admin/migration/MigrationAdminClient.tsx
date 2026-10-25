'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRightLeft,
  Server,
  FolderSync,
  Upload,
  Database,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Download,
  FileCode,
  FileArchive,
  Loader2,
  Check,
  X,
  Terminal,
  Clock,
  Sparkles,
} from 'lucide-react'
import { swalConfirm, swalSuccess, swalError, swalWarning, swalToast } from '@/lib/sweetalert'

interface MigrationStats {
  tablesCount: number
  uploadsCount: number
  uploadsSizeMB: number
  defaultLegacyPath: string
  legacyExists: boolean
  legacyUploadsCount: number
  legacyUploadsSizeMB: number
  snapshots: {
    name: string
    size: number
    createdAt: string
  }[]
}

interface StepLog {
  step: string
  status: 'pending' | 'success' | 'failed'
  message: string
  timestamp: string
}

export function MigrationAdminClient({ initialStats }: { initialStats: MigrationStats }) {
  const router = useRouter()
  const [stats, setStats] = useState<MigrationStats>(initialStats)
  const [legacyPath, setLegacyPath] = useState(initialStats.defaultLegacyPath)
  const [policy, setPolicy] = useState<'merge' | 'clean'>('merge')
  const [syncUploads, setSyncUploads] = useState(true)
  const [syncDatabase, setSyncDatabase] = useState(true)

  // Execution state
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState<number>(0)
  const [logs, setLogs] = useState<StepLog[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [completedSummary, setCompletedSummary] = useState<any | null>(null)

  // File uploads
  const [zipFile, setZipFile] = useState<File | null>(null)
  const [sqlFile, setSqlFile] = useState<File | null>(null)
  const zipInputRef = useRef<HTMLInputElement>(null)
  const sqlInputRef = useRef<HTMLInputElement>(null)

  // Manual snapshot creation
  const [creatingSnapshot, setCreatingSnapshot] = useState(false)

  // Refresh server stats
  const refreshStats = async () => {
    try {
      const res = await fetch(`/api/admin/migration?legacyPath=${encodeURIComponent(legacyPath)}`)
      const json = await res.json()
      if (json.success) {
        setStats({
          tablesCount: json.tablesCount,
          uploadsCount: json.uploadsCount,
          uploadsSizeMB: Number((json.uploadsSize / (1024 * 1024)).toFixed(2)),
          defaultLegacyPath: json.legacyPath,
          legacyExists: json.legacyExists,
          legacyUploadsCount: json.legacyUploadsCount,
          legacyUploadsSizeMB: Number((json.legacyUploadsSize / (1024 * 1024)).toFixed(2)),
          snapshots: json.snapshots.map((s: any) => ({
            name: s.name,
            size: s.size,
            createdAt: new Date(s.createdAt).toISOString(),
          })),
        })
      }
    } catch {}
  }

  useEffect(() => {
    refreshStats()
  }, [])

  // Helper: Run steps simulation while waiting for API
  const startProgressMonitoring = () => {
    setModalOpen(true)
    setRunning(true)
    setProgress(10)
    setCurrentStep(1)
    setCompletedSummary(null)
    setLogs([
      {
        step: 'Init',
        status: 'pending',
        message: 'เริ่มต้นเตรียมระบบโอนย้ายข้อมูล...',
        timestamp: new Date().toLocaleTimeString('th-TH'),
      },
    ])

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 85) {
          clearInterval(interval)
          return prev
        }
        return prev + 15
      })
    }, 800)

    return () => clearInterval(interval)
  }

  // 1. Direct Server Sync
  const handleDirectSync = async () => {
    const ok = await swalConfirm({
      title: 'ยืนยันการโอนย้ายข้อมูลจากระบบเดิม?',
      text: `ระบบจะทำการอ่านข้อมูลจาก ${legacyPath} (${policy === 'clean' ? 'โหมด Clean Reset' : 'โหมด Merge & Update'}) โดยจะสำรองข้อมูลปัจจุบันไว้ก่อนเสมอ`,
      confirmButtonText: 'เริ่มโอนย้ายทันที',
    })
    if (!ok) return

    const stopProgress = startProgressMonitoring()

    try {
      const res = await fetch('/api/admin/migration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'direct-sync',
          legacyPath,
          policy,
          syncUploads,
          syncDatabase,
        }),
      })

      stopProgress()
      const json = await res.json()
      setProgress(100)
      setCurrentStep(4)

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'เกิดข้อผิดพลาดในการโอนย้ายข้อมูล')
      }

      setLogs(json.logs || [])
      setCompletedSummary(json)
      await swalSuccess('สำเร็จ', 'โอนย้ายข้อมูลจากระบบเดิมเรียบร้อยแล้ว')
      await refreshStats()
      router.refresh()
    } catch (err: any) {
      swalError('โอนย้ายข้อมูลไม่สำเร็จ', err.message)
      setLogs((prev) => [
        ...prev,
        {
          step: 'Error',
          status: 'failed',
          message: err.message,
          timestamp: new Date().toLocaleTimeString('th-TH'),
        },
      ])
    } finally {
      setRunning(false)
    }
  }

  // 2. Upload ZIP
  const handleUploadZip = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!zipFile) {
      swalWarning('กรุณาเลือกไฟล์', 'กรุณาเลือกไฟล์สำรองข้อมูล .zip')
      return
    }

    const ok = await swalConfirm({
      title: 'ยืนยันการนำเข้าจากไฟล์ ZIP?',
      text: `นำเข้าข้อมูลและแตกไฟล์จาก "${zipFile.name}" ใช่หรือไม่?`,
      confirmButtonText: 'เริ่มนำเข้า',
    })
    if (!ok) return

    const stopProgress = startProgressMonitoring()

    try {
      const fd = new FormData()
      fd.append('mode', 'upload-zip')
      fd.append('file', zipFile)
      fd.append('cleanReset', policy === 'clean' ? '1' : '0')

      const res = await fetch('/api/admin/migration', {
        method: 'POST',
        body: fd,
      })

      stopProgress()
      const json = await res.json()
      setProgress(100)
      setCurrentStep(4)

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'นำเข้าจากไฟล์ ZIP ไม่สำเร็จ')
      }

      setLogs(json.logs || [])
      setCompletedSummary(json)
      setZipFile(null)
      if (zipInputRef.current) zipInputRef.current.value = ''
      await swalSuccess('สำเร็จ', 'นำเข้าข้อมูลจากไฟล์ ZIP เรียบร้อยแล้ว')
      await refreshStats()
      router.refresh()
    } catch (err: any) {
      swalError('นำเข้าไม่สำเร็จ', err.message)
    } finally {
      setRunning(false)
    }
  }

  // 3. Upload SQL
  const handleUploadSql = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sqlFile) {
      swalWarning('กรุณาเลือกไฟล์', 'กรุณาเลือกไฟล์ฐานข้อมูล .sql')
      return
    }

    const ok = await swalConfirm({
      title: 'ยืนยันการนำเข้าไฟล์ SQL?',
      text: `นำเข้าโครงสร้างและคำสั่ง SQL จาก "${sqlFile.name}" ลงสู่ MariaDB ใช่หรือไม่?`,
      confirmButtonText: 'รันคำสั่ง SQL',
    })
    if (!ok) return

    const stopProgress = startProgressMonitoring()

    try {
      const fd = new FormData()
      fd.append('mode', 'upload-sql')
      fd.append('file', sqlFile)

      const res = await fetch('/api/admin/migration', {
        method: 'POST',
        body: fd,
      })

      stopProgress()
      const json = await res.json()
      setProgress(100)
      setCurrentStep(4)

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'นำเข้าไฟล์ SQL ไม่สำเร็จ')
      }

      setLogs(json.logs || [])
      setCompletedSummary(json)
      setSqlFile(null)
      if (sqlInputRef.current) sqlInputRef.current.value = ''
      await swalSuccess('สำเร็จ', 'นำเข้าข้อมูลจากไฟล์ SQL เรียบร้อยแล้ว')
      await refreshStats()
      router.refresh()
    } catch (err: any) {
      swalError('นำเข้าไม่สำเร็จ', err.message)
    } finally {
      setRunning(false)
    }
  }

  // 4. Create Safety Snapshot Manually
  const handleCreateSnapshot = async () => {
    setCreatingSnapshot(true)
    try {
      const res = await fetch('/api/admin/migration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create-snapshot' }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'สร้าง Snapshot ไม่สำเร็จ')
      swalToast('สร้าง Safety Snapshot สำเร็จ', 'success')
      await refreshStats()
    } catch (err: any) {
      swalError('สร้าง Snapshot ไม่สำเร็จ', err.message)
    } finally {
      setCreatingSnapshot(false)
    }
  }

  // 5. Rollback to Snapshot
  const handleRollback = async (filename: string) => {
    const ok = await swalConfirm({
      title: 'ยืนยันการย้อนคืนข้อมูล (Rollback)?',
      text: `ต้องการกู้คืนข้อมูลกลับไปยัง Safety Snapshot "${filename}" ใช่หรือไม่? ข้อมูลปัจจุบันจะถูกสำรองไว้อีกชุดก่อนดำเนินการ`,
      confirmButtonText: 'ยืนยันย้อนข้อมูล',
    })
    if (!ok) return

    const stopProgress = startProgressMonitoring()

    try {
      const res = await fetch('/api/admin/migration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rollback', filename }),
      })

      stopProgress()
      const json = await res.json()
      setProgress(100)
      setCurrentStep(4)

      if (!res.ok || !json.success) throw new Error(json.error || 'Rollback ไม่สำเร็จ')
      setLogs(json.logs || [])
      setCompletedSummary(json)
      await swalSuccess('สำเร็จ', `ย้อนสถานะข้อมูลกลับไปยัง ${filename} เรียบร้อยแล้ว`)
      await refreshStats()
      router.refresh()
    } catch (err: any) {
      swalError('ย้อนข้อมูลไม่สำเร็จ', err.message)
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <span>โอนย้ายระบบเดิม (System Migration & Data Sync)</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            เครื่องมือโอนย้ายฐานข้อมูลและคลังไฟล์จากระบบเดิม (cric_new26) เข้าสู่ระบบ Next.js 16 พร้อมระบบความปลอดภัยและการสำรองข้อมูลอัตโนมัติ
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCreateSnapshot}
            disabled={creatingSnapshot}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer disabled:opacity-50"
          >
            {creatingSnapshot ? (
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            )}
            <span>สำรอง Snapshot ทันที</span>
          </button>
        </div>
      </div>

      {/* Server Status Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">ตารางในระบบ Next.js</div>
            <div className="text-lg font-bold text-slate-800">
              {stats.tablesCount} <span className="text-xs font-normal text-slate-500">ตาราง MariaDB</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">ไฟล์ใน uploads ปัจจุบัน</div>
            <div className="text-lg font-bold text-slate-800">
              {stats.uploadsCount} <span className="text-xs font-normal text-slate-500">ไฟล์ ({stats.uploadsSizeMB} MB)</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">สถานะโฟลเดอร์ระบบเดิม</div>
            <div className="text-sm font-bold flex items-center gap-1.5 mt-0.5">
              {stats.legacyExists ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-emerald-700 font-bold">พร้อมเชื่อมต่อ ({stats.legacyUploadsCount} ไฟล์)</span>
                </>
              ) : (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="text-rose-600 font-bold">ไม่พบโฟลเดอร์</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Safety Snapshots</div>
            <div className="text-lg font-bold text-slate-800">
              {stats.snapshots.length} <span className="text-xs font-normal text-slate-500">ชุดสำรองพร้อม Rollback</span>
            </div>
          </div>
        </div>
      </div>

      {/* Migration Policy Selector */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-orange-600" />
            <span>นโยบายการจัดการข้อมูล (Migration Policy)</span>
          </h2>
          <span className="text-xs text-slate-400">เลือกรูปแบบที่ต้องการก่อนกดเริ่มโอนย้าย</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <label
            className={`flex items-start gap-3.5 p-4 rounded-xl border-2 cursor-pointer transition ${
              policy === 'merge'
                ? 'border-indigo-600 bg-indigo-50/40 text-slate-800 shadow-xs'
                : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
            }`}
          >
            <input
              type="radio"
              name="policy"
              value="merge"
              checked={policy === 'merge'}
              onChange={() => setPolicy('merge')}
              className="mt-1 w-4 h-4 text-indigo-600"
            />
            <div>
              <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <span>รวมและอัปเดตข้อมูล (Merge & Update)</span>
                <span className="px-2 py-0.5 text-[10px] font-extrabold bg-emerald-100 text-emerald-700 rounded-md">
                  แนะนำ
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                คัดลอกไฟล์และอัปเดตข้อมูลทับของเดิม โดยคงไฟล์ใหม่ที่ถูกสร้างขึ้นใน Next.js ไว้ ปลอดภัยและไม่ทำให้ไฟล์ใหม่สูญหาย
              </p>
            </div>
          </label>

          <label
            className={`flex items-start gap-3.5 p-4 rounded-xl border-2 cursor-pointer transition ${
              policy === 'clean'
                ? 'border-rose-600 bg-rose-50/40 text-slate-800 shadow-xs'
                : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
            }`}
          >
            <input
              type="radio"
              name="policy"
              value="clean"
              checked={policy === 'clean'}
              onChange={() => setPolicy('clean')}
              className="mt-1 w-4 h-4 text-rose-600"
            />
            <div>
              <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <span>ล้างข้อมูลทั้งหมดแล้วนำเข้าใหม่ (Clean Reset & Import)</span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                จัดระเบียบตารางและโฟลเดอร์ uploads เพื่อนำเข้าจากระบบเดิมแบบ 100% เสมือนเริ่มต้นใหม่ (ระบบจะสร้าง Safety Snapshot สำรองไว้ก่อนเสมอ)
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* 3 Migration Methods Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Method 1: Direct Server Sync */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <FolderSync className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">1. Direct Server Sync</h3>
                <span className="text-[11px] text-slate-400">ซิงค์โดยตรงจากโฟลเดอร์เซิร์ฟเวอร์</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              คัดลอกไฟล์รูปภาพและเอกสารทั้งหมดจากโฟลเดอร์ของเว็บไซต์เดิมเข้าสู่ระบบ Next.js โดยอัตโนมัติ
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Path โฟลเดอร์ระบบเดิมบนเซิร์ฟเวอร์
              </label>
              <input
                type="text"
                value={legacyPath}
                onChange={(e) => setLegacyPath(e.target.value)}
                placeholder="เช่น c:\inetpub\wwwroot\cric_new26"
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 outline-none transition"
              />
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={syncUploads}
                  onChange={(e) => setSyncUploads(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <span>ซิงค์ไฟล์เอกสารและรูปภาพ (public/uploads)</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={syncDatabase}
                  onChange={(e) => setSyncDatabase(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <span>ตรวจสอบตาราง MariaDB และฐานข้อมูล</span>
              </label>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDirectSync}
            disabled={running || !stats.legacyExists}
            className="w-full mt-4 py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-semibold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <FolderSync className="w-4 h-4" />
            <span>เริ่มโอนย้ายโดยตรงจากเซิร์ฟเวอร์</span>
          </button>
        </div>

        {/* Method 2: Upload Backup ZIP */}
        <form
          onSubmit={handleUploadZip}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4"
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                <FileArchive className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">2. Restore from ZIP</h3>
                <span className="text-[11px] text-slate-400">อัปโหลดไฟล์สำรองข้อมูล (.zip)</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              นำเข้าไฟล์สำรอง ZIP ที่มีทั้งไฟล์ฐานข้อมูล SQL และโฟลเดอร์ uploads จากระบบเดิม
            </p>

            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                เลือกไฟล์สำรองข้อมูล (.zip)
              </label>
              <input
                ref={zipInputRef}
                type="file"
                accept=".zip"
                onChange={(e) => setZipFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-800 hover:file:bg-amber-100 cursor-pointer"
              />
              {zipFile && (
                <div className="text-[11px] text-emerald-600 font-medium mt-1">
                  เลือก: {zipFile.name} ({(zipFile.size / (1024 * 1024)).toFixed(2)} MB)
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={running || !zipFile}
            className="w-full mt-4 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            <span>อัปโหลดและกู้คืนจากไฟล์ ZIP</span>
          </button>
        </form>

        {/* Method 3: Upload SQL Script */}
        <form
          onSubmit={handleUploadSql}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4"
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <FileCode className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">3. Import SQL Dump</h3>
                <span className="text-[11px] text-slate-400">นำเข้าไฟล์ฐานข้อมูล (.sql)</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              รันคำสั่ง DDL และ DML จากไฟล์ dump ฐานข้อมูล MySQL/MariaDB เพื่ออัปเดตตารางข้อมูล
            </p>

            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                เลือกไฟล์ฐานข้อมูล (.sql)
              </label>
              <input
                ref={sqlInputRef}
                type="file"
                accept=".sql"
                onChange={(e) => setSqlFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-800 hover:file:bg-emerald-100 cursor-pointer"
              />
              {sqlFile && (
                <div className="text-[11px] text-emerald-600 font-medium mt-1">
                  เลือก: {sqlFile.name} ({(sqlFile.size / 1024).toFixed(2)} KB)
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={running || !sqlFile}
            className="w-full mt-4 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Database className="w-4 h-4" />
            <span>รันคำสั่งและนำเข้าจากไฟล์ SQL</span>
          </button>
        </form>
      </div>

      {/* Safety Snapshots History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>ประวัติ Safety Snapshots และการกู้คืนข้อมูล (Rollback)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              ระบบจะทำการ Snapshot ข้อมูลไว้ที่โฟลเดอร์ backups เสมอก่อนดำเนินการใด ๆ เพื่อความปลอดภัย 100%
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-xl">
            ทั้งหมด {stats.snapshots.length} ชุด
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase bg-slate-50/30">
                <th className="py-3 px-6">ชื่อไฟล์ Snapshot</th>
                <th className="py-3 px-6">ขนาดไฟล์</th>
                <th className="py-3 px-6">เวลาที่สำรอง</th>
                <th className="py-3 px-6 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.snapshots.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    ยังไม่มี Safety Snapshot ในระบบ (จะถูกสร้างอัตโนมัติเมื่อเริ่มการโอนย้ายข้อมูล)
                  </td>
                </tr>
              ) : (
                stats.snapshots.map((snap) => (
                  <tr key={snap.name} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-6 font-mono font-medium text-slate-800 flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-indigo-500" />
                      <span>{snap.name}</span>
                    </td>
                    <td className="py-3.5 px-6 text-slate-500">
                      {(snap.size / 1024).toFixed(1)} KB
                    </td>
                    <td className="py-3.5 px-6 text-slate-500">
                      {new Date(snap.createdAt).toLocaleString('th-TH')}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleRollback(snap.name)}
                          disabled={running}
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition cursor-pointer disabled:opacity-50"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Rollback ย้อนข้อมูล</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Progress & Log Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    สถานะการโอนย้ายข้อมูล (Migration Progress)
                  </h3>
                  <span className="text-xs text-slate-500">
                    {running ? 'กำลังดำเนินการ กรุณารอสักครู่...' : 'กระบวนการเสร็จสิ้น'}
                  </span>
                </div>
              </div>

              {!running && (
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>ความคืบหน้า</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 via-orange-500 to-emerald-500 transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* 4-Step Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div
                  className={`p-3 rounded-xl border flex items-center gap-2.5 ${
                    currentStep >= 1
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  {currentStep >= 1 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <span>1. สร้าง Safety Snapshot สำรอง</span>
                </div>

                <div
                  className={`p-3 rounded-xl border flex items-center gap-2.5 ${
                    currentStep >= 2
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  {currentStep >= 2 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <span>2. ตรวจสอบโฟลเดอร์/โครงสร้างระบบเดิม</span>
                </div>

                <div
                  className={`p-3 rounded-xl border flex items-center gap-2.5 ${
                    currentStep >= 3
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  {currentStep >= 3 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <span>3. คัดลอกและซิงค์ไฟล์ uploads</span>
                </div>

                <div
                  className={`p-3 rounded-xl border flex items-center gap-2.5 ${
                    currentStep >= 4
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  {currentStep >= 4 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <span>4. ตรวจสอบ/นำเข้าตาราง MariaDB</span>
                </div>
              </div>

              {/* Terminal Logs Output */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <Terminal className="w-3.5 h-3.5 text-slate-500" />
                  <span>บันทึกขั้นตอนการประมวลผล (Real-time Logs)</span>
                </div>
                <div className="bg-slate-900 text-slate-200 p-4 rounded-2xl font-mono text-xs space-y-2 max-h-52 overflow-y-auto custom-scrollbar-dark border border-slate-800">
                  {logs.length === 0 ? (
                    <div className="text-slate-500 italic">กำลังรอการเริ่มกระบวนการ...</div>
                  ) : (
                    logs.map((log, idx) => (
                      <div key={idx} className="flex items-start gap-2 leading-relaxed">
                        <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
                        <span
                          className={
                            log.status === 'success'
                              ? 'text-emerald-400'
                              : log.status === 'failed'
                              ? 'text-rose-400 font-bold'
                              : 'text-amber-300'
                          }
                        >
                          {log.status === 'success' ? '✓' : log.status === 'failed' ? '✗' : '➤'}{' '}
                          {log.message}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Completed Summary Card */}
              {completedSummary && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-700 text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>การประมวลผลเสร็จสิ้นสมบูรณ์</span>
                  </div>
                  {completedSummary.snapshotFile && (
                    <div>• ไฟล์ Safety Snapshot สำรอง: <code className="font-mono font-bold">{completedSummary.snapshotFile}</code></div>
                  )}
                  {completedSummary.filesCopied !== undefined && (
                    <div>• ไฟล์เอกสาร/รูปภาพที่ซิงค์สำเร็จ: <span className="font-bold">{completedSummary.filesCopied}</span> ไฟล์</div>
                  )}
                  {completedSummary.tablesCount !== undefined && (
                    <div>• ตารางฐานข้อมูล MariaDB พร้อมใช้งาน: <span className="font-bold">{completedSummary.tablesCount}</span> ตาราง</div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                disabled={running}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
