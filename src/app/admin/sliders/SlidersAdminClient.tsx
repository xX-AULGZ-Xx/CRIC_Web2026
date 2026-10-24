'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Images, Plus, Pencil, Trash2, X, ExternalLink, Check, EyeOff } from 'lucide-react'
import { AdminUploadField } from '../AdminMediaPicker'
import { normalizeImageUrl } from '@/lib/url-helper'

interface SliderItem {
  id: number
  title: string | null
  subtitle: string | null
  link: string | null
  image_path: string
  order_num: number | null
  is_active: boolean | null
  fit_width: boolean | null
}

export function SlidersAdminClient({ initialSliders }: { initialSliders: SliderItem[] }) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    id: 0,
    title: '',
    subtitle: '',
    link: '',
    image_path: '',
    order_num: 1,
    is_active: true,
    fit_width: false,
  })

  const openCreate = () => {
    setForm({
      id: 0,
      title: '',
      subtitle: '',
      link: '',
      image_path: '',
      order_num: initialSliders.length + 1,
      is_active: true,
      fit_width: false,
    })
    setModalOpen(true)
  }

  const openEdit = (s: SliderItem) => {
    setForm({
      id: s.id,
      title: s.title || '',
      subtitle: s.subtitle || '',
      link: s.link || '',
      image_path: s.image_path || '',
      order_num: s.order_num ?? 0,
      is_active: Boolean(s.is_active ?? true),
      fit_width: Boolean(s.fit_width ?? false),
    })
    setModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.image_path) {
      alert('กรุณาอัปโหลดหรือระบุพาร์ธรูปภาพสไลด์')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'sliders',
          action: 'save',
          data: form,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'บันทึกไม่สำเร็จ')
      setModalOpen(false)
      router.refresh()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('ยืนยันการลบสไลด์แบนเนอร์นี้?')) return
    const res = await fetch('/api/admin/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ module: 'sliders', action: 'delete', data: { id } }),
    })
    if (res.ok) router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Images className="w-6 h-6 text-indigo-600" />
            จัดการสไลด์แบนเนอร์ (Hero Sliders)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            เพิ่ม แก้ไข จัดลำดับการแสดงผล และตั้งค่าภาพแบนเนอร์สไลด์หน้าแรกของเว็บไซต์
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          เพิ่มสไลด์ใหม่
        </button>
      </div>

      {/* Sliders Banner Card Grid */}
      {initialSliders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 shadow-sm">
          ยังไม่มีรายการสไลด์แบนเนอร์
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {initialSliders.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all overflow-hidden flex flex-col group"
            >
              {/* 16:9 Banner Preview */}
              <div className="aspect-video bg-slate-100 relative overflow-hidden">
                <img
                  src={normalizeImageUrl(s.image_path)}
                  alt={s.title || 'Slider'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-900/80 text-white backdrop-blur-sm">
                    ลำดับ #{s.order_num ?? 0}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/95 text-slate-700 shadow-sm">
                    {s.fit_width ? 'Fit Width' : 'Cover'}
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  {s.is_active ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500 text-white shadow-sm">
                      <Check className="w-3.5 h-3.5" /> เปิดแสดงผล
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-700 text-white shadow-sm">
                      <EyeOff className="w-3.5 h-3.5" /> ซ่อนไว้
                    </span>
                  )}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-bold text-slate-800 line-clamp-1">
                    {s.title || <span className="text-slate-400 italic font-normal">(ไม่มีหัวข้อข้อความ)</span>}
                  </h3>
                  {s.subtitle && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{s.subtitle}</p>
                  )}
                  {s.link && (
                    <a
                      href={s.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline mt-2 truncate max-w-full"
                    >
                      {s.link} <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => openEdit(s)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" /> แก้ไข
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> ลบ
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-lg">
                {form.id ? 'แก้ไขสไลด์แบนเนอร์' : 'เพิ่มสไลด์แบนเนอร์ใหม่'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <AdminUploadField
                label="รูปภาพแบนเนอร์ *"
                value={form.image_path}
                onChange={(path) => setForm({ ...form, image_path: path })}
                folder="sliders"
                helpText="ขนาดแนะนำ 1920x650 พิกเซล (รองรับ JPG, PNG, WebP)"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    หัวข้อหลัก (เว้นว่างได้)
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="เช่น ยินดีต้อนรับสู่สถานศึกษา"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    ลำดับการแสดงผล
                  </label>
                  <input
                    type="number"
                    value={form.order_num}
                    onChange={(e) => setForm({ ...form, order_num: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  คำบรรยายรอง (Subtitle)
                </label>
                <input
                  type="text"
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  placeholder="ข้อความรายละเอียดเพิ่มเติม"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  ลิงก์ปลายทางเมื่อคลิก (URL)
                </label>
                <input
                  type="text"
                  value={form.link}
                  onChange={(e) => setForm({ ...form, link: e.target.value })}
                  placeholder="https://... หรือ /news/..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.fit_width}
                    onChange={(e) => setForm({ ...form, fit_width: e.target.checked })}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span>ปรับภาพพอดีความกว้าง (Fit Width ไม่ตัดขอบภาพ)</span>
                </label>

                <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span>เปิดแสดงผลบนหน้าเว็บไซต์</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
