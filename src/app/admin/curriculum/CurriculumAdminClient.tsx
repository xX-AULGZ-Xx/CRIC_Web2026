'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Compass,
  FileText,
  Upload,
  Loader2,
  Users,
} from 'lucide-react'
import { AdminUploadField } from '../AdminMediaPicker'
import CKEditorField from '../CKEditorField'
import { normalizeImageUrl } from '@/lib/url-helper'
import { swalConfirm, swalSuccess, swalError } from '@/lib/sweetalert'

interface CurriculumItem {
  id: number
  name: string
  level: string | null
  code: string | null
  description: string | null
  qualification: string | null
  duration: string | null
  image_path: string | null
  file_path: string | null
  website_url: string | null
  gallery_images: string | null
  career_guidelines: string | null
}

interface TeacherOption {
  id: number
  name: string
  position: string
  curriculum_id: number | null
}

export function CurriculumAdminClient({
  curriculums,
  teachers,
  introTitle,
  introDesc,
  parentNavbars,
}: {
  curriculums: CurriculumItem[]
  teachers: TeacherOption[]
  introTitle: string
  introDesc: string
  parentNavbars: Array<{ id: number; label: string }>
}) {
  const router = useRouter()
  const [filterLevel, setFilterLevel] = useState('all')
  const [titleSetting, setTitleSetting] = useState(introTitle)
  const [descSetting, setDescSetting] = useState(introDesc)
  const [savingIntro, setSavingIntro] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [navModalOpen, setNavModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingGallery, setUploadingGallery] = useState(false)

  const [navForm, setNavForm] = useState({
    label: '',
    url: '/curriculum',
    parent_id: '',
    order_num: 1,
  })

  const [form, setForm] = useState({
    id: 0,
    name: '',
    level: 'ปวช.-ปวส.',
    code: '',
    description: '',
    qualification: '',
    duration: '',
    image_path: '',
    file_path: '',
    website_url: '',
    gallery_images: [] as string[],
    career_guidelines: '',
    teacher_ids: [] as number[],
  })

  const openCreate = () => {
    setForm({
      id: 0,
      name: '',
      level: 'ปวช.-ปวส.',
      code: '',
      description: '',
      qualification: '',
      duration: '',
      image_path: '',
      file_path: '',
      website_url: '',
      gallery_images: [],
      career_guidelines: '',
      teacher_ids: [],
    })
    setModalOpen(true)
  }

  const openEdit = (c: CurriculumItem) => {
    const imgs = (c.gallery_images || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    const assignedTeachers = teachers
      .filter((t) => t.curriculum_id === c.id)
      .map((t) => t.id)

    setForm({
      id: c.id,
      name: c.name || '',
      level: c.level || 'ปวช.-ปวส.',
      code: c.code || '',
      description: c.description || '',
      qualification: c.qualification || '',
      duration: c.duration || '',
      image_path: c.image_path || '',
      file_path: c.file_path || '',
      website_url: c.website_url || '',
      gallery_images: imgs,
      career_guidelines: c.career_guidelines || '',
      teacher_ids: assignedTeachers,
    })
    setModalOpen(true)
  }

  const handleSaveIntro = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingIntro(true)
    try {
      const res = await fetch('/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'curriculum',
          action: 'save_intro',
          data: {
            curriculum_intro_title: titleSetting,
            curriculum_intro_desc: descSetting,
          },
        }),
      })
      if (res.ok) {
        swalSuccess('สำเร็จ', 'บันทึกข้อความเกริ่นนำหน้าหลักสูตรเรียบร้อยแล้ว')
        router.refresh()
      }
    } finally {
      setSavingIntro(false)
    }
  }

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploadingGallery(true)
    try {
      const fd = new FormData()
      fd.append('folder', 'curriculum')
      for (let i = 0; i < files.length; i++) {
        fd.append('files', files[i])
      }
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Upload failed')
      const paths = (json.files || []).map((f: any) => f.path)
      setForm((prev) => ({
        ...prev,
        gallery_images: [...prev.gallery_images, ...paths],
      }))
    } catch (err: any) {
      swalError('อัปโหลดรูปภาพไม่สำเร็จ', err.message)
    } finally {
      setUploadingGallery(false)
      e.target.value = ''
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'curriculum',
          action: 'save',
          data: form,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'บันทึกไม่สำเร็จ')
      setModalOpen(false)
      router.refresh()
    } catch (err: any) {
      swalError('บันทึกไม่สำเร็จ', err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    const ok = await swalConfirm({
      title: 'ยืนยันการลบหลักสูตร?',
      text: 'ข้อมูลหลักสูตรและรูปภาพประกอบจะถูกลบออกจากระบบ',
      confirmButtonText: 'ลบหลักสูตร',
    })
    if (!ok) return
    const res = await fetch('/api/admin/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ module: 'curriculum', action: 'delete', data: { id } }),
    })
    if (res.ok) router.refresh()
  }

  const handleAddToNavbar = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/admin/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        module: 'curriculum',
        action: 'add_to_navbar',
        data: {
          ...navForm,
          parent_id: navForm.parent_id ? Number(navForm.parent_id) : null,
        },
      }),
    })
    if (res.ok) {
      swalSuccess('สำเร็จ', 'เพิ่มลิงก์หลักสูตรเข้าสู่เมนูเว็บไซต์เรียบร้อยแล้ว')
      setNavModalOpen(false)
      router.refresh()
    }
  }

  const filtered = curriculums.filter(
    (c) => filterLevel === 'all' || c.level === filterLevel
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-600" />
            จัดการหลักสูตรการศึกษา ({curriculums.length} หลักสูตร)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            บริหารจัดการข้อมูลหลักสูตรที่เปิดสอน เอกสารโครงสร้างหลักสูตร แนวทางอาชีพ และอาจารย์ประจำหลักสูตร
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          เพิ่มหลักสูตรใหม่
        </button>
      </div>

      {/* Intro Text Settings */}
      <form
        onSubmit={handleSaveIntro}
        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">
            ตั้งค่าข้อความส่วนหัวหน้าแสดงหลักสูตร (Intro Banner)
          </h2>
          <button
            type="submit"
            disabled={savingIntro}
            className="inline-flex items-center px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            {savingIntro ? 'กำลังบันทึก...' : 'บันทึกข้อความส่วนหัว'}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            value={titleSetting}
            onChange={(e) => setTitleSetting(e.target.value)}
            placeholder="หัวข้อหลักหน้าหลักสูตร เช่น หลักสูตรที่เปิดสอน"
            className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800"
          />
          <input
            type="text"
            value={descSetting}
            onChange={(e) => setDescSetting(e.target.value)}
            placeholder="คำอธิบายย่อยหน้าหลักสูตร..."
            className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800"
          />
        </div>
      </form>

      {/* Level Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {['all', 'ปวช.', 'ปวส.', 'ปวช.-ปวส.', 'ปริญญาตรี', 'หลักสูตรระยะสั้น'].map((lvl) => (
          <button
            key={lvl}
            onClick={() => setFilterLevel(lvl)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              filterLevel === lvl
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {lvl === 'all' ? 'ทั้งหมด' : lvl}
          </button>
        ))}
      </div>

      {/* Curriculum Card Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 shadow-sm">
          ไม่พบรายการหลักสูตร
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((c) => {
            const teacherCount = teachers.filter((t) => t.curriculum_id === c.id).length
            return (
              <div
                key={c.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all overflow-hidden flex flex-col group"
              >
                <div className="aspect-video bg-slate-100 relative overflow-hidden">
                  {c.image_path ? (
                    <img
                      src={normalizeImageUrl(c.image_path)}
                      alt={c.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1">
                      <BookOpen className="w-8 h-8 opacity-40" />
                      <span className="text-xs">ไม่มีภาพปก</span>
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-sm">
                      {c.level || 'ปวช.-ปวส.'}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 bg-white/95 px-2.5 py-1 rounded-full shadow-sm">
                      <Users className="w-3.5 h-3.5" /> {teacherCount} ท่าน
                    </span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-bold text-slate-800 line-clamp-2 leading-snug">
                      {c.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      {c.code && (
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                          รหัส: {c.code}
                        </span>
                      )}
                      {c.duration && <span>ระยะเวลา: {c.duration}</span>}
                      {c.file_path && (
                        <span className="text-red-600 font-semibold inline-flex items-center gap-0.5 bg-red-50 px-2 py-0.5 rounded">
                          <FileText className="w-3 h-3" /> มีไฟล์หลักสูตร PDF
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        setNavForm({
                          label: c.name,
                          url: `/curriculum`,
                          parent_id: '',
                          order_num: 1,
                        })
                        setNavModalOpen(true)
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-xl cursor-pointer"
                      title="เพิ่มเข้าเมนูเว็บไซต์"
                    >
                      <Compass className="w-3.5 h-3.5" /> ส่งเข้าเมนู
                    </button>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEdit(c)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" /> แก้ไข
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> ลบ
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-slate-800 text-lg">
                {form.id ? `แก้ไขหลักสูตร: ${form.name}` : 'เพิ่มหลักสูตรการศึกษาใหม่'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    ชื่อหลักสูตร / สาขาวิชา *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="เช่น สาขาวิชาเทคโนโลยีธุรกิจดิจิทัล"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    ระดับการศึกษา *
                  </label>
                  <select
                    value={form.level}
                    onChange={(e) => setForm({ ...form, level: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800"
                  >
                    <option value="ปวช.">ปวช.</option>
                    <option value="ปวส.">ปวส.</option>
                    <option value="ปวช.-ปวส.">ปวช.-ปวส.</option>
                    <option value="ปริญญาตรี">ปริญญาตรี (ทล.บ.)</option>
                    <option value="หลักสูตรระยะสั้น">หลักสูตรระยะสั้น / พิเศษ</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    รหัสหลักสูตร
                  </label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    placeholder="เช่น 20204 / 30204"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    คุณสมบัติผู้สมัคร
                  </label>
                  <input
                    type="text"
                    value={form.qualification}
                    onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                    placeholder="เช่น จบ ม.3 หรือเทียบเท่า"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    ระยะเวลาศึกษา
                  </label>
                  <input
                    type="text"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    placeholder="เช่น 3 ปี / 2 ปี"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800"
                  />
                </div>
              </div>

              <AdminUploadField
                label="รูปภาพปกหลักสูตร"
                value={form.image_path}
                onChange={(path) => setForm({ ...form, image_path: path })}
                folder="curriculum"
              />

              <AdminUploadField
                label="ไฟล์เอกสารเล่มหลักสูตร (PDF)"
                value={form.file_path}
                onChange={(path) => setForm({ ...form, file_path: path })}
                folder="curriculum"
                accept=".pdf,application/pdf"
                previewImage={false}
              />

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  คำอธิบายรายละเอียดหลักสูตร (CKEditor)
                </label>
                <CKEditorField
                  value={form.description}
                  onChange={(html) => setForm((prev) => ({ ...prev, description: html }))}
                  height={320}
                  placeholder="ระบุรายละเอียดหลักสูตร..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  แนวทางการประกอบอาชีพหลังสำเร็จการศึกษา
                </label>
                <textarea
                  rows={3}
                  value={form.career_guidelines}
                  onChange={(e) => setForm({ ...form, career_guidelines: e.target.value })}
                  placeholder="ระบุอาชีพแยกบรรทัด..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800"
                />
              </div>

              {/* Gallery Atmosphere Photos */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-semibold text-slate-700">
                    ภาพบรรยากาศการเรียนการสอน ({form.gallery_images.length} รูป)
                  </label>
                  <label className="inline-flex items-center px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-200 cursor-pointer">
                    {uploadingGallery ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> กำลังอัปโหลด...
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5 mr-1" /> อัปโหลดภาพบรรยากาศ
                      </>
                    )}
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleGalleryUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                {form.gallery_images.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    {form.gallery_images.map((img, i) => (
                      <div
                        key={i}
                        className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 bg-white"
                      >
                        <img
                          src={normalizeImageUrl(img)}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setForm({
                              ...form,
                              gallery_images: form.gallery_images.filter((_, idx) => idx !== i),
                            })
                          }
                          className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Teacher Assignment */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  เลือกอาจารย์ประจำหลักสูตร ({form.teacher_ids.length} ท่าน)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-3 bg-slate-50 rounded-xl border border-slate-200">
                  {teachers.map((t) => (
                    <label
                      key={t.id}
                      className="flex items-center gap-2 text-xs text-slate-700 bg-white p-2 rounded-lg border border-slate-200 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={form.teacher_ids.includes(t.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setForm({ ...form, teacher_ids: [...form.teacher_ids, t.id] })
                          } else {
                            setForm({
                              ...form,
                              teacher_ids: form.teacher_ids.filter((id) => id !== t.id),
                            })
                          }
                        }}
                      />
                      <span className="truncate">
                        {t.name} ({t.position})
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm bg-slate-100 text-slate-600 rounded-xl cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-xl cursor-pointer"
                >
                  {saving ? 'กำลังบันทึก...' : 'บันทึกหลักสูตร'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Navbar Modal */}
      {navModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">เพิ่มหลักสูตรลงในเมนูเว็บไซต์</h3>
              <button
                onClick={() => setNavModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddToNavbar} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  ชื่อเมนู
                </label>
                <input
                  type="text"
                  required
                  value={navForm.label}
                  onChange={(e) => setNavForm({ ...navForm, label: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  อยู่ภายใต้เมนูหลัก
                </label>
                <select
                  value={navForm.parent_id}
                  onChange={(e) => setNavForm({ ...navForm, parent_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                >
                  <option value="">-- เมนูหลักด้านบนสุด --</option>
                  {parentNavbars.map((n) => (
                    <option key={n.id} value={String(n.id)}>
                      {n.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNavModalOpen(false)}
                  className="px-4 py-2 text-sm bg-slate-100 text-slate-600 rounded-xl cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-xl cursor-pointer"
                >
                  เพิ่มลงเมนู
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
