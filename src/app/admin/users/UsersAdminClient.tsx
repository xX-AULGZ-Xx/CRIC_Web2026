'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserCheck, Plus, Pencil, Trash2, Shield, X } from 'lucide-react'

interface UserRecord {
  id: number
  username: string
  email: string | null
  role: 'admin' | 'editor' | 'staff' | null
  allowed_pages: string | null
  created_at: string | null
}

const PERMISSION_MODULES = [
  { id: 'news', label: 'ข่าวสารและกิจกรรม' },
  { id: 'pages', label: 'จัดการเพจ / หน้าเว็บ' },
  { id: 'sliders', label: 'สไลด์แบนเนอร์' },
  { id: 'personnel', label: 'ทำเนียบบุคลากร & ผู้บริหาร' },
  { id: 'curriculum', label: 'หลักสูตรการศึกษา' },
  { id: 'ita', label: 'ข้อมูลประเมิน ITA' },
  { id: 'complaints', label: 'เรื่องร้องเรียน' },
  { id: 'galleries', label: 'คลังภาพกิจกรรม & สื่อ' },
  { id: 'downloads', label: 'ศูนย์ดาวน์โหลด' },
  { id: 'navbars', label: 'โครงสร้างเมนูเว็บไซต์' },
  { id: 'settings', label: 'ตั้งค่าเว็บไซต์' },
]

export function UsersAdminClient({
  initialUsers,
  currentUserId,
}: {
  initialUsers: UserRecord[]
  currentUserId: number
}) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    id: 0,
    username: '',
    email: '',
    password: '',
    role: 'staff' as 'admin' | 'editor' | 'staff',
    allowed_pages: [] as string[],
  })

  const parseAllowed = (raw: string | null): string[] => {
    if (!raw) return []
    try {
      const p = JSON.parse(raw)
      if (Array.isArray(p)) return p
    } catch {
      return raw.split(',').map((s) => s.trim()).filter(Boolean)
    }
    return []
  }

  const openCreate = () => {
    setForm({
      id: 0,
      username: '',
      email: '',
      password: '',
      role: 'staff',
      allowed_pages: ['news', 'galleries', 'downloads'],
    })
    setModalOpen(true)
  }

  const openEdit = (u: UserRecord) => {
    setForm({
      id: u.id,
      username: u.username,
      email: u.email || '',
      password: '',
      role: u.role || 'staff',
      allowed_pages: parseAllowed(u.allowed_pages),
    })
    setModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'users',
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
    if (!confirm('ยืนยันการลบบัญชีผู้ใช้งานนี้?')) return
    const res = await fetch('/api/admin/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ module: 'users', action: 'delete', data: { id } }),
    })
    const json = await res.json()
    if (!res.ok) {
      alert(json.error || 'ไม่สามารถลบได้')
      return
    }
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-indigo-600" />
            จัดการผู้ใช้งานและกำหนดสิทธิ์ (Users & Permissions)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            เพิ่มบัญชีผู้ดูแลระบบ เจ้าหน้าที่ และกำหนดสิทธิ์การเข้าถึงแต่ละเมนูย่อย
          </p>
        </div>

        <button
          onClick={openCreate}
          className="inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          เพิ่มผู้ใช้งานใหม่
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {initialUsers.map((u) => {
          const perms = parseAllowed(u.allowed_pages)
          return (
            <div
              key={u.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-base font-bold uppercase shrink-0">
                      {u.username.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-slate-800 text-base truncate">
                          {u.username}
                        </h3>
                        {u.id === currentUserId && (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700 rounded-full shrink-0">
                            คุณ
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate">{u.email || 'ไม่ระบุอีเมล'}</p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase shrink-0 ${
                      u.role === 'admin'
                        ? 'bg-indigo-100 text-indigo-700'
                        : u.role === 'editor'
                        ? 'bg-sky-100 text-sky-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {u.role || 'staff'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <div className="font-semibold text-slate-500 mb-1.5">สิทธิ์การเข้าถึงเมนู:</div>
                  {u.role === 'admin' ? (
                    <div className="text-emerald-700 font-semibold flex items-center gap-1.5">
                      <Shield className="w-4 h-4" /> เข้าถึงได้ทุกส่วนของระบบ (Full Access)
                    </div>
                  ) : perms.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {perms.map((pId) => {
                        const mod = PERMISSION_MODULES.find((m) => m.id === pId)
                        return (
                          <span
                            key={pId}
                            className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[11px] font-medium"
                          >
                            {mod?.label || pId}
                          </span>
                        )
                      })}
                    </div>
                  ) : (
                    <span className="text-slate-400">ตามสิทธิ์มาตรฐาน</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-3 border-t border-slate-100">
                <button
                  onClick={() => openEdit(u)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl cursor-pointer transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" /> แก้ไขสิทธิ์ / รหัสผ่าน
                </button>
                {u.id !== currentUserId && (
                  <button
                    onClick={() => handleDelete(u.id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-xl cursor-pointer transition-colors"
                    title="ลบบัญชีผู้ใช้"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 w-full max-w-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800">
                {form.id ? `แก้ไขผู้ใช้งาน: ${form.username}` : 'เพิ่มผู้ใช้งานใหม่'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    อีเมล (Email) *
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    {form.id ? 'รหัสผ่านใหม่ (เว้นว่างหากไม่เปลี่ยน)' : 'รหัสผ่าน *'}
                  </label>
                  <input
                    type="password"
                    required={!form.id}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    ระดับสิทธิ์ผู้ใช้งาน
                  </label>
                  <select
                    value={form.role}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        role: e.target.value as 'admin' | 'editor' | 'staff',
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                  >
                    <option value="admin">Admin (ผู้ดูแลระบบสูงสุด)</option>
                    <option value="editor">Editor (ผู้จัดการเนื้อหา)</option>
                    <option value="staff">Staff (เจ้าหน้าที่เฉพาะส่วน)</option>
                  </select>
                </div>
              </div>

              {form.role !== 'admin' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    กำหนดสิทธิ์การเข้าถึงเมนู
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    {PERMISSION_MODULES.map((m) => (
                      <label
                        key={m.id}
                        className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={form.allowed_pages.includes(m.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setForm({
                                ...form,
                                allowed_pages: [...form.allowed_pages, m.id],
                              })
                            } else {
                              setForm({
                                ...form,
                                allowed_pages: form.allowed_pages.filter(
                                  (id) => id !== m.id
                                ),
                              })
                            }
                          }}
                        />
                        {m.label}
                      </label>
                    ))}
                  </div>
                </div>
              )}

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
                  {saving ? 'กำลังบันทึก...' : 'บันทึกผู้ใช้งาน'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
