'use client'

import React, { useState, useEffect } from 'react'
import {
  Database,
  RefreshCw,
  Upload,
  Download,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileArchive,
  HardDrive,
  FolderSync,
  Clock,
  Loader2,
  Play,
  FileText,
} from 'lucide-react'

export function MigrationClient() {
  const [activeTab, setActiveTab] = useState<'direct' | 'upload' | 'snapshots'>('direct')
  const [status, setStatus] = useState<any>(null)
  const [loadingStatus, setLoadingStatus] = useState(true)

  // Direct sync state
  const [legacyPath, setLegacyPath] = useState('c:\\inetpub\\wwwroot\\cric_new26')
  const [isMigrating, setIsMigrating] = useState(false)
  const [migrationLogs, setMigrationLogs] = useState<any[]>([])
  const [migrationResult, setMigrationResult] = useState<any | null>(null)

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<any | null>(null)

  // Manual snapshot
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false)
  const [snapshotMsg, setSnapshotMsg] = useState<string | null>(null)

  async function loadStatus() {
    setLoadingStatus(true)
    try {
      const res = await fetch('/api/admin/migration')
      const data = await res.json()
      if (data.success) {
        setStatus(data)
        if (data.legacyPath) setLegacyPath(data.legacyPath)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingStatus(false)
    }
  }

  useEffect(() => {
    loadStatus()
  }, [])

  async function handleDirectSync() {
    if (!confirm('ยืนยันการเริ่มย้ายข้อมูลและไฟล์ทั้งหมดจากระบบเดิมหรือไม่? (ระบบจะสร้าง Snapshot สำรองข้อมูลปัจจุบันก่อนเสมอ)')) {
      return
    }

    setIsMigrating(true)
    setMigrationLogs([
      { step: 'Start', status: 'pending', message: 'กำลังเตรียมการย้ายข้อมูล...', timestamp: new Date().toLocaleTimeString('th-TH') },
    ])
    setMigrationResult(null)

    try {
      const res = await fetch('/api/admin/migration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'direct-sync', legacyPath }),
      })

      const data = await res.json()
      setMigrationResult(data)
      if (data.logs) {
        setMigrationLogs(data.logs)
      }
      loadStatus()
    } catch (err: any) {
      setMigrationResult({ success: false, error: err.message })
    } finally {
      setIsMigrating(false)
    }
  }

  async function handleUploadBackup(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedFile) return

    if (!confirm(`ยืนยันการกู้คืน/ย้ายข้อมูลจากไฟล์ "${selectedFile.name}" หรือไม่?`)) {
      return
    }

    setIsUploading(true)
    setUploadResult(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('mode', selectedFile.name.endsWith('.zip') ? 'upload-zip' : 'upload-sql')

      const res = await fetch('/api/admin/migration', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      setUploadResult(data)
      loadStatus()
    } catch (err: any) {
      setUploadResult({ success: false, error: err.message })
    } finally {
      setIsUploading(false)
    }
  }

  async function handleCreateSnapshot() {
    setIsCreatingSnapshot(true)
    setSnapshotMsg(null)
    try {
      const res = await fetch('/api/admin/migration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create-snapshot' }),
      })
      const data = await res.json()
      if (data.success) {
        setSnapshotMsg(`สร้าง Snapshot สำรองข้อมูลเรียบร้อยแล้ว: ${data.filename}`)
        loadStatus()
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการสร้าง Snapshot')
    } finally {
      setIsCreatingSnapshot(false)
    }
  }

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 MB'
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Database className="w-6 h-6 text-orange-500" />
            <span>ระบบย้ายข้อมูลและสำรองฐานข้อมูล (Data Migration & Backup)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            ย้ายข้อมูลและไฟล์จากระบบเดิม (`cric_new26`) เข้าสู่ระบบ Next.js ใหม่แบบครบวงจร
          </p>
        </div>
        <button
          onClick={handleCreateSnapshot}
          disabled={isCreatingSnapshot}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border border-slate-700 disabled:opacity-50"
        >
          {isCreatingSnapshot ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4 text-emerald-400" />}
          <span>สร้าง Snapshot สำรองด่วน</span>
        </button>
      </div>

      {snapshotMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{snapshotMsg}</span>
        </div>
      )}

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl border border-blue-500/20">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">ตารางฐานข้อมูล MariaDB</span>
            <span className="text-xl font-mono font-black text-white">
              {loadingStatus ? '...' : `${status?.tablesCount || 0} ตาราง`}
            </span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex items-center gap-4">
          <div className="p-3 bg-orange-500/10 text-orange-400 rounded-2xl border border-orange-500/20">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">ไฟล์ Uploads ในระบบใหม่</span>
            <span className="text-xl font-mono font-black text-white">
              {loadingStatus ? '...' : `${status?.uploadsCount || 0} ไฟล์ (${formatBytes(status?.uploadsSize || 0)})`}
            </span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
            <FolderSync className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">การเชื่อมต่อระบบเดิมบนเครื่อง</span>
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{status?.legacyExists ? 'ตรวจพบ cric_new26 พร้อมซิงค์' : 'ไม่พบโฟลเดอร์เดิม'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl max-w-xl">
        <button
          onClick={() => setActiveTab('direct')}
          className={`flex-1 py-2 px-4 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'direct' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Play className="w-4 h-4" />
          <span>One-Click Direct Sync</span>
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex-1 py-2 px-4 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'upload' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>อัปโหลดไฟล์สำรอง (.zip / .sql)</span>
        </button>
        <button
          onClick={() => setActiveTab('snapshots')}
          className={`flex-1 py-2 px-4 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'snapshots' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>ประวัติ Snapshots</span>
        </button>
      </div>

      {/* Tab 1: Direct Local Migration */}
      {activeTab === 'direct' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <FolderSync className="w-5 h-5 text-orange-500" />
              <span>ย้ายข้อมูลตรงจากโฟลเดอร์ cric_new26 บนเครื่อง (One-Click Migration)</span>
            </h3>
            <p className="text-xs text-slate-400">
              ระบบจะสร้าง Safety Snapshot สำรองข้อมูลปัจจุบันอัตโนมัติ จากนั้นจะซิงค์ตารางฐานข้อมูลและคัดลอกไฟล์ทั้งหมดจากโฟลเดอร์ `uploads` ของระบบเดิมเข้ามายังระบบใหม่
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300">
              ที่อยู่โฟลเดอร์ระบบเดิมบนเซิร์ฟเวอร์ (Legacy System Path)
            </label>
            <input
              type="text"
              value={legacyPath}
              onChange={(e) => setLegacyPath(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs sm:text-sm font-mono outline-hidden focus:border-orange-500"
            />
          </div>

          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs text-slate-300 space-y-1.5">
            <div className="font-bold text-orange-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>ขั้นตอนความปลอดภัยที่จะเกิดขึ้นโดยอัตโนมัติ:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
              <li>สร้างไฟล์ Safety Snapshot สำรองข้อมูล MariaDB ปัจจุบันลงในโฟลเดอร์ `backups/`</li>
              <li>ตรวจสอบและยืนยันโครงสร้างตารางทั้ง 27 ตาราง</li>
              <li>คัดลอกไฟล์รูปภาพและเอกสารทั้งหมด 560+ ไฟล์ (~513MB) จาก `cric_new26/uploads` มายัง `public/uploads`</li>
              <li>บันทึกประวัติการย้ายข้อมูลลงในตาราง `audit_logs`</li>
            </ul>
          </div>

          <div>
            <button
              onClick={handleDirectSync}
              disabled={isMigrating}
              className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-lg shadow-orange-600/30 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isMigrating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังดำเนินการย้ายข้อมูลและไฟล์...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>เริ่มการย้ายข้อมูลทันที (Start Migration)</span>
                </>
              )}
            </button>
          </div>

          {/* Real-time Progress Logs */}
          {migrationLogs.length > 0 && (
            <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-slate-300">รายงานขั้นตอนการย้ายข้อมูล (Migration Progress Log):</span>
                {isMigrating && <span className="text-[10px] text-orange-400 animate-pulse">กำลังประมวลผล...</span>}
              </div>
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {migrationLogs.map((log, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-slate-600 text-[10px] shrink-0">[{log.timestamp}]</span>
                    {log.status === 'success' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : log.status === 'failed' ? (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                    ) : (
                      <Loader2 className="w-3.5 h-3.5 text-orange-400 animate-spin shrink-0 mt-0.5" />
                    )}
                    <span className={log.status === 'success' ? 'text-emerald-300' : log.status === 'failed' ? 'text-rose-400' : 'text-slate-300'}>
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Upload Backup ZIP/SQL */}
      {activeTab === 'upload' && (
        <form onSubmit={handleUploadBackup} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-orange-500" />
              <span>นำเข้าข้อมูลจากไฟล์สำรองข้อมูล (.zip หรือ .sql)</span>
            </h3>
            <p className="text-xs text-slate-400">
              รองรับไฟล์ ZIP Backup เต็มรูปแบบที่ดาวน์โหลดมาจาก `cric_new26` (มีทั้งไฟล์ฐานข้อมูลและรูปภาพใน uploads) หรือไฟล์ SQL Dump เดี่ยว
            </p>
          </div>

          <div className="border-2 border-dashed border-slate-700 hover:border-orange-500/80 rounded-2xl p-8 text-center transition bg-slate-950/40">
            <FileArchive className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <p className="text-xs text-slate-300 font-bold mb-1">
              {selectedFile ? selectedFile.name : 'เลือกไฟล์ .zip หรือ .sql จากเครื่องของคุณ'}
            </p>
            <p className="text-[11px] text-slate-500 mb-4">
              {selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB` : 'รองรับไฟล์สำรองข้อมูลจากระบบเดิมขนาดสูงสุด 1GB'}
            </p>
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition cursor-pointer border border-slate-700">
              <Upload className="w-3.5 h-3.5" />
              <span>เลือกไฟล์จากเครื่อง</span>
              <input
                type="file"
                accept=".zip,.sql"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="hidden"
              />
            </label>
          </div>

          {uploadResult && (
            <div className={`p-4 rounded-2xl text-xs flex items-center gap-2 ${
              uploadResult.success ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
            }`}>
              {uploadResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{uploadResult.success ? `กู้คืนข้อมูลสำเร็จเรียบร้อย! (แตกไฟล์อัปโหลด: ${uploadResult.filesCopied || 0} ไฟล์)` : `ล้มเหลว: ${uploadResult.error}`}</span>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={!selectedFile || isUploading}
              className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังอัปโหลดและกู้คืนระบบ...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>เริ่มอัปโหลดและกู้คืน (Restore from File)</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: Snapshots List */}
      {activeTab === 'snapshots' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-white">ประวัติ Safety Snapshots ในระบบ</h3>
              <p className="text-xs text-slate-400 mt-0.5">ไฟล์สำรองข้อมูลอัตโนมัติที่สร้างขึ้นก่อนการย้ายข้อมูลทุกครั้ง (จัดเก็บใน `backups/`)</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3.5 px-6">ชื่อไฟล์ Snapshot</th>
                  <th className="py-3.5 px-4">ขนาดไฟล์</th>
                  <th className="py-3.5 px-4">วันที่และเวลาที่สร้าง</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {status?.snapshots?.map((s: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-6 font-mono text-orange-400 font-bold flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-500" />
                      <span>{s.name}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {(s.size / 1024).toFixed(1)} KB
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {new Date(s.createdAt).toLocaleString('th-TH')}
                    </td>
                  </tr>
                ))}
                {(!status?.snapshots || status.snapshots.length === 0) && (
                  <tr>
                    <td colSpan={3} className="py-12 text-center text-slate-500">
                      ยังไม่มีประวัติ Snapshot ในระบบ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
