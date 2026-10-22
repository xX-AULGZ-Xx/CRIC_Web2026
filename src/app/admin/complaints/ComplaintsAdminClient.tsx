'use client'

import React, { useState } from 'react'
import {
  ShieldAlert,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Save,
  Loader2,
} from 'lucide-react'

export function ComplaintsAdminClient({
  complaintsList,
}: {
  complaintsList: any[]
}) {
  const [items, setItems] = useState(complaintsList)
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [status, setStatus] = useState<string>('pending')
  const [statusNote, setStatusNote] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = items.filter(
    (c) =>
      c.ticket_number.toLowerCase().includes(search.toLowerCase()) ||
      c.title.toLowerCase().includes(search.toLowerCase())
  )

  function openModal(item: any) {
    setSelectedItem(item)
    setStatus(item.status || 'pending')
    setStatusNote(item.status_note || '')
  }

  async function handleSaveStatus() {
    if (!selectedItem) return
    setIsSaving(true)

    try {
      const res = await fetch('/api/admin/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedItem.id,
          status,
          status_note: statusNote,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setItems((prev) =>
          prev.map((c) =>
            c.id === selectedItem.id
              ? { ...c, status, status_note: statusNote }
              : c
          )
        )
        setSelectedItem(null)
      }
    } catch {
      alert('เกิดข้อผิดพลาดในการบันทึก')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 text-rose-500" />
            <span>จัดการเรื่องร้องเรียนทุจริตและประพฤติมิชอบ</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            รายการคำร้องทั้งหมด ({items.length} รายการ)
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาเลขที่คำร้อง หรือชื่อเรื่อง..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:border-orange-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 px-6">เลขที่คำร้อง</th>
                <th className="py-3.5 px-4">หัวข้อเรื่องร้องเรียน</th>
                <th className="py-3.5 px-4">ผู้ถูกร้องเรียน</th>
                <th className="py-3.5 px-4 text-center">สถานะ</th>
                <th className="py-3.5 px-4">วันที่แจ้ง</th>
                <th className="py-3.5 px-6 text-right">ดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-4 px-6 font-mono font-bold text-orange-400">
                    {item.ticket_number}
                  </td>
                  <td className="py-4 px-4 font-bold text-white max-w-sm truncate">
                    {item.title}
                  </td>
                  <td className="py-4 px-4 text-slate-400">
                    {item.accused_name || '-'}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        item.status === 'pending'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : item.status === 'investigating'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                          : item.status === 'resolved'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-slate-500 text-[11px]">
                    {item.created_at
                      ? new Date(item.created_at).toLocaleDateString('th-TH')
                      : '-'}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => openModal(item)}
                      className="px-3 py-1.5 bg-orange-600/20 hover:bg-orange-600 text-orange-400 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      ตรวจสอบ / อัปเดต
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    ไม่พบข้อมูลเรื่องร้องเรียน
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-orange-400">
                  {selectedItem.ticket_number}
                </span>
                <h3 className="text-lg font-black text-white">{selectedItem.title}</h3>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ปิด
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-2">
                <p className="text-slate-300">
                  <strong className="text-white">ประเภท:</strong> {selectedItem.type}
                </p>
                {selectedItem.accused_name && (
                  <p className="text-slate-300">
                    <strong className="text-white">ผู้ถูกร้องเรียน:</strong> {selectedItem.accused_name}
                  </p>
                )}
                <p className="text-slate-300 leading-relaxed">
                  <strong className="text-white">รายละเอียด:</strong> {selectedItem.description}
                </p>
                {selectedItem.reporter_name && (
                  <p className="text-slate-400 pt-2 border-t border-slate-800">
                    ผู้แจ้ง: {selectedItem.reporter_name} ({selectedItem.reporter_phone || selectedItem.reporter_email || '-'})
                  </p>
                )}
                {selectedItem.attachment_path && (
                  <a
                    href={`/${selectedItem.attachment_path}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 text-orange-400 hover:underline pt-2 font-bold"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>เปิดดูเอกสารหลักฐานแนบ</span>
                  </a>
                )}
              </div>

              {/* Status form */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  ปรับเปลี่ยนสถานะการดำเนินการ
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-hidden focus:border-orange-500"
                >
                  <option value="pending">รอดำเนินการ (pending)</option>
                  <option value="investigating">อยู่ระหว่างการตรวจสอบ (investigating)</option>
                  <option value="resolved">ดำเนินการแล้วเสร็จ (resolved)</option>
                  <option value="dismissed">ยุติเรื่อง / ยกเลิก (dismissed)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  บันทึกข้อความสรุปของเจ้าหน้าที่ (แสดงให้ประชาชนเห็นตอนตรวจสอบ)
                </label>
                <textarea
                  rows={4}
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="เช่น อยู่ระหว่างคณะกรรมการตรวจสอบข้อเท็จจริง หรือ ดำเนินการตักเตือนและบันทึกประวัติแล้วเสร็จ..."
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-hidden focus:border-orange-500 leading-relaxed"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveStatus}
                disabled={isSaving}
                className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>บันทึกสถานะ</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
