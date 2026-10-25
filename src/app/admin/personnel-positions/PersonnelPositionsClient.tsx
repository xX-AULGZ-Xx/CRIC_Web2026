'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Briefcase, Plus, Pencil, Trash2, ArrowUp, ArrowDown, X } from 'lucide-react'
import { swalConfirm } from '@/lib/sweetalert'

interface PositionItem {
  id: number
  name: string
  order_num: number | null
  _count?: { personnel_position_links: number }
}

export function PersonnelPositionsClient({
  positions,
}: {
  positions: PositionItem[]
}) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ id: 0, name: '', order_num: 1 })

  const openCreate = () => {
    setForm({ id: 0, name: '', order_num: positions.length + 1 })
    setModalOpen(true)
  }

  const openEdit = (p: PositionItem) => {
    setForm({ id: p.id, name: p.name, order_num: p.order_num ?? 1 })
    setModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    const res = await fetch('/api/admin/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        module: 'personnel_positions',
        action: 'save',
        data: form,
      }),
    })
    if (res.ok) {
      setModalOpen(false)
      router.refresh()
    }
  }

  const handleDelete = async (id: number) => {
    const ok = await swalConfirm({
      title: 'ยืนยันการลบตำแหน่ง?',
      text: 'ต้องการลบตำแหน่งบุคลากรนี้ใช่หรือไม่?',
      confirmButtonText: 'ลบตำแหน่ง',
    })
    if (!ok) return
    const res = await fetch('/api/admin/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        module: 'personnel_positions',
        action: 'delete',
        data: { id },
      }),
    })
    if (res.ok) router.refresh()
  }

  const handleReorder = async (id: number, direction: 'up' | 'down') => {
    const res = await fetch('/api/admin/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        module: 'personnel_positions',
        action: 'reorder',
        data: { id, direction },
      }),
    })
    if (res.ok) router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-indigo-600" />
            จัดการตำแหน่งบุคลากร ({positions.length} ตำแหน่ง)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            กำหนดชื่อตำแหน่งและจัดลำดับความสำคัญของตำแหน่งข้าราชการครูและบุคลากร
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          เพิ่มตำแหน่งใหม่
        </button>
      </div>

      {positions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm py-16 text-center text-slate-400">
          ยังไม่มีรายการตำแหน่งบุคลากร
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {positions.map((pos) => (
            <div
              key={pos.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between gap-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="inline-flex items-center bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-0.5">
                  <button
                    onClick={() => handleReorder(pos.id, 'up')}
                    className="p-1 text-slate-400 hover:text-indigo-600 cursor-pointer"
                    title="เลื่อนขึ้น"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-bold text-xs text-slate-700 px-1.5">
                    #{pos.order_num ?? 0}
                  </span>
                  <button
                    onClick={() => handleReorder(pos.id, 'down')}
                    className="p-1 text-slate-400 hover:text-indigo-600 cursor-pointer"
                    title="เลื่อนลง"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                  {pos._count?.personnel_position_links || 0} คน
                </span>
              </div>

              <div className="py-1">
                <h3 className="font-bold text-slate-800 text-base line-clamp-2">{pos.name}</h3>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-2.5 border-t border-slate-100">
                <button
                  onClick={() => openEdit(pos)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl cursor-pointer transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" /> แก้ไข
                </button>
                <button
                  onClick={() => handleDelete(pos.id)}
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

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">
                {form.id ? 'แก้ไขตำแหน่งบุคลากร' : 'เพิ่มตำแหน่งบุคลากร'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  ชื่อตำแหน่ง *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="เช่น ผู้อำนวยการ, รองผู้อำนวยการ, ครู"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  ลำดับความสำคัญ
                </label>
                <input
                  type="number"
                  value={form.order_num}
                  onChange={(e) => setForm({ ...form, order_num: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm bg-slate-100 text-slate-600 rounded-xl cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-xl cursor-pointer"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
