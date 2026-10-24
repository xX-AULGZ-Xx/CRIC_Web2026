'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  Eye,
  Trash2,
  X,
  CheckCircle2,
  Clock,
  Search,
  Paperclip,
} from 'lucide-react'

interface ComplaintItem {
  id: number
  ticket_number: string
  title: string
  type: 'corruption' | 'misconduct'
  description: string
  accused_name: string | null
  incident_date: string | null
  reporter_name: string | null
  reporter_email: string | null
  reporter_phone: string | null
  attachment_path: string | null
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed' | null
  status_note: string | null
  is_published: boolean | null
  created_at: string | null
}

export function ComplaintsAdminClient({
  initialComplaints,
}: {
  initialComplaints: ComplaintItem[]
}) {
  const router = useRouter()
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<ComplaintItem | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    status: 'pending' as 'pending' | 'investigating' | 'resolved' | 'dismissed',
    status_note: '',
    is_published: false,
  })

  const openModal = (c: ComplaintItem) => {
    setSelected(c)
    setForm({
      status: c.status || 'pending',
      status_note: c.status_note || '',
      is_published: Boolean(c.is_published ?? false),
    })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'complaints',
          action: 'update_status',
          data: {
            id: selected.id,
            ...form,
          },
        }),
      })
      if (res.ok) {
        setSelected(null)
        router.refresh()
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('ยืนยันการลบข้อมูลเรื่องร้องเรียนนี้?')) return
    const res = await fetch('/api/admin/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        module: 'complaints',
        action: 'delete',
        data: { id },
      }),
    })
    if (res.ok) router.refresh()
  }

  const statusBadge = (st: string | null) => {
    switch (st) {
      case 'investigating':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-700">
            กำลังตรวจสอบ
          </span>
        )
      case 'resolved':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
            ดำเนินการเสร็จสิ้น
          </span>
        )
      case 'dismissed':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
            ยุติเรื่อง
          </span>
        )
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            รอดำเนินการ
          </span>
        )
    }
  }

  const filtered = initialComplaints.filter((c) => {
    const matchStatus = filterStatus === 'all' || c.status === filterStatus
    const matchSearch =
      !search ||
      c.ticket_number.toLowerCase().includes(search.toLowerCase()) ||
      c.title.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            จัดการเรื่องร้องเรียนและแจ้งเบาะแสการทุจริต ({initialComplaints.length} เรื่อง)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            ตรวจสอบรายละเอียดเรื่องร้องเรียน อัปเดตสถานะการดำเนินการ และบันทึกผลการตรวจสอบ
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {[
            { key: 'all', label: 'ทั้งหมด' },
            { key: 'pending', label: 'รอดำเนินการ' },
            { key: 'investigating', label: 'กำลังตรวจสอบ' },
            { key: 'resolved', label: 'เสร็จสิ้น' },
            { key: 'dismissed', label: 'ยุติเรื่อง' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                filterStatus === tab.key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหารหัส Ticket หรือหัวข้อ..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
          />
        </div>
      </div>

      {/* Complaints Ticket Card Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm py-16 text-center text-slate-400">
          ไม่พบข้อมูลเรื่องร้องเรียน
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between gap-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg font-mono text-xs font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
                      #{c.ticket_number}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        c.type === 'corruption'
                          ? 'bg-red-50 text-red-700 border border-red-100'
                          : 'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}
                    >
                      {c.type === 'corruption' ? 'แจ้งเบาะแสทุจริต' : 'ร้องเรียนทั่วไป'}
                    </span>
                  </div>
                  {statusBadge(c.status)}
                </div>

                <h3 className="font-bold text-slate-800 text-base line-clamp-1">{c.title}</h3>
                {c.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {c.description}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                <div className="text-xs text-slate-500 space-y-0.5">
                  <div>
                    ผู้แจ้ง:{' '}
                    <span className="font-semibold text-slate-700">
                      {c.reporter_name || 'ไม่ประสงค์ออกนาม'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    วันที่แจ้ง:{' '}
                    {c.created_at
                      ? new Date(c.created_at).toLocaleDateString('th-TH', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '-'}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openModal(c)}
                    className="inline-flex items-center px-3.5 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl cursor-pointer transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1.5" /> ตรวจสอบ / ตอบกลับ
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-xl cursor-pointer transition-colors"
                    title="ลบ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail & Update Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-indigo-600">
                  #{selected.ticket_number}
                </span>
                <h3 className="font-bold text-slate-800 text-lg">{selected.title}</h3>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-sm">
                <div>
                  <span className="font-semibold text-slate-600">ผู้ถูกร้องเรียน: </span>
                  <span className="text-slate-800">{selected.accused_name || '-'}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-600">ผู้แจ้งเบาะแส: </span>
                  <span className="text-slate-800">
                    {selected.reporter_name || 'ไม่ประสงค์ออกนาม'} ({selected.reporter_phone || '-'},{' '}
                    {selected.reporter_email || '-'})
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <div className="font-semibold text-slate-600 mb-1">รายละเอียดเรื่องร้องเรียน:</div>
                  <p className="text-slate-800 whitespace-pre-line">{selected.description}</p>
                </div>
                {selected.attachment_path && (
                  <div className="pt-2">
                    <a
                      href={
                        selected.attachment_path.startsWith('/')
                          ? selected.attachment_path
                          : `/${selected.attachment_path}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline"
                    >
                      <Paperclip className="w-3.5 h-3.5" /> เปิดดูไฟล์หลักฐานแนบ
                    </a>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  อัปเดตสถานะการดำเนินการ
                </label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status: e.target.value as
                        | 'pending'
                        | 'investigating'
                        | 'resolved'
                        | 'dismissed',
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                >
                  <option value="pending">รอดำเนินการ (Pending)</option>
                  <option value="investigating">กำลังตรวจสอบข้อเท็จจริง (Investigating)</option>
                  <option value="resolved">ดำเนินการเสร็จสิ้น (Resolved)</option>
                  <option value="dismissed">ยุติเรื่อง (Dismissed)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  บันทึกผลการตรวจสอบ / หมายเหตุแจ้งผู้ร้องเรียน
                </label>
                <textarea
                  rows={4}
                  value={form.status_note}
                  onChange={(e) => setForm({ ...form, status_note: e.target.value })}
                  placeholder="ระบุความคืบหน้าหรือผลการพิจารณา..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_published}
                  onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
                />
                <span>อนุญาตให้ติดตามสถานะด้วยรหัส Ticket บนหน้าเว็บไซต์</span>
              </label>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="px-4 py-2 text-sm bg-slate-100 text-slate-600 rounded-xl cursor-pointer"
                >
                  ปิดหน้าต่าง
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-xl cursor-pointer"
                >
                  {saving ? 'กำลังบันทึก...' : 'บันทึกผลการดำเนินการ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
