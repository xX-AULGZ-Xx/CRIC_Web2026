'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  X,
  Search,
  Upload,
  Download,
  Award,
  Star,
} from 'lucide-react'
import { AdminUploadField } from '../AdminMediaPicker'
import { normalizeImageUrl } from '@/lib/url-helper'

interface CategoryOption {
  id: number
  name: string
  parent_id: number | null
}

interface PositionOption {
  id: number
  name: string
}

interface CurriculumOption {
  id: number
  name: string
}

interface SpecialDutyItem {
  id?: number
  category_id: number
  special_position: string
  is_head: boolean
}

interface PersonnelItem {
  id: number
  name: string
  academic_standing: string | null
  position: string
  special_duty: string | null
  category_id: number | null
  curriculum_id: number | null
  details: string | null
  contact_info: string | null
  image_path: string | null
  order_num: number | null
  is_active: boolean | null
  is_head: boolean | null
  is_executive: boolean | null
  personnel_categories?: { id: number; name: string } | null
  personnel_position_links?: Array<{ position_id: number }>
  personnel_special_duties?: Array<{
    id: number
    category_id: number
    special_position: string | null
    is_head: boolean | null
  }>
}

export function PersonnelAdminClient({
  initialPersonnel,
  categories,
  positions,
  curriculums,
}: {
  initialPersonnel: PersonnelItem[]
  categories: CategoryOption[]
  positions: PositionOption[]
  curriculums: CurriculumOption[]
}) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [csvModalOpen, setCsvModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [csvText, setCsvText] = useState('')

  const [form, setForm] = useState({
    id: 0,
    name: '',
    academic_standing: '',
    position: '',
    special_duty: '',
    category_id: '',
    curriculum_id: '',
    details_tab1: '',
    details_tab2: '',
    contact_info: '',
    image_path: '',
    order_num: 1,
    is_active: true,
    is_head: false,
    is_executive: false,
    position_ids: [] as number[],
    special_duties: [] as SpecialDutyItem[],
  })

  const openCreate = () => {
    setForm({
      id: 0,
      name: '',
      academic_standing: '',
      position: positions[0]?.name || 'ครู',
      special_duty: '',
      category_id: categories[0]?.id ? String(categories[0].id) : '',
      curriculum_id: '',
      details_tab1: '',
      details_tab2: '',
      contact_info: '',
      image_path: '',
      order_num: initialPersonnel.length + 1,
      is_active: true,
      is_head: false,
      is_executive: false,
      position_ids: [],
      special_duties: [],
    })
    setModalOpen(true)
  }

  const openEdit = (p: PersonnelItem) => {
    const parts = (p.details || '').split('\n---\n')
    setForm({
      id: p.id,
      name: p.name || '',
      academic_standing: p.academic_standing || '',
      position: p.position || '',
      special_duty: p.special_duty || '',
      category_id: p.category_id ? String(p.category_id) : '',
      curriculum_id: p.curriculum_id ? String(p.curriculum_id) : '',
      details_tab1: parts[0] || '',
      details_tab2: parts.slice(1).join('\n---\n') || '',
      contact_info: p.contact_info || '',
      image_path: p.image_path || '',
      order_num: p.order_num ?? 0,
      is_active: Boolean(p.is_active ?? true),
      is_head: Boolean(p.is_head ?? false),
      is_executive: Boolean(p.is_executive ?? false),
      position_ids: p.personnel_position_links?.map((l) => l.position_id) || [],
      special_duties:
        p.personnel_special_duties?.map((d) => ({
          id: d.id,
          category_id: d.category_id,
          special_position: d.special_position || '',
          is_head: Boolean(d.is_head ?? false),
        })) || [],
    })
    setModalOpen(true)
  }

  const togglePositionId = (posId: number) => {
    setForm((prev) => {
      const exists = prev.position_ids.includes(posId)
      return {
        ...prev,
        position_ids: exists
          ? prev.position_ids.filter((id) => id !== posId)
          : [...prev.position_ids, posId],
      }
    })
  }

  const addSpecialDutyRow = () => {
    setForm((prev) => ({
      ...prev,
      special_duties: [
        ...prev.special_duties,
        {
          category_id: categories[0]?.id || 0,
          special_position: 'เจ้าหน้าที่ประจำฝ่าย',
          is_head: false,
        },
      ],
    }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      alert('กรุณาระบุชื่อ-นามสกุลบุคลากร')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'personnel',
          action: 'save',
          data: {
            ...form,
            category_id: form.category_id ? Number(form.category_id) : null,
            curriculum_id: form.curriculum_id ? Number(form.curriculum_id) : null,
          },
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
    if (!confirm('ยืนยันการลบข้อมูลบุคลากรนี้?')) return
    const res = await fetch('/api/admin/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ module: 'personnel', action: 'delete', data: { id } }),
    })
    if (res.ok) router.refresh()
  }

  const downloadCsvTemplate = () => {
    const csv =
      '\uFEFFname,position,academic_standing,contact_info,order_num\nนายสมชาย ใจดี,ครู,ครูชำนาญการ,081-234-5678,1\nนางสาวสมหญิง รักเรียน,ครูผู้ช่วย,,089-876-5432,2'
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'personnel_template.csv'
    a.click()
  }

  const handleImportCsv = async (e: React.FormEvent) => {
    e.preventDefault()
    const lines = csvText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
    if (lines.length < 2) {
      alert('กรุณาวางข้อมูล CSV อย่างน้อย 1 แถวใต้บรรทัดหัวตาราง')
      return
    }
    const rows = lines.slice(1).map((line) => {
      const cols = line.split(',').map((c) => c.trim())
      return {
        name: cols[0] || '',
        position: cols[1] || 'ครู',
        academic_standing: cols[2] || '',
        contact_info: cols[3] || '',
        order_num: Number(cols[4] || 0),
      }
    })
    setSaving(true)
    try {
      const res = await fetch('/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: 'personnel', action: 'import_csv', data: { rows } }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Import failed')
      alert(`นำเข้าข้อมูลบุคลากรสำเร็จ ${json.count} รายการ`)
      setCsvModalOpen(false)
      setCsvText('')
      router.refresh()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  const getPersonnelRank = (p: PersonnelItem) => {
    const pos = (p.position || '').trim()
    if (pos.includes('ผู้อำนวยการ') && !pos.includes('รอง')) return 1
    if (pos.includes('รองผู้อำนวยการ')) return 2
    if (p.is_executive) return 3
    if (p.personnel_categories?.name?.includes('ผู้บริหาร')) return 1
    return 4
  }

  const isExecutiveRole = (p: PersonnelItem) => {
    return getPersonnelRank(p) <= 3
  }

  const filtered = [...initialPersonnel]
    .filter((p) => {
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.position.toLowerCase().includes(search.toLowerCase())
      const matchCat =
        filterCat === 'all'
          ? true
          : filterCat === 'executives' || filterCat === 'executive'
          ? isExecutiveRole(p)
          : String(p.category_id) === filterCat
      return matchSearch && matchCat
    })
    .sort((a, b) => {
      const rankA = getPersonnelRank(a)
      const rankB = getPersonnelRank(b)
      if (rankA !== rankB) return rankA - rankB

      const ordA = a.order_num ?? 9999
      const ordB = b.order_num ?? 9999
      if (ordA !== ordB) return ordA - ordB

      return a.id - b.id
    })

  const executivePersonnel = filtered.filter(isExecutiveRole)
  const generalPersonnel = filtered.filter((p) => !isExecutiveRole(p))

  const renderCard = (p: PersonnelItem, isExecCard?: boolean) => {
    const isDirector = p.position?.includes('ผู้อำนวยการ') && !p.position?.includes('รอง')
    const isDeputy = p.position?.includes('รองผู้อำนวยการ')
    const isActingDeputy = p.is_executive

    return (
      <div
        key={p.id}
        className={`bg-white rounded-2xl border transition-all overflow-hidden flex flex-col justify-between p-5 ${
          isExecCard
            ? 'border-2 border-amber-300 shadow-md hover:shadow-lg hover:border-amber-400 bg-gradient-to-b from-white to-amber-50/20'
            : 'border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200'
        }`}
      >
        <div>
          <div className="flex items-start justify-between gap-2 mb-3">
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-bold">
              #{p.order_num ?? 0}
            </span>
            <div className="flex flex-wrap gap-1 justify-end">
              {isDirector ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold shadow-xs">
                  <Award className="w-3 h-3 mr-0.5" /> ผู้อำนวยการ
                </span>
              ) : isDeputy ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold shadow-xs">
                  <Award className="w-3 h-3 mr-0.5" /> รองผู้อำนวยการ
                </span>
              ) : isActingDeputy ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold shadow-xs">
                  <Award className="w-3 h-3 mr-0.5 text-rose-500" /> ครู ทำหน้าที่รองผู้อำนวยการ
                </span>
              ) : null}
              {p.is_head && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                  <Star className="w-3 h-3 mr-0.5" /> หัวหน้าฝ่าย
                </span>
              )}
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  p.is_active
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {p.is_active ? 'ปฏิบัติงาน' : 'ซ่อน'}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center text-center">
            <div
              className={`w-24 h-24 rounded-full overflow-hidden border-2 mb-3 shadow-sm ${
                isDirector
                  ? 'border-amber-400 ring-4 ring-amber-100'
                  : isDeputy
                  ? 'border-indigo-400 ring-4 ring-indigo-100'
                  : isActingDeputy
                  ? 'border-rose-300 ring-4 ring-rose-100'
                  : 'border-slate-200 bg-slate-100'
              }`}
            >
              {p.image_path ? (
                <img
                  src={normalizeImageUrl(p.image_path)}
                  alt={p.name}
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-slate-400">
                  {p.name.charAt(0)}
                </div>
              )}
            </div>

            <h3 className="font-bold text-slate-800 text-base leading-snug">
              {p.name}
            </h3>
            <div className="text-xs font-semibold text-indigo-600 mt-0.5">
              {p.position}
            </div>
            {isActingDeputy && (
              <div className="text-xs font-bold text-rose-600 mt-0.5 flex items-center justify-center gap-1">
                <Award className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                ครู ทำหน้าที่รองผู้อำนวยการ
              </div>
            )}
            {p.academic_standing && (
              <div className="text-[11px] text-slate-500 mt-0.5">
                {p.academic_standing}
              </div>
            )}

            <div className="mt-3 w-full pt-3 border-t border-slate-100 space-y-1 text-xs">
              <div className="text-slate-600 font-medium truncate">
                สังกัด: {p.personnel_categories?.name || 'ไม่ระบุ'}
              </div>
              {p.personnel_special_duties && p.personnel_special_duties.length > 0 && (
                <div className="text-[11px] text-indigo-600 font-medium">
                  + ปฏิบัติหน้าที่พิเศษ {p.personnel_special_duties.length} ฝ่าย
                </div>
              )}
              {p.contact_info && (
                <div className="text-[11px] text-slate-400 truncate">
                  {p.contact_info}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            onClick={() => openEdit(p)}
            className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5" /> แก้ไข
          </button>
          <button
            onClick={() => handleDelete(p.id)}
            className="inline-flex items-center justify-center p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors cursor-pointer"
            title="ลบ"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            จัดการทำเนียบบุคลากร ({initialPersonnel.length} คน)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            เพิ่ม แก้ไข ข้อมูลข้าราชการครูและบุคลากรทางการศึกษา ตำแหน่ง วิทยฐานะ และหน้าที่พิเศษหลายฝ่าย
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setCsvModalOpen(true)}
            className="inline-flex items-center px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4 mr-1.5" />
            นำเข้า CSV
          </button>
          <button
            onClick={openCreate}
            className="inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            เพิ่มบุคลากรใหม่
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อ-นามสกุล หรือตำแหน่ง..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800"
          />
        </div>
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-700 font-medium"
        >
          <option value="all">ทุกหมวดหมู่ / แผนกวิชา ({initialPersonnel.length} คน)</option>
          <option value="executives">⭐ คณะผู้บริหาร (ผู้บริหาร, รองฯ, ครู ทำหน้าที่รองฯ) ({initialPersonnel.filter(isExecutiveRole).length} ท่าน)</option>
          {categories.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.parent_id ? `↳ ${c.name}` : c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Personnel Rendering Logic */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 shadow-sm">
          ไม่พบข้อมูลบุคลากร
        </div>
      ) : filterCat === 'all' && !search ? (
        <div className="space-y-8">
          {/* Executive Board Section */}
          {executivePersonnel.length > 0 && (
            <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-indigo-500/10 rounded-3xl border-2 border-amber-300/80 p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/60 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-md">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      คณะผู้บริหารสถานศึกษา ({executivePersonnel.length} ท่าน)
                    </h2>
                    <p className="text-xs text-slate-600 mt-0.5">
                      ผู้อำนวยการ, รองผู้อำนวยการ และ ครู ทำหน้าที่รองผู้อำนวยการ
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-800 bg-amber-100/80 px-3 py-1 rounded-full border border-amber-200 self-start sm:self-auto">
                  ผู้บริหารระดับสูง
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {executivePersonnel.map((p) => renderCard(p, true))}
              </div>
            </div>
          )}

          {/* General Personnel Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                คณาจารย์และบุคลากรทางการศึกษา ({generalPersonnel.length} คน)
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {generalPersonnel.map((p) => renderCard(p, false))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-xs font-semibold text-slate-500">
            แสดงผลการค้นหา/ตัวกรอง: {filtered.length} คน
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((p) => renderCard(p, isExecutiveRole(p)))}
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-slate-800 text-lg">
                {form.id ? `แก้ไขข้อมูลบุคลากร: ${form.name}` : 'เพิ่มข้อมูลบุคลากรใหม่'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto flex-1">
              <AdminUploadField
                label="รูปถ่ายบุคลากร"
                value={form.image_path}
                onChange={(path) => setForm({ ...form, image_path: path })}
                folder="personnel"
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    ชื่อ - นามสกุล *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="เช่น นายสมชาย ใจดี"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    ตำแหน่งหลัก *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.position}
                    onChange={(e) => setForm({ ...form, position: e.target.value })}
                    placeholder="เช่น ผู้อำนวยการ / ครู"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    วิทยฐานะ
                  </label>
                  <input
                    type="text"
                    value={form.academic_standing}
                    onChange={(e) => setForm({ ...form, academic_standing: e.target.value })}
                    placeholder="เช่น ครูชำนาญการพิเศษ"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800"
                  />
                </div>
              </div>

              {/* Multi-position links */}
              {positions.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    ตำแหน่งในระบบ (เลือกได้หลายตำแหน่ง)
                  </label>
                  <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    {positions.map((pos) => (
                      <label
                        key={pos.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-white rounded-lg border border-slate-200 text-xs font-medium text-slate-700 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={form.position_ids.includes(pos.id)}
                          onChange={() => togglePositionId(pos.id)}
                          className="rounded border-slate-300 text-indigo-600"
                        />
                        {pos.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    สังกัดแผนก / ฝ่ายหลัก
                  </label>
                  <select
                    value={form.category_id}
                    onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800"
                  >
                    <option value="">-- ไม่ระบุ --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        {c.parent_id ? `↳ ${c.name}` : c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    ประจำหลักสูตร (ถ้ามี)
                  </label>
                  <select
                    value={form.curriculum_id}
                    onChange={(e) => setForm({ ...form, curriculum_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800"
                  >
                    <option value="">-- ไม่ระบุ --</option>
                    {curriculums.map((cur) => (
                      <option key={cur.id} value={String(cur.id)}>
                        {cur.name}
                      </option>
                    ))}
                  </select>
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

              {/* Special Duties */}
              <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-700">
                    การปฏิบัติหน้าที่พิเศษในฝ่าย/งานย่อยอื่นๆ
                  </label>
                  <button
                    type="button"
                    onClick={addSpecialDutyRow}
                    className="px-3 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 cursor-pointer"
                  >
                    + เพิ่มหน้าที่พิเศษ
                  </button>
                </div>
                {form.special_duties.map((duty, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-white p-2.5 rounded-xl border border-slate-200"
                  >
                    <div className="sm:col-span-5">
                      <select
                        value={String(duty.category_id)}
                        onChange={(e) => {
                          const updated = [...form.special_duties]
                          updated[idx].category_id = Number(e.target.value)
                          setForm({ ...form, special_duties: updated })
                        }}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={String(c.id)}>
                            {c.parent_id ? `↳ ${c.name}` : c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-4">
                      <input
                        type="text"
                        value={duty.special_position}
                        onChange={(e) => {
                          const updated = [...form.special_duties]
                          updated[idx].special_position = e.target.value
                          setForm({ ...form, special_duties: updated })
                        }}
                        placeholder="ตำแหน่งในฝ่าย เช่น หัวหน้างาน..."
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5"
                      />
                    </div>
                    <div className="sm:col-span-2 flex items-center">
                      <label className="inline-flex items-center gap-1 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={duty.is_head}
                          onChange={(e) => {
                            const updated = [...form.special_duties]
                            updated[idx].is_head = e.target.checked
                            setForm({ ...form, special_duties: updated })
                          }}
                        />
                        หัวหน้างาน
                      </label>
                    </div>
                    <div className="sm:col-span-1 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          setForm({
                            ...form,
                            special_duties: form.special_duties.filter((_, i) => i !== idx),
                          })
                        }
                        className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* 2-Tab Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    รายละเอียด แท็บที่ 1 (ประวัติการศึกษา / คุณวุฒิ)
                  </label>
                  <textarea
                    rows={4}
                    value={form.details_tab1}
                    onChange={(e) => setForm({ ...form, details_tab1: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    รายละเอียด แท็บที่ 2 (ผลงาน / ประสบการณ์)
                  </label>
                  <textarea
                    rows={4}
                    value={form.details_tab2}
                    onChange={(e) => setForm({ ...form, details_tab2: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  ข้อมูลการติดต่อ (เบอร์โทรศัพท์ / อีเมล)
                </label>
                <input
                  type="text"
                  value={form.contact_info}
                  onChange={(e) => setForm({ ...form, contact_info: e.target.value })}
                  placeholder="เช่น โทร. 053-xxx-xxx, Email: teacher@school.ac.th"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800"
                />
              </div>

              <div className="flex flex-wrap gap-6 pt-2">
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_head}
                    onChange={(e) => setForm({ ...form, is_head: e.target.checked })}
                    className="rounded border-slate-300 text-indigo-600 w-4 h-4"
                  />
                  <span>เป็นหัวหน้าแผนก / ฝ่ายหลัก</span>
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_executive}
                    onChange={(e) => setForm({ ...form, is_executive: e.target.checked })}
                    className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 w-4 h-4"
                  />
                  <span className="font-semibold text-rose-700">ครู ทำหน้าที่รองผู้อำนวยการ (แสดงในหน้าผู้บริหาร)</span>
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="rounded border-slate-300 text-indigo-600 w-4 h-4"
                  />
                  <span>เปิดแสดงผล (Active)</span>
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
                  className="px-6 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูลบุคลากร'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {csvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">นำเข้าข้อมูลบุคลากรจาก CSV</h3>
              <button
                onClick={() => setCsvModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleImportCsv} className="p-6 space-y-4">
              <div className="flex items-center justify-between bg-indigo-50 p-3 rounded-xl border border-indigo-100 text-xs text-indigo-800">
                <span>รูปแบบคอลัมน์: name,position,academic_standing,contact_info,order_num</span>
                <button
                  type="button"
                  onClick={downloadCsvTemplate}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-white rounded-lg border border-indigo-200 font-semibold text-indigo-700 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> ดาวน์โหลดไฟล์ตัวอย่าง
                </button>
              </div>
              <textarea
                rows={7}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder={`name,position,academic_standing,contact_info,order_num\nนายสมชาย ใจดี,ครู,ครูชำนาญการ,081-234-5678,1`}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono text-slate-800"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCsvModalOpen(false)}
                  className="px-4 py-2 text-sm bg-slate-100 text-slate-600 rounded-xl cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-xl cursor-pointer"
                >
                  {saving ? 'กำลังนำเข้า...' : 'นำเข้าข้อมูล'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
