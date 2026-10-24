'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Download,
  Plus,
  Pencil,
  Trash2,
  FolderPlus,
  FileText,
  Upload,
  Loader2,
  X,
  ExternalLink,
} from 'lucide-react'

interface DownloadCat {
  id: number
  name: string
  order_num: number | null
}

interface DownloadItem {
  id: number
  category_id: number | null
  title: string
  file_path: string
  file_type: string | null
  file_size: number | null
  downloads_count: number | null
  created_at: string | null
  download_categories?: { id: number; name: string } | null
}

export function DownloadsAdminClient({
  initialDownloads,
  categories,
}: {
  initialDownloads: DownloadItem[]
  categories: DownloadCat[]
}) {
  const router = useRouter()
  const [filterCat, setFilterCat] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [catModalOpen, setCatModalOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [catForm, setCatForm] = useState({ id: 0, name: '', order_num: 1 })
  const [form, setForm] = useState({
    id: 0,
    title: '',
    category_id: '',
    file_path: '',
    file_type: 'pdf',
    file_size: 0,
  })

  const openCreate = () => {
    setForm({
      id: 0,
      title: '',
      category_id: categories[0]?.id ? String(categories[0].id) : '',
      file_path: '',
      file_type: 'pdf',
      file_size: 0,
    })
    setModalOpen(true)
  }

  const openEdit = (d: DownloadItem) => {
    setForm({
      id: d.id,
      title: d.title,
      category_id: d.category_id ? String(d.category_id) : '',
      file_path: d.file_path,
      file_type: d.file_type || 'pdf',
      file_size: d.file_size || 0,
    })
    setModalOpen(true)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'downloads')
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Upload failed')
      const ext = (json.file_name.split('.').pop() || 'pdf').toLowerCase()
      setForm((prev) => ({
        ...prev,
        title: prev.title || json.file_name,
        file_path: json.path,
        file_type: ext,
        file_size: json.file_size,
      }))
    } catch (err: any) {
      alert(err.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.file_path.trim()) {
      alert('กรุณาระบุชื่อเอกสารและอัปโหลดไฟล์')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'downloads',
          action: 'save',
          data: {
            ...form,
            category_id: form.category_id ? Number(form.category_id) : null,
          },
        }),
      })
      if (res.ok) {
        setModalOpen(false)
        router.refresh()
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('ยืนยันการลบไฟล์เอกสารนี้?')) return
    await fetch('/api/admin/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ module: 'downloads', action: 'delete', data: { id } }),
    })
    router.refresh()
  }

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!catForm.name.trim()) return
    await fetch('/api/admin/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        module: 'downloads',
        action: 'save_category',
        data: catForm,
      }),
    })
    setCatForm({ id: 0, name: '', order_num: categories.length + 1 })
    router.refresh()
  }

  const filtered = initialDownloads.filter(
    (d) => filterCat === 'all' || String(d.category_id) === filterCat
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Download className="w-6 h-6 text-indigo-600" />
            จัดการศูนย์ดาวน์โหลดเอกสาร ({initialDownloads.length} รายการ)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            อัปโหลดแบบฟอร์ม ระเบียบ คำสั่ง คู่มือ และเอกสารเผยแพร่สำหรับผู้เรียนและประชาชน
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCatModalOpen(true)}
            className="inline-flex items-center px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl cursor-pointer"
          >
            <FolderPlus className="w-4 h-4 mr-1.5" />
            หมวดหมู่เอกสาร ({categories.length})
          </button>
          <button
            onClick={openCreate}
            className="inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            เพิ่มเอกสารดาวน์โหลด
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterCat('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
            filterCat === 'all'
              ? 'bg-indigo-600 text-white'
              : 'bg-white border border-slate-200 text-slate-600'
          }`}
        >
          ทั้งหมด
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setFilterCat(String(c.id))}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
              filterCat === String(c.id)
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Downloads Card Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm py-16 text-center text-slate-400">
          ไม่พบรายการเอกสารดาวน์โหลด
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((d) => (
            <div
              key={d.id}
              className="group bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex flex-col items-center justify-center shrink-0 border border-indigo-100">
                  <FileText className="w-5 h-5" />
                  <span className="text-[9px] font-bold uppercase tracking-tighter mt-0.5">
                    {d.file_type || 'FILE'}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700">
                      {d.download_categories?.name || 'ทั่วไป'}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600">
                      ดาวน์โหลด {d.downloads_count || 0} ครั้ง
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm line-clamp-2 group-hover:text-indigo-600 transition-colors">
                    {d.title}
                  </h3>
                  <a
                    href={d.file_path.startsWith('/') ? d.file_path : `/${d.file_path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-600 hover:underline inline-flex items-center gap-1 mt-1.5 truncate max-w-full"
                  >
                    <span className="truncate">{d.file_path}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-3 border-t border-slate-100">
                <button
                  onClick={() => openEdit(d)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl cursor-pointer transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" /> แก้ไข
                </button>
                <button
                  onClick={() => handleDelete(d.id)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-xl cursor-pointer transition-colors"
                  title="ลบ"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Download Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 w-full max-w-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800">
                {form.id ? 'แก้ไขข้อมูลเอกสาร' : 'เพิ่มเอกสารดาวน์โหลดใหม่'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  อัปโหลดไฟล์เอกสาร (PDF, Word, Excel, ZIP) *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={form.file_path}
                    onChange={(e) => setForm({ ...form, file_path: e.target.value })}
                    placeholder="uploads/downloads/... หรือลิงก์ไฟล์"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                  />
                  <label className="inline-flex items-center px-4 py-2 bg-indigo-50 text-indigo-700 font-semibold text-sm rounded-xl border border-indigo-200 cursor-pointer shrink-0">
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-1.5" /> เลือกไฟล์
                      </>
                    )}
                    <input type="file" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  ชื่อเอกสารสำหรับแสดงผล *
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="ระบุชื่อเอกสาร..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  หมวดหมู่เอกสาร
                </label>
                <select
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                >
                  <option value="">-- ไม่ระบุหมวดหมู่ --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm bg-slate-100 rounded-xl cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-xl cursor-pointer"
                >
                  {saving ? 'กำลังบันทึก...' : 'บันทึกเอกสาร'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Categories Modal */}
      {catModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 w-full max-w-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800">จัดการหมวดหมู่เอกสารดาวน์โหลด</h3>
              <button
                onClick={() => setCatModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveCategory} className="flex gap-2">
              <input
                type="text"
                required
                value={catForm.name}
                onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                placeholder="ชื่อหมวดหมู่ใหม่..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl cursor-pointer"
              >
                {catForm.id ? 'อัปเดต' : 'เพิ่มหมวดหมู่'}
              </button>
            </form>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl max-h-60 overflow-y-auto">
              {categories.map((c) => (
                <div key={c.id} className="px-4 py-2.5 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-800">{c.name}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() =>
                        setCatForm({ id: c.id, name: c.name, order_num: c.order_num ?? 1 })
                      }
                      className="p-1 text-indigo-600 cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm('ลบหมวดหมู่นี้?')) return
                        await fetch('/api/admin/cms', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            module: 'downloads',
                            action: 'delete_category',
                            data: { id: c.id },
                          }),
                        })
                        router.refresh()
                      }}
                      className="p-1 text-red-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
