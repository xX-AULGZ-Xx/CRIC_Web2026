'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  CheckSquare,
  Square,
  Play,
  Loader2,
} from 'lucide-react'

interface TableInfo {
  name: string
  label: string
  count: number
}

export function MigrationClient({ tables }: { tables: TableInfo[] }) {
  const router = useRouter()
  const [selectedTables, setSelectedTables] = useState<string[]>(
    tables.map((t) => t.name)
  )
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [migrating, setMigrating] = useState(false)
  const [sqlInput, setSqlInput] = useState('')
  const [migrateLog, setMigrateLog] = useState<string | null>(null)

  const toggleAll = () => {
    if (selectedTables.length === tables.length) {
      setSelectedTables([])
    } else {
      setSelectedTables(tables.map((t) => t.name))
    }
  }

  const handleExportSql = async () => {
    if (selectedTables.length === 0) {
      alert('กรุณาเลือกตารางที่ต้องการส่งออกอย่างน้อย 1 ตาราง')
      return
    }
    setExporting(true)
    try {
      const res = await fetch('/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'database',
          action: 'export_sql',
          data: { tables: selectedTables },
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Export failed')
      const blob = new Blob([json.sql], { type: 'application/sql;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cric_db_${new Date().toISOString().slice(0, 10)}.sql`
      a.click()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setExporting(false)
    }
  }

  const handleSqlFileRead = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setSqlInput(String(reader.result || ''))
    }
    reader.readAsText(file)
  }

  const handleImportSql = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sqlInput.trim()) return
    if (!confirm('ยืนยันการรันคำสั่ง SQL ลงในฐานข้อมูล?')) return
    setImporting(true)
    try {
      const res = await fetch('/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'database',
          action: 'import_sql',
          data: { sql: sqlInput },
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Import failed')
      alert(`ประมวลผลคำสั่ง SQL สำเร็จ (${json.executed} คำสั่ง)`)
      setSqlInput('')
      router.refresh()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setImporting(false)
    }
  }

  const handleRunLegacyMigrate = async () => {
    setMigrating(true)
    setMigrateLog(null)
    try {
      const res = await fetch('/api/admin/migrate', { method: 'POST' })
      const json = await res.json()
      setMigrateLog(JSON.stringify(json, null, 2))
      router.refresh()
    } catch (err: any) {
      setMigrateLog(`Error: ${err.message}`)
    } finally {
      setMigrating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Database className="w-6 h-6 text-indigo-600" />
            จัดการฐานข้อมูล (Database Management & SQL Export/Import)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            ตรวจสอบตารางข้อมูลในระบบ ส่งออกไฟล์สำรองฐานข้อมูล (.sql) นำเข้าข้อมูล SQL และซิงค์ไฟล์จากระบบเดิม
          </p>
        </div>

        <button
          onClick={handleExportSql}
          disabled={exporting}
          className="inline-flex items-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm cursor-pointer disabled:opacity-50"
        >
          {exporting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          ส่งออก SQL ({selectedTables.length} ตาราง)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tables Selection */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 text-sm">
              รายการตารางฐานข้อมูล MariaDB ({tables.length} ตาราง)
            </h2>
            <button
              onClick={toggleAll}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
            >
              {selectedTables.length === tables.length ? (
                <>
                  <CheckSquare className="w-4 h-4" /> ยกเลิกเลือกทั้งหมด
                </>
              ) : (
                <>
                  <Square className="w-4 h-4" /> เลือกทั้งหมด
                </>
              )}
            </button>
          </div>

          <div className="divide-y divide-slate-100 max-h-[520px] overflow-y-auto">
            {tables.map((t) => {
              const checked = selectedTables.includes(t.name)
              return (
                <label
                  key={t.name}
                  className="px-6 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer text-sm"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTables([...selectedTables, t.name])
                        } else {
                          setSelectedTables(selectedTables.filter((n) => n !== t.name))
                        }
                      }}
                      className="w-4 h-4 rounded text-indigo-600"
                    />
                    <div>
                      <span className="font-mono font-bold text-slate-800">{t.name}</span>
                      <span className="text-xs text-slate-500 ml-2">({t.label})</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                    {t.count.toLocaleString()} แถว
                  </span>
                </label>
              )
            })}
          </div>
        </div>

        {/* Right: SQL Import & Legacy Sync */}
        <div className="space-y-6">
          <form
            onSubmit={handleImportSql}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4"
          >
            <h2 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
              <Upload className="w-4 h-4 text-indigo-600" />
              นำเข้าไฟล์ SQL (Import SQL Dump)
            </h2>

            <input
              type="file"
              accept=".sql,.txt"
              onChange={handleSqlFileRead}
              className="block w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />

            <textarea
              rows={6}
              value={sqlInput}
              onChange={(e) => setSqlInput(e.target.value)}
              placeholder="หรือวางคำสั่ง SQL ที่นี่..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono text-slate-800"
            />

            <button
              type="submit"
              disabled={importing || !sqlInput.trim()}
              className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 mr-1.5" />
              {importing ? 'กำลังประมวลผล...' : 'รันคำสั่ง SQL นำเข้าข้อมูล'}
            </button>
          </form>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h2 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
              <RefreshCw className="w-4 h-4 text-indigo-600" />
              ซิงค์ไฟล์อัปโหลดจากระบบ PHP เดิม
            </h2>
            <p className="text-xs text-slate-500">
              คัดลอกไฟล์รูปภาพและเอกสารจากโฟลเดอร์เว็บไซต์เดิมเข้าสู่ public/uploads อัตโนมัติ
            </p>
            <button
              type="button"
              onClick={handleRunLegacyMigrate}
              disabled={migrating}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
            >
              {migrating ? 'กำลังซิงค์ข้อมูล...' : 'เริ่มซิงค์ไฟล์จากระบบเดิม'}
            </button>
            {migrateLog && (
              <pre className="p-3 bg-slate-900 text-emerald-400 text-[11px] rounded-xl overflow-x-auto max-h-40">
                {migrateLog}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
