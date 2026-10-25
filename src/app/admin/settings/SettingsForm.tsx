'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Settings,
  Save,
  Palette,
  Phone,
  Megaphone,
  ShieldAlert,
  Cloud,
  LayoutGrid,
  CheckCircle2,
} from 'lucide-react'
import { AdminUploadField } from '../AdminMediaPicker'

const THEME_COLORS = [
  { id: 'indigo', label: 'Indigo (คราม)', bg: 'bg-indigo-600' },
  { id: 'blue', label: 'Blue (น้ำเงิน)', bg: 'bg-blue-600' },
  { id: 'sky', label: 'Sky (ฟ้า)', bg: 'bg-sky-500' },
  { id: 'cyan', label: 'Cyan (ฟ้าน้ำทะเล)', bg: 'bg-cyan-600' },
  { id: 'teal', label: 'Teal (เขียวอมฟ้า)', bg: 'bg-teal-600' },
  { id: 'emerald', label: 'Emerald (เขียวมรกต)', bg: 'bg-emerald-600' },
  { id: 'green', label: 'Green (เขียว)', bg: 'bg-green-600' },
  { id: 'amber', label: 'Amber (เหลืองอำพัน)', bg: 'bg-amber-500' },
  { id: 'orange', label: 'Orange (ส้ม)', bg: 'bg-orange-500' },
  { id: 'red', label: 'Red (แดง)', bg: 'bg-red-600' },
  { id: 'rose', label: 'Rose (ชมพูกุหลาบ)', bg: 'bg-rose-600' },
  { id: 'pink', label: 'Pink (ชมพู)', bg: 'bg-pink-600' },
  { id: 'purple', label: 'Purple (ม่วง)', bg: 'bg-purple-600' },
  { id: ' violet', label: 'Violet (ม่วงไวโอเล็ต)', bg: 'bg-violet-600' },
  { id: 'slate', label: 'Slate (เทาเข้มทางการ)', bg: 'bg-slate-700' },
]

export function SettingsForm({
  initialSettings,
}: {
  initialSettings: Record<string, string>
}) {
  const router = useRouter()
  const [form, setForm] = useState<Record<string, string>>({
    site_name: '',
    site_description: '',
    site_logo: '',
    theme_color: 'indigo',
    show_navbar_icons: '1',
    mourning_ribbon: '0',
    show_login_button: '1',
    maintenance_mode: '0',
    maintenance_pages: '',
    maintenance_message: 'ระบบกำลังอยู่ระหว่างการปรับปรุงชั่วคราว ขออภัยในความไม่สะดวก',
    complaint_title: 'ศูนย์รับเรื่องร้องเรียนและแจ้งเบาะแสการทุจริต',
    complaint_description: 'ข้อมูลของท่านจะถูกเก็บเป็นความลับสูงสุดตามมาตรการคุ้มครองผู้แจ้งเบาะแส',
    contact_address: '',
    contact_phone: '',
    contact_email: '',
    google_map_embed: '',
    facebook_url: '',
    youtube_url: '',
    line_id: '',
    tiktok_url: '',
    popup_enabled: '0',
    popup_image: '',
    popup_link: '',
    pdpa_enabled: '1',
    pdpa_text: 'เว็บไซต์นี้ใช้คุกกี้เพื่อพัฒนาประสบการณ์การใช้งานของท่านตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล (PDPA)',
    footer_description: '',
    footer_powered_by: '',
    immich_server_url: '',
    immich_api_key: '',
    ...initialSettings,
  })

  const [saving, setSaving] = useState(false)
  const [savedToast, setSavedToast] = useState(false)

  const setVal = (key: string, val: string) => {
    setForm((prev) => ({ ...prev, [key]: val }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSavedToast(false)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: form }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'บันทึกไม่สำเร็จ')
      setSavedToast(true)
      setTimeout(() => setSavedToast(false), 3000)
      router.refresh()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Sticky Top Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Settings className="w-6 h-6 text-indigo-600" />
            ตั้งค่าเว็บไซต์และการแสดงผล (Site Configuration)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            ปรับแต่งข้อมูลสถานศึกษา โลโก้ โทนสี ธีม ป๊อปอัปหน้าแรก ข้อมูลติดต่อ และระบบเชื่อมต่อภายนอก
          </p>
        </div>

        <div className="flex items-center gap-3">
          {savedToast && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-xl">
              <CheckCircle2 className="w-4 h-4" /> บันทึกสำเร็จแล้ว
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่าทั้งหมด'}
          </button>
        </div>
      </div>

      {/* 1. General & Theme */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <h2 className="font-bold text-slate-800 flex items-center gap-2 text-base pb-3 border-b border-slate-100">
          <Palette className="w-5 h-5 text-indigo-600" />
          1. ข้อมูลพื้นฐาน โลโก้ และโทนสีเว็บไซต์
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              ชื่อเว็บไซต์ / ชื่อสถานศึกษา
            </label>
            <input
              type="text"
              value={form.site_name || ''}
              onChange={(e) => setVal('site_name', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              คำอธิบายเว็บไซต์ (Site Description / Subtitle)
            </label>
            <input
              type="text"
              value={form.site_description || ''}
              onChange={(e) => setVal('site_description', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800"
            />
          </div>
        </div>

        <AdminUploadField
          label="โลโก้สถานศึกษา (Site Logo)"
          value={form.site_logo || ''}
          onChange={(path) => setVal('site_logo', path)}
          folder="settings"
        />

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            โทนสีหลักของเว็บไซต์ (Theme Color)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {THEME_COLORS.map((c) => {
              const selected = (form.theme_color || 'indigo').trim() === c.id.trim()
              return (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setVal('theme_color', c.id.trim())}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                    selected
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full shrink-0 ${c.bg}`} />
                  <span className="truncate">{c.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.show_navbar_icons !== '0'}
              onChange={(e) => setVal('show_navbar_icons', e.target.checked ? '1' : '0')}
              className="w-4 h-4 rounded text-indigo-600"
            />
            <span>แสดงไอคอนหน้าเมนูหลัก (Navbar Icons)</span>
          </label>

          <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.mourning_ribbon === '1'}
              onChange={(e) => setVal('mourning_ribbon', e.target.checked ? '1' : '0')}
              className="w-4 h-4 rounded text-indigo-600"
            />
            <span>แสดงริบบิ้นไว้อาลัยมุมบนขวา</span>
          </label>

          <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.show_login_button !== '0'}
              onChange={(e) => setVal('show_login_button', e.target.checked ? '1' : '0')}
              className="w-4 h-4 rounded text-indigo-600"
            />
            <span>แสดงปุ่มเข้าสู่ระบบผู้ดูแลบนแถบเมนู</span>
          </label>
        </div>
      </div>

      {/* 2. Contact & Social Links */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <h2 className="font-bold text-slate-800 flex items-center gap-2 text-base pb-3 border-b border-slate-100">
          <Phone className="w-5 h-5 text-indigo-600" />
          2. ข้อมูลการติดต่อ โซเชียลมีเดีย และแผนที่
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-3">
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              ที่อยู่สถานศึกษา
            </label>
            <input
              type="text"
              value={form.contact_address || ''}
              onChange={(e) => setVal('contact_address', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              เบอร์โทรศัพท์ติดต่อ
            </label>
            <input
              type="text"
              value={form.contact_phone || ''}
              onChange={(e) => setVal('contact_phone', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              อีเมลติดต่อ (Email)
            </label>
            <input
              type="text"
              value={form.contact_email || ''}
              onChange={(e) => setVal('contact_email', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Facebook Page URL
            </label>
            <input
              type="text"
              value={form.facebook_url || ''}
              onChange={(e) => setVal('facebook_url', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              YouTube Channel URL
            </label>
            <input
              type="text"
              value={form.youtube_url || ''}
              onChange={(e) => setVal('youtube_url', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              LINE Official ID / URL
            </label>
            <input
              type="text"
              value={form.line_id || ''}
              onChange={(e) => setVal('line_id', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              TikTok URL
            </label>
            <input
              type="text"
              value={form.tiktok_url || ''}
              onChange={(e) => setVal('tiktok_url', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            โค้ดฝังแผนที่ Google Maps (Iframe Embed URL หรือ HTML)
          </label>
          <textarea
            rows={3}
            value={form.google_map_embed || ''}
            onChange={(e) => setVal('google_map_embed', e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono text-slate-800"
          />
        </div>
      </div>

      {/* 3. Popup Banner & PDPA */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <h2 className="font-bold text-slate-800 flex items-center gap-2 text-base pb-3 border-b border-slate-100">
          <Megaphone className="w-5 h-5 text-indigo-600" />
          3. ป๊อปอัปประกาศหน้าแรก (Popup Modal) & แถบคุกกี้ PDPA
        </h2>

        <label className="flex items-center gap-2.5 text-sm font-semibold text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={form.popup_enabled === '1'}
            onChange={(e) => setVal('popup_enabled', e.target.checked ? '1' : '0')}
            className="w-4 h-4 rounded text-indigo-600"
          />
          <span>เปิดใช้งานป๊อปอัปแสดงภาพประกาศเมื่อเข้าสู่หน้าแรก</span>
        </label>

        <AdminUploadField
          label="รูปภาพป๊อปอัปหน้าแรก (Popup Image)"
          value={form.popup_image || ''}
          onChange={(path) => setVal('popup_image', path)}
          folder="settings"
        />

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            ลิงก์เมื่อคลิกที่ภาพป๊อปอัป (Popup Link URL)
          </label>
          <input
            type="text"
            value={form.popup_link || ''}
            onChange={(e) => setVal('popup_link', e.target.value)}
            placeholder="https://... หรือเว้นว่าง"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800"
          />
        </div>

        <div className="pt-3 border-t border-slate-100 space-y-3">
          <label className="flex items-center gap-2.5 text-sm font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.pdpa_enabled !== '0'}
              onChange={(e) => setVal('pdpa_enabled', e.target.checked ? '1' : '0')}
              className="w-4 h-4 rounded text-indigo-600"
            />
            <span>แสดงแถบแจ้งเตือนการใช้คุกกี้ (PDPA Consent Banner)</span>
          </label>
          <input
            type="text"
            value={form.pdpa_text || ''}
            onChange={(e) => setVal('pdpa_text', e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800"
          />
        </div>
      </div>

      {/* 4. Footer & 6 Quick Links */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <h2 className="font-bold text-slate-800 flex items-center gap-2 text-base pb-3 border-b border-slate-100">
          <LayoutGrid className="w-5 h-5 text-orange-600" />
          4. ส่วนท้ายเว็บไซต์ (Footer) และลิงก์ด่วน 6 รายการ
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              ข้อความแนะนำส่วนท้ายเว็บ (Footer Description)
            </label>
            <textarea
              rows={2}
              value={form.footer_desc !== undefined ? form.footer_desc : (form.footer_description || '')}
              onChange={(e) => {
                setVal('footer_desc', e.target.value)
                setVal('footer_description', e.target.value)
              }}
              placeholder="ข้อความแนะนำวิทยาลัยส่วนท้ายเว็บ..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 outline-none focus:bg-white focus:border-orange-500 transition resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              ข้อความลิขสิทธิ์ / ผู้พัฒนา (Powered By)
            </label>
            <input
              type="text"
              value={form.footer_powered_by || ''}
              onChange={(e) => setVal('footer_powered_by', e.target.value)}
              placeholder="เช่น Powered by งานศูนย์ดิจิทัลและสื่อสารองค์กร..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 outline-none focus:bg-white focus:border-orange-500 transition"
            />
            <p className="text-xs text-slate-400 mt-1.5">
              แสดงข้อความลิขสิทธิ์และทีมพัฒนาดิจิทัลด้านล่างสุดของเว็บไซต์
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-100 pb-2">
            <label className="block text-sm font-bold text-slate-800">
              ลิงก์ด่วนส่วนท้ายเว็บไซต์ (Quick Links - 6 รายการ)
            </label>
            <span className="text-xs text-slate-400">
              แสดง 2 คอลัมน์ในส่วนท้ายของทุกหน้าเว็บ (Footer)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((num) => {
              const defaultLabel =
                num === 1
                  ? 'เกี่ยวกับวิทยาลัย'
                  : num === 2
                  ? 'สาขาวิชาที่เปิดสอน'
                  : num === 3
                  ? 'ทำเนียบบุคลากร'
                  : num === 4
                  ? 'ข่าวสารประชาสัมพันธ์'
                  : num === 5
                  ? 'คลังรูปกิจกรรม'
                  : 'ศูนย์ดาวน์โหลด'

              const defaultUrl =
                num === 1
                  ? '/about'
                  : num === 2
                  ? '/curriculum'
                  : num === 3
                  ? '/personnel'
                  : num === 4
                  ? '/news'
                  : num === 5
                  ? '/gallery'
                  : '/downloads'

              const currentLabel =
                form[`footer_link_${num}_label`] !== undefined
                  ? form[`footer_link_${num}_label`]
                  : form[`footer_link_${num}_title`] !== undefined
                  ? form[`footer_link_${num}_title`]
                  : defaultLabel

              const currentUrl =
                form[`footer_link_${num}_url`] !== undefined
                  ? form[`footer_link_${num}_url`]
                  : defaultUrl

              return (
                <div
                  key={num}
                  className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3 hover:border-orange-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-orange-600 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-[11px] font-bold">
                        {num}
                      </span>
                      ลิงก์ด่วนที่ {num}
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      ข้อความบนลิงก์ (Label)
                    </label>
                    <input
                      type="text"
                      value={currentLabel}
                      onChange={(e) => {
                        const val = e.target.value
                        setVal(`footer_link_${num}_label`, val)
                        setVal(`footer_link_${num}_title`, val)
                      }}
                      placeholder={`เช่น ${defaultLabel}`}
                      className="w-full bg-white border border-slate-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      ลิงก์ปลายทาง (URL)
                    </label>
                    <input
                      type="text"
                      value={currentUrl}
                      onChange={(e) => setVal(`footer_link_${num}_url`, e.target.value)}
                      placeholder={`เช่น ${defaultUrl}`}
                      className="w-full bg-white border border-slate-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-mono transition"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 5. Maintenance Mode & Immich */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="font-bold text-slate-800 flex items-center gap-2 text-base pb-3 border-b border-slate-100">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            5. โหมดปิดปรับปรุงเว็บไซต์ (Maintenance Mode)
          </h2>

          <label className="flex items-center gap-2.5 text-sm font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.maintenance_mode === '1'}
              onChange={(e) => setVal('maintenance_mode', e.target.checked ? '1' : '0')}
              className="w-4 h-4 rounded text-amber-600"
            />
            <span>เปิดโหมดปิดปรับปรุงระบบชั่วคราว</span>
          </label>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              ข้อความแจ้งเตือนขณะปิดปรับปรุง
            </label>
            <textarea
              rows={3}
              value={form.maintenance_message || ''}
              onChange={(e) => setVal('maintenance_message', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm"
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="font-bold text-slate-800 flex items-center gap-2 text-base pb-3 border-b border-slate-100">
            <Cloud className="w-5 h-5 text-indigo-600" />
            6. เชื่อมต่อคลังภาพ Immich Server
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Immich Server URL
            </label>
            <input
              type="text"
              value={form.immich_server_url || ''}
              onChange={(e) => setVal('immich_server_url', e.target.value)}
              placeholder="https://photos.example.com"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Immich API Key
            </label>
            <input
              type="password"
              value={form.immich_api_key || ''}
              onChange={(e) => setVal('immich_api_key', e.target.value)}
              placeholder="ระบุ API Key สำหรับดึงอัลบั้มภาพ"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
            />
          </div>
        </div>
      </div>
    </form>
  )
}
