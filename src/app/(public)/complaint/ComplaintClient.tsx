'use client'

import React, { useState } from 'react'
import {
  ShieldAlert,
  Send,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Lock,
  UserCheck,
  HelpCircle,
} from 'lucide-react'

export function ComplaintClient({
  complaintTitle,
  complaintDesc,
  primaryBg,
  primaryText,
}: {
  complaintTitle?: string
  complaintDesc?: string
  primaryBg: string
  primaryText: string
}) {
  const [activeTab, setActiveTab] = useState<'submit' | 'track'>('submit')

  // Submit state
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Track state
  const [trackTicket, setTrackTicket] = useState('')
  const [isTracking, setIsTracking] = useState(false)
  const [trackResult, setTrackResult] = useState<any | null>(null)
  const [trackError, setTrackError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const form = e.currentTarget
      const formData = new FormData(form)

      if (isAnonymous) {
        formData.delete('reporter_name')
        formData.delete('reporter_email')
        formData.delete('reporter_phone')
      }

      const res = await fetch('/api/complaints/submit', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'ส่งข้อมูลไม่สำเร็จ')
      }

      setSubmittedTicket(data.ticket_number)
      form.reset()
    } catch (err: any) {
      setSubmitError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleTrack(e: React.FormEvent) {
    e.preventDefault()
    if (!trackTicket.trim()) return

    setIsTracking(true)
    setTrackError(null)
    setTrackResult(null)

    try {
      const res = await fetch(`/api/complaints/check?ticket=${encodeURIComponent(trackTicket.trim())}`)
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'ไม่พบข้อมูลคำร้อง')
      }
      setTrackResult(data.data)
    } catch (err: any) {
      setTrackError(err.message)
    } finally {
      setIsTracking(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            <span>รอดำเนินการ</span>
          </span>
        )
      case 'investigating':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-200">
            <Search className="w-3.5 h-3.5" />
            <span>อยู่ระหว่างการตรวจสอบ</span>
          </span>
        )
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>ดำเนินการแล้วเสร็จ</span>
          </span>
        )
      case 'dismissed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-rose-50 text-rose-700 rounded-full text-xs font-bold border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>ยุติเรื่อง / ยกเลิก</span>
          </span>
        )
      default:
        return <span>{status}</span>
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-xs">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {complaintTitle || 'ศูนย์ร้องเรียนการทุจริตและประพฤติมิชอบ'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
          {complaintDesc ||
            'วิทยาลัยมุ่งมั่นดำเนินงานด้วยความโปร่งใส ท่านสามารถแจ้งเรื่องร้องเรียนการทุจริต หรือการประพฤติมิชอบของบุคลากรได้ผ่านระบบนี้ (ข้อมูลจะถูกเก็บเป็นความลับสูงสุด)'}
        </p>

        {/* Tab Switcher */}
        <div className="flex justify-center gap-2 mt-8 p-1.5 bg-slate-100 rounded-2xl max-w-sm mx-auto">
          <button
            onClick={() => setActiveTab('submit')}
            className={`flex-1 py-2 px-4 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeTab === 'submit'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            แจ้งเรื่องร้องเรียน
          </button>
          <button
            onClick={() => setActiveTab('track')}
            className={`flex-1 py-2 px-4 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeTab === 'track'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            ติดตามสถานะคำร้อง
          </button>
        </div>
      </div>

      {/* Tab 1: Submit Form */}
      {activeTab === 'submit' && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-10 shadow-xs">
          {submittedTicket ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">
                ส่งเรื่องร้องเรียนเรียบร้อยแล้ว
              </h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                ระบบได้บันทึกเรื่องร้องเรียนของท่านแล้ว กรุณาจดบันทึกเลขที่คำร้องนี้เพื่อใช้ในการติดตามความคืบหน้า
              </p>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl inline-block">
                <span className="text-xs text-slate-400 block font-medium">เลขที่คำร้องของคุณ (Ticket Number)</span>
                <span className="text-2xl font-black font-mono text-orange-600 tracking-wider">
                  {submittedTicket}
                </span>
              </div>
              <div className="pt-4">
                <button
                  onClick={() => {
                    setSubmittedTicket(null)
                    setTrackTicket(submittedTicket)
                    setActiveTab('track')
                  }}
                  className={`px-6 py-2.5 ${primaryBg} text-white font-bold rounded-xl text-xs sm:text-sm hover:opacity-90 transition`}
                >
                  ไปที่หน้าตรวจสอบสถานะ
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {submitError && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Anonymous Toggle */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">แจ้งเรื่องแบบไม่เปิดเผยตัวตน</h4>
                    <p className="text-xs text-slate-400">รักษาความลับ 100% ไม่จำเป็นต้องกรอกชื่อหรือข้อมูลติดต่อ</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                </label>
              </div>

              {/* Contact info if NOT anonymous */}
              {!isAnonymous && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 border border-slate-100 rounded-2xl bg-slate-50/50">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">ชื่อ-นามสกุล ผู้แจ้ง</label>
                    <input
                      type="text"
                      name="reporter_name"
                      placeholder="นาย/นาง/นางสาว..."
                      className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">อีเมล</label>
                    <input
                      type="email"
                      name="reporter_email"
                      placeholder="example@mail.com"
                      className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">เบอร์โทรศัพท์</label>
                    <input
                      type="tel"
                      name="reporter_phone"
                      placeholder="08X-XXXXXXX"
                      className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-hidden"
                    />
                  </div>
                </div>
              )}

              {/* Form fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    ประเภทเรื่องร้องเรียน <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="type"
                    className="w-full px-4 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-hidden"
                  >
                    <option value="corruption">การทุจริตต่อหน้าที่ / รับผลประโยชน์</option>
                    <option value="misconduct">การประพฤติมิชอบ / ฝ่าฝืนจริยธรรม</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    วันที่เกิดเหตุ (ถ้าทราบ)
                  </label>
                  <input
                    type="date"
                    name="incident_date"
                    className="w-full px-4 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  หัวข้อเรื่องร้องเรียน <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="ระบุหัวข้อเรื่องการร้องเรียน..."
                  className="w-full px-4 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  ชื่อผู้ถูกร้องเรียน / เจ้าหน้าที่ / แผนกงาน (ถ้ามี)
                </label>
                <input
                  type="text"
                  name="accused_name"
                  placeholder="ระบุชื่อเจ้าหน้าที่หรือหน่วยงานที่เกี่ยวข้อง..."
                  className="w-full px-4 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  รายละเอียดเหตุการณ์และพฤติการณ์ <span className="text-rose-500">*</span>
                </label>
                <textarea
                  name="description"
                  required
                  rows={5}
                  placeholder="อธิบายรายละเอียด วัน เวลา สถานที่ และข้อเท็จจริงที่เกิดขึ้นอย่างครบถ้วน..."
                  className="w-full px-4 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-hidden leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  แนบไฟล์เอกสาร / รูปภาพหลักฐาน (PDF, JPG, PNG ขนาดไม่เกิน 15MB)
                </label>
                <input
                  type="file"
                  name="attachment"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="w-full px-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-orange-600 file:text-white hover:file:opacity-90 cursor-pointer"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-3 px-6 ${primaryBg} text-white font-bold rounded-2xl text-sm shadow-md hover:opacity-95 transition flex items-center justify-center gap-2 disabled:opacity-50`}
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'กำลังส่งข้อมูล...' : 'ยืนยันและส่งเรื่องร้องเรียน'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Tab 2: Track Status */}
      {activeTab === 'track' && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
          <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={trackTicket}
              onChange={(e) => setTrackTicket(e.target.value)}
              placeholder="กรอกเลขที่คำร้อง เช่น CMP-20261023-XXXX"
              className="flex-1 px-4 py-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-hidden font-mono"
            />
            <button
              type="submit"
              disabled={isTracking}
              className={`px-6 py-3 ${primaryBg} text-white font-bold rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shrink-0 disabled:opacity-50`}
            >
              <Search className="w-4 h-4" />
              <span>{isTracking ? 'กำลังตรวจสอบ...' : 'ตรวจสอบสถานะ'}</span>
            </button>
          </form>

          {trackError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{trackError}</span>
            </div>
          )}

          {trackResult && (
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <span className="text-xs text-slate-400 font-medium">เลขที่คำร้อง</span>
                  <h3 className="text-xl font-mono font-black text-slate-900">{trackResult.ticket_number}</h3>
                </div>
                <div>{getStatusBadge(trackResult.status)}</div>
              </div>

              <div>
                <h4 className="font-extrabold text-slate-900 text-base">{trackResult.title}</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  วันที่แจ้ง: {new Date(trackResult.created_at).toLocaleDateString('th-TH')}
                </p>
              </div>

              {trackResult.status_note && (
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1">
                  <span className="text-xs font-bold text-slate-700 block">การดำเนินการจากเจ้าหน้าที่:</span>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                    {trackResult.status_note}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
