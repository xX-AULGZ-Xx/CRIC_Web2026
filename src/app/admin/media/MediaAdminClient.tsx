'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Folder,
  Upload,
  Search,
  Copy,
  Check,
  Pencil,
  Trash2,
  FileText,
  Loader2,
  X,
} from 'lucide-react'
import { normalizeImageUrl } from '@/lib/url-helper'

interface MediaRecord {
  id: number
  file_name: string
  file_path: string
  file_type: string
  file_size: number
  created_at: string | null
  users?: { username: string } | null
}

export function MediaAdminClient({ initialMedia }: { initialMedia: MediaRecord[] }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'image' | 'doc'>('all')
  const [uploading, setUploading] = useState(false)
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [renameItem, setRenameItem] = useState<MediaRecord | null>(null)
  const [newName, setNewName] = useState('')

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('folder', 'media')
      for (let i = 0; i < files.length; i++) {
        fd.append('files', files[i])
      }
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Upload failed')
      router.refresh()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleCopy = (item: MediaRecord) => {
    const url = item.file_path.startsWith('/') ? item.file_path : `/${item.file_path}`
    navigator.clipboard.writeText(url)
    setCopiedId(item.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!renameItem || !newName.trim()) return
    const res = await fetch('/api/admin/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        module: 'media',
        action: 'rename',
        data: { id: renameItem.id, file_name: newName },
      }),
    })
    if (res.ok) {
      setRenameItem(null)
      router.refresh()
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('ยืนยันการลบไฟล์นี้ออกจากระบบและเซิร์ฟเวอร์?')) return
    const res = await fetch('/api/admin/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ module: 'media', action: 'delete', data: { id } }),
    })
    if (res.ok) router.refresh()
  }

  const isImage = (m: MediaRecord) =>
    m.file_type.startsWith('image/') ||
    /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(m.file_path)

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 KB'
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  const filtered = initialMedia.filter((m) => {
    const matchSearch =
      !search ||
      m.file_name.toLowerCase().includes(search.toLowerCase()) ||
      m.file_path.toLowerCase().includes(search.toLowerCase())
    const matchType =
      filterType === 'all' ||
      (filterType === 'image' && isImage(m)) ||
      (filterType === 'doc' && !isImage(m))
    return matchSearch && matchType
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Folder className="w-6 h-6 text-indigo-600" />
            คลังสื่อและไฟล์อัปโหลด (Media Library)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            อัปโหลดรูปภาพและไฟล์เอกสาร คัดลอกลิงก์ URL สำหรับนำไปใช้ในบทความและหน้าเพจ
          </p>
        </div>

        <label className="inline-flex items-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors cursor-pointer shrink-0">
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> กำลังอัปโหลด...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" /> อัปโหลดไฟล์เข้าคลังสื่อ
            </>
          )}
          <input
            type="file"
            multiple
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex gap-1.5">
          {[
            { key: 'all', label: `ทั้งหมด (${initialMedia.length})` },
            { key: 'image', label: 'รูปภาพ' },
            { key: 'doc', label: 'เอกสาร/อื่นๆ' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setFilterType(t.key as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                filterType === t.key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อไฟล์..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
          />
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
          ไม่พบไฟล์ในคลังสื่อ
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:border-indigo-300 transition-all"
            >
              <div className="aspect-square bg-slate-100 relative overflow-hidden flex items-center justify-center">
                {isImage(item) ? (
                  <img
                    src={normalizeImageUrl(item.file_path)}
                    alt={item.file_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center text-slate-400">
                    <FileText className="w-10 h-10 mb-1 text-indigo-500" />
                    <span className="text-[10px] uppercase font-mono">
                      {item.file_type.slice(0, 12)}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <div
                    className="text-xs font-semibold text-slate-800 truncate"
                    title={item.file_name}
                  >
                    {item.file_name}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {formatSize(item.file_size)}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleCopy(item)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                  >
                    {copiedId === item.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" /> คัดลอกแล้ว
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> คัดลอกลิงก์
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setRenameItem(item)
                        setNewName(item.file_name)
                      }}
                      className="p-1 text-slate-500 hover:text-indigo-600 cursor-pointer"
                      title="เปลี่ยนชื่อ"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1 text-slate-500 hover:text-red-600 cursor-pointer"
                      title="ลบ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rename Modal */}
      {renameItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800">เปลี่ยนชื่อไฟล์</h3>
              <button
                onClick={() => setRenameItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRename} className="space-y-4">
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRenameItem(null)}
                  className="px-4 py-2 text-sm bg-slate-100 rounded-xl cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-xl cursor-pointer"
                >
                  บันทึกชื่อใหม่
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
