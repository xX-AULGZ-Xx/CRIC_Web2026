'use client'

import React, { useState } from 'react'
import { Settings, Save, CheckCircle2, AlertCircle } from 'lucide-react'

export function SettingsAdminClient({ initialSettings }: { initialSettings: Record<string, string> }) {
  const [formData, setFormData] = useState(initialSettings)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  function handleChange(key: string, value: string) {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: formData }),
      })
      if (res.ok) {
        setMessage('บันทึกการตั้งค่าเรียบร้อยแล้ว')
      } else {
        setMessage('เกิดข้อผิดพลาดในการบันทึก')
      }
    } catch {
      setMessage('เกิดข้อผิดพลาดในการเชื่อมต่อ')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-orange-500" />
            <span>ตั้งค่าระบบเว็บไซต์ (Site Settings)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            กำหนดข้อมูลองค์กร ช่องทางติดต่อ และชุดสีประจำเว็บไซต์
          </p>
        </div>
      </div>

      {message && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        {/* Basic Info */}
        <div className="space-y-4">
          <h3 className="text-sm font-extrabold text-orange-400 uppercase tracking-wider border-b border-slate-800 pb-2">
            ข้อมูลทั่วไปของเว็บไซต์
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">ชื่อเว็บไซต์ (ภาษาไทย)</label>
              <input
                type="text"
                value={formData.site_name || ''}
                onChange={(e) => handleChange('site_name', e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs sm:text-sm focus:border-orange-500 outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">ชื่อเว็บไซต์ (ภาษาอังกฤษ)</label>
              <input
                type="text"
                value={formData.site_name_en || ''}
                onChange={(e) => handleChange('site_name_en', e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs sm:text-sm focus:border-orange-500 outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">ชุดสีประจำเว็บไซต์ (Theme Color)</label>
              <select
                value={formData.theme_color || 'orange'}
                onChange={(e) => handleChange('theme_color', e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs sm:text-sm focus:border-orange-500 outline-hidden"
              >
                <option value="orange">สีส้ม (Orange - ค่าเริ่มต้นวิทยาลัย)</option>
                <option value="blue">สีน้ำเงิน (Blue)</option>
                <option value="red">สีแดง (Red)</option>
                <option value="green">สีเขียว (Green)</option>
                <option value="purple">สีม่วง (Purple)</option>
                <option value="indigo">สีคราม (Indigo)</option>
                <option value="slate">สีเทาเข้ม (Slate)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">ที่อยู่ไฟล์โลโก้ (Logo Path)</label>
              <input
                type="text"
                value={formData.site_logo || ''}
                onChange={(e) => handleChange('site_logo', e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs sm:text-sm focus:border-orange-500 outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">ไอคอนแท็บเบราว์เซอร์ (Favicon Path)</label>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                  <img
                    src={formData.site_favicon || '/favicon.ico'}
                    alt="Favicon"
                    className="w-6 h-6 object-contain"
                    onError={(e) => {
                      ;(e.currentTarget as HTMLImageElement).src = '/favicon.ico'
                    }}
                  />
                </div>
                <input
                  type="text"
                  placeholder="ค่าเริ่มต้น: /favicon.ico"
                  value={formData.site_favicon || ''}
                  onChange={(e) => handleChange('site_favicon', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs sm:text-sm focus:border-orange-500 outline-hidden"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Contact info */}
        <div className="space-y-4 pt-4">
          <h3 className="text-sm font-extrabold text-orange-400 uppercase tracking-wider border-b border-slate-800 pb-2">
            ข้อมูลการติดต่อและเครือข่ายสังคม
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">เบอร์โทรศัพท์ติดต่อ</label>
              <input
                type="text"
                value={formData.contact_phone || ''}
                onChange={(e) => handleChange('contact_phone', e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs sm:text-sm focus:border-orange-500 outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">อีเมลติดต่อ</label>
              <input
                type="email"
                value={formData.contact_email || ''}
                onChange={(e) => handleChange('contact_email', e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs sm:text-sm focus:border-orange-500 outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">ที่อยู่วิทยาลัย</label>
            <textarea
              rows={2}
              value={formData.contact_address || ''}
              onChange={(e) => handleChange('contact_address', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs sm:text-sm focus:border-orange-500 outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Facebook Page URL</label>
              <input
                type="text"
                value={formData.social_facebook || ''}
                onChange={(e) => handleChange('social_facebook', e.target.value)}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">LINE Official URL</label>
              <input
                type="text"
                value={formData.social_line || ''}
                onChange={(e) => handleChange('social_line', e.target.value)}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">YouTube Channel URL</label>
              <input
                type="text"
                value={formData.social_youtube || ''}
                onChange={(e) => handleChange('social_youtube', e.target.value)}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
              />
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="space-y-4 pt-4">
          <h3 className="text-sm font-extrabold text-orange-400 uppercase tracking-wider border-b border-slate-800 pb-2">
            ข้อมูลส่วนท้ายเว็บไซต์ (Footer)
          </h3>
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">คำอธิบายส่วนท้าย (Footer Description)</label>
            <textarea
              rows={2}
              value={formData.footer_desc || ''}
              onChange={(e) => handleChange('footer_desc', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs sm:text-sm focus:border-orange-500 outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">ข้อความสงวนสิทธิ์ (Copyright text)</label>
            <input
              type="text"
              value={formData.footer_text || ''}
              onChange={(e) => handleChange('footer_text', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs sm:text-sm focus:border-orange-500 outline-hidden"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่าทั้งหมด'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
