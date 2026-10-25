'use client'

import React, { useState, useTransition, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ExternalLink,
  Calendar,
  ChevronDown,
  Plus,
  Copy,
  Trash2,
  Settings,
  Folder,
  PlusCircle,
  Table,
  CheckCircle,
  AlertCircle,
  X,
  Link as LinkIcon,
  FileUp,
  AlignLeft,
  ChevronUp,
  Loader2,
  Edit,
  Image as ImageIcon,
} from 'lucide-react'
import CKEditorField from '../CKEditorField'
import { normalizeImageUrl } from '@/lib/url-helper'
import { swalConfirm, swalSuccess, swalError } from '@/lib/sweetalert'

interface ItaLinkItem {
  id?: number
  link_type: 'url' | 'file' | 'text'
  url: string
  link_name: string | null
  file_size?: number | null
  mime_type?: string | null
}

interface ItaEvalItem {
  id: number
  table_id: number
  item_code: string
  info_detail: string
  element_detail: string | null
  order_no: number | null
  ita_links: ItaLinkItem[]
}

interface ItaTableItem {
  id: number
  sub_topic_id: number
  name: string
  order_no: number | null
  ita_items: ItaEvalItem[]
}

interface ItaSubTopic {
  id: number
  main_topic_id: number
  code: string | null
  name: string
  order_no: number | null
  ita_tables: ItaTableItem[]
}

interface ItaMainTopic {
  id: number
  name: string
  order_no: number | null
  year: number
  ita_sub_topics: ItaSubTopic[]
}

export function ItaAdminClient({
  mainTopics,
  availableYears,
  settingsMap,
  initialYear,
  initialActiveTableId,
}: {
  mainTopics: ItaMainTopic[]
  availableYears: number[]
  settingsMap: Record<string, string>
  initialYear: number
  initialActiveTableId?: number
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLDivElement>(null)

  // Selected Fiscal Year
  const [selectedYear, setSelectedYear] = useState<number>(initialYear)
  const [msg, setMsg] = useState<string>('')
  const [err, setErr] = useState<string>('')

  // Filter topics for selected year
  const yearTopics = mainTopics.filter((m) => m.year === selectedYear)
  const allYearSubTopics = yearTopics.flatMap((m) => m.ita_sub_topics || [])
  const allYearTables = allYearSubTopics.flatMap((s) => s.ita_tables || [])

  // Active selected table
  const defaultTableId =
    initialActiveTableId && allYearTables.some((t) => t.id === initialActiveTableId)
      ? initialActiveTableId
      : allYearTables[0]?.id || 0

  const [activeTableId, setActiveTableId] = useState<number>(defaultTableId)

  const activeTable = allYearTables.find((t) => t.id === activeTableId)
  const activeItems = activeTable?.ita_items || []

  // Banner & Badge Settings State for current year
  const currentBanner =
    settingsMap[`ita_cover_banner_${selectedYear}`] ||
    settingsMap['ita_cover_banner'] ||
    settingsMap['ita_banner_image'] ||
    ''
  const currentBadge =
    settingsMap[`ita_badge_${selectedYear}`] ||
    settingsMap['ita_badge'] ||
    settingsMap['ita_badge_image'] ||
    ''

  const [bannerPreview, setBannerPreview] = useState<string>(currentBanner)
  const [badgePreview, setBadgePreview] = useState<string>(currentBadge)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [uploadingBadge, setUploadingBadge] = useState(false)

  // Item Form State (Add / Edit)
  const [editingItemId, setEditingItemId] = useState<number | null>(null)
  const [itemForm, setItemForm] = useState({
    item_code: '',
    info_detail: '',
    element_detail: '',
    order_no: 0,
    links: [] as Array<{
      id: string
      link_type: 'url' | 'file' | 'text'
      link_name: string
      url: string
      file_size?: number | null
      mime_type?: string | null
      uploading?: boolean
    }>,
  })

  // Modals State
  const [addYearModal, setAddYearModal] = useState(false)
  const [newYearInput, setNewYearInput] = useState<number>(
    availableYears.length > 0 ? Math.max(...availableYears) + 1 : 2570
  )

  const [cloneYearModal, setCloneYearModal] = useState(false)
  const [cloneForm, setCloneForm] = useState({
    from_year: selectedYear,
    to_year: availableYears.length > 0 ? Math.max(...availableYears) + 1 : 2570,
  })

  // Setup Modals for Main Topic, Sub Topic, Table
  const [setupModal, setSetupModal] = useState<{
    open: boolean
    type: 'main' | 'sub' | 'table'
    id: number
    name: string
    order_no: number
    // sub
    main_topic_id: number
    code: string
    // table
    sub_topic_id: number
  }>({
    open: false,
    type: 'main',
    id: 0,
    name: '',
    order_no: 0,
    main_topic_id: 0,
    code: '',
    sub_topic_id: 0,
  })

  // --------------------------------------------------------------------------
  // Year Toolbar Handlers
  // --------------------------------------------------------------------------
  const handleYearChange = (year: number) => {
    setSelectedYear(year)
    const newYearTopics = mainTopics.filter((m) => m.year === year)
    const newYearTables = newYearTopics
      .flatMap((m) => m.ita_sub_topics || [])
      .flatMap((s) => s.ita_tables || [])
    setActiveTableId(newYearTables[0]?.id || 0)
    cancelItemEdit()
    setBannerPreview(
      settingsMap[`ita_cover_banner_${year}`] ||
        settingsMap['ita_cover_banner'] ||
        settingsMap['ita_banner_image'] ||
        ''
    )
    setBadgePreview(
      settingsMap[`ita_badge_${year}`] ||
        settingsMap['ita_badge'] ||
        settingsMap['ita_badge_image'] ||
        ''
    )
  }

  const handleAddYear = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg('')
    setErr('')
    try {
      const res = await fetch('/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'ita',
          action: 'add_year',
          data: { year: newYearInput },
        }),
      })
      if (!res.ok) throw new Error('เพิ่มปีงบประมาณไม่สำเร็จ')
      setAddYearModal(false)
      setMsg(`เพิ่มปีงบประมาณ พ.ศ. ${newYearInput} สำเร็จ`)
      setSelectedYear(newYearInput)
      startTransition(() => router.refresh())
    } catch (err: any) {
      setErr(err.message || 'เกิดข้อผิดพลาดในการเพิ่มปีงบประมาณ')
    }
  }

  const handleCloneYear = async (e: React.FormEvent) => {
    e.preventDefault()
    const ok = await swalConfirm({
      title: 'ยืนยันการโคลนข้อมูล?',
      text: 'การโคลนข้อมูลจะทำการคัดลอกโครงสร้างหัวข้อ ตาราง รายการประเมิน O1-O43 และลิงก์ทั้งหมดไปยังปีงบประมาณปลายทาง',
      confirmButtonText: 'ยืนยันโคลนข้อมูล',
    })
    if (!ok) return
    setMsg('')
    setErr('')
    try {
      const res = await fetch('/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'ita',
          action: 'clone_year',
          data: {
            from_year: cloneForm.from_year,
            to_year: cloneForm.to_year,
            include_links: true,
          },
        }),
      })
      if (!res.ok) throw new Error('โคลนปีงบประมาณไม่สำเร็จ')
      setCloneYearModal(false)
      setMsg(`โคลนปีงบประมาณ พ.ศ. ${cloneForm.to_year} สำเร็จ`)
      setSelectedYear(cloneForm.to_year)
      startTransition(() => router.refresh())
    } catch (err: any) {
      setErr(err.message || 'เกิดข้อผิดพลาดในการโคลนข้อมูล')
    }
  }

  const handleDeleteYear = async () => {
    const ok = await swalConfirm({
      title: 'ยืนยันการลบปีงบประมาณ?',
      text: `ยืนยันที่จะลบปีงบประมาณ พ.ศ. ${selectedYear} และหัวข้อ/ข้อมูลประเมินทั้งหมดอย่างถาวรหรือไม่?`,
      confirmButtonText: 'ลบปีงบประมาณ',
    })
    if (!ok) return
    setMsg('')
    setErr('')
    try {
      const res = await fetch('/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'ita',
          action: 'delete_year',
          data: { year: selectedYear },
        }),
      })
      if (!res.ok) throw new Error('ลบปีงบประมาณไม่สำเร็จ')
      setMsg(`ลบปีงบประมาณ พ.ศ. ${selectedYear} เรียบร้อยแล้ว`)
      const remainingYears = availableYears.filter((y) => y !== selectedYear)
      if (remainingYears.length > 0) {
        handleYearChange(remainingYears[0])
      }
      startTransition(() => router.refresh())
    } catch (err: any) {
      setErr(err.message || 'เกิดข้อผิดพลาดในการลบปีงบประมาณ')
    }
  }

  // --------------------------------------------------------------------------
  // Banner & Badge Upload & Save
  // --------------------------------------------------------------------------
  const uploadImageFile = async (
    file: File,
    type: 'banner' | 'badge'
  ): Promise<string | null> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', 'ita')
    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })
      const json = await res.json()
      if (json.success && (json.path || json.url)) {
        return json.path || json.url
      }
    } catch (e) {
      console.error(e)
    }
    return null
  }

  const handleBannerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    setUploadingBanner(true)
    const uploadedPath = await uploadImageFile(e.target.files[0], 'banner')
    if (uploadedPath) {
      setBannerPreview(uploadedPath)
    }
    setUploadingBanner(false)
  }

  const handleBadgeFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    setUploadingBadge(true)
    const uploadedPath = await uploadImageFile(e.target.files[0], 'badge')
    if (uploadedPath) {
      setBadgePreview(uploadedPath)
    }
    setUploadingBadge(false)
  }

  const handleSaveBannerSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg('')
    setErr('')
    try {
      const res = await fetch('/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'ita',
          action: 'save_banner_settings',
          data: {
            year: selectedYear,
            ita_banner_image: bannerPreview,
            ita_badge_image: badgePreview,
          },
        }),
      })
      if (!res.ok) throw new Error('บันทึกการตั้งค่าไม่สำเร็จ')
      setMsg(
        `บันทึกการตั้งค่าแบนเนอร์และป้ายเว็บสำหรับปีงบประมาณ ${selectedYear} สำเร็จ`
      )
      startTransition(() => router.refresh())
    } catch (err: any) {
      setErr(err.message || 'เกิดข้อผิดพลาดในการบันทึกการตั้งค่า')
    }
  }

  // --------------------------------------------------------------------------
  // Structure Setup Handlers (Main Topic, Sub Topic, Table)
  // --------------------------------------------------------------------------
  const openSetupModal = (
    type: 'main' | 'sub' | 'table',
    editData: Record<string, any> | null = null
  ) => {
    if (editData) {
      setSetupModal({
        open: true,
        type,
        id: editData.id || 0,
        name: editData.name || '',
        order_no: editData.order_no ?? 0,
        main_topic_id: editData.main_topic_id || yearTopics[0]?.id || 0,
        code: editData.code || '',
        sub_topic_id: editData.sub_topic_id || allYearSubTopics[0]?.id || 0,
      })
    } else {
      setSetupModal({
        open: true,
        type,
        id: 0,
        name: '',
        order_no: 0,
        main_topic_id: yearTopics[0]?.id || 0,
        code: '',
        sub_topic_id: allYearSubTopics[0]?.id || 0,
      })
    }
  }

  const handleSaveSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg('')
    setErr('')
    try {
      let action = ''
      let payload: Record<string, any> = {}

      if (setupModal.type === 'main') {
        action = 'save_main'
        payload = {
          id: setupModal.id || undefined,
          name: setupModal.name.trim(),
          order_no: Number(setupModal.order_no),
          year: selectedYear,
        }
      } else if (setupModal.type === 'sub') {
        action = 'save_sub'
        payload = {
          id: setupModal.id || undefined,
          main_topic_id: Number(setupModal.main_topic_id),
          code: setupModal.code.trim(),
          name: setupModal.name.trim(),
          order_no: Number(setupModal.order_no),
        }
      } else if (setupModal.type === 'table') {
        action = 'save_table'
        payload = {
          id: setupModal.id || undefined,
          sub_topic_id: Number(setupModal.sub_topic_id),
          name: setupModal.name.trim(),
          order_no: Number(setupModal.order_no),
        }
      }

      const res = await fetch('/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: 'ita', action, data: payload }),
      })
      if (!res.ok) throw new Error('บันทึกข้อมูลไม่สำเร็จ')
      setSetupModal((prev) => ({ ...prev, open: false }))
      setMsg('บันทึกข้อมูลโครงสร้างหัวข้อสำเร็จ')
      startTransition(() => router.refresh())
    } catch (err: any) {
      setErr(err.message || 'เกิดข้อผิดพลาดในการบันทึก')
    }
  }

  const handleDeleteStructure = async (
    type: 'main' | 'sub' | 'table',
    id: number
  ) => {
    const confirmMsg =
      type === 'main'
        ? 'ลบหัวข้อหลักนี้? หัวข้อย่อยทั้งหมดและตารางประเมินข้างในจะถูกลบไปด้วย'
        : type === 'sub'
        ? 'ลบหัวข้อรองนี้? ตารางประเมินด้านในจะถูกลบไปด้วย'
        : 'ลบตารางนี้อย่างถาวร?'

    const ok = await swalConfirm({
      title: 'ยืนยันการลบโครงสร้าง?',
      text: confirmMsg,
      confirmButtonText: 'ลบ',
    })
    if (!ok) return
    setMsg('')
    setErr('')
    try {
      const action =
        type === 'main'
          ? 'delete_main'
          : type === 'sub'
          ? 'delete_sub'
          : 'delete_table'

      const res = await fetch('/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: 'ita', action, data: { id } }),
      })
      if (!res.ok) throw new Error('ลบข้อมูลไม่สำเร็จ')
      setMsg('ลบข้อมูลสำเร็จ')
      if (type === 'table' && activeTableId === id) {
        setActiveTableId(0)
      }
      startTransition(() => router.refresh())
    } catch (err: any) {
      setErr(err.message || 'เกิดข้อผิดพลาดในการลบ')
    }
  }

  // --------------------------------------------------------------------------
  // Item & Attachments Handlers
  // --------------------------------------------------------------------------
  const addAttachmentRow = (type: 'url' | 'file' | 'text') => {
    const newId = `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
    setItemForm((prev) => ({
      ...prev,
      links: [
        ...prev.links,
        {
          id: newId,
          link_type: type,
          link_name: '',
          url: '',
        },
      ],
    }))
  }

  const removeAttachmentRow = (id: string) => {
    setItemForm((prev) => ({
      ...prev,
      links: prev.links.filter((l) => l.id !== id),
    }))
  }

  const moveAttachmentRow = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1
    if (targetIdx < 0 || targetIdx >= itemForm.links.length) return
    const newLinks = [...itemForm.links]
    const temp = newLinks[index]
    newLinks[index] = newLinks[targetIdx]
    newLinks[targetIdx] = temp
    setItemForm((prev) => ({ ...prev, links: newLinks }))
  }

  const handleUploadAttachmentFile = async (
    index: number,
    files: FileList | null
  ) => {
    if (!files || files.length === 0) return
    const file = files[0]

    // Set uploading state
    setItemForm((prev) => {
      const newLinks = [...prev.links]
      newLinks[index] = { ...newLinks[index], uploading: true }
      return { ...prev, links: newLinks }
    })

    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', 'ita')

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })
      const json = await res.json()
      if (json.success) {
        const filePath = json.path || json.url
        setItemForm((prev) => {
          const newLinks = [...prev.links]
          newLinks[index] = {
            ...newLinks[index],
            url: filePath,
            file_size: json.file_size,
            mime_type: file.type,
            uploading: false,
          }
          return { ...prev, links: newLinks }
        })
      } else {
        swalError('อัปโหลดไฟล์ไม่สำเร็จ')
        setItemForm((prev) => {
          const newLinks = [...prev.links]
          newLinks[index] = { ...newLinks[index], uploading: false }
          return { ...prev, links: newLinks }
        })
      }
    } catch (e) {
      swalError('เกิดข้อผิดพลาดในการอัปโหลด')
      setItemForm((prev) => {
        const newLinks = [...prev.links]
        newLinks[index] = { ...newLinks[index], uploading: false }
        return { ...prev, links: newLinks }
      })
    }
  }

  const editItem = (item: ItaEvalItem) => {
    setEditingItemId(item.id)
    setItemForm({
      item_code: item.item_code,
      info_detail: item.info_detail,
      element_detail: item.element_detail || '',
      order_no: item.order_no ?? 0,
      links: (item.ita_links || []).map((l, i) => ({
        id: `lk_${item.id}_${i}`,
        link_type: l.link_type,
        link_name: l.link_name || '',
        url: l.url,
        file_size: l.file_size,
        mime_type: l.mime_type,
      })),
    })
    formRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const cancelItemEdit = () => {
    setEditingItemId(null)
    setItemForm({
      item_code: '',
      info_detail: '',
      element_detail: '',
      order_no: 0,
      links: [],
    })
  }

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeTableId || !itemForm.item_code.trim()) return
    setMsg('')
    setErr('')

    const validLinks = itemForm.links.map((l) => ({
      link_type: l.link_type,
      link_name: l.link_name.trim(),
      url: l.url.trim(),
      file_size: l.file_size || null,
      mime_type: l.mime_type || null,
    }))

    try {
      const res = await fetch('/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'ita',
          action: 'save_item',
          data: {
            id: editingItemId || undefined,
            table_id: activeTableId,
            item_code: itemForm.item_code.trim(),
            info_detail: itemForm.info_detail.trim(),
            element_detail: itemForm.element_detail.trim(),
            order_no: Number(itemForm.order_no),
            links: validLinks,
          },
        }),
      })
      if (!res.ok) throw new Error('บันทึกแถวข้อมูลไม่สำเร็จ')
      setMsg(
        editingItemId
          ? `อัปเดตข้อมูลข้อ ${itemForm.item_code} สำเร็จ`
          : 'บันทึกข้อมูลตารางประเมินสำเร็จ'
      )
      cancelItemEdit()
      startTransition(() => router.refresh())
    } catch (err: any) {
      setErr(err.message || 'เกิดข้อผิดพลาดในการบันทึก')
    }
  }

  const handleDeleteItem = async (id: number, code: string) => {
    const ok = await swalConfirm({
      title: 'ยืนยันการลบ?',
      text: `ยืนยันลบข้อมูลเกณฑ์ ${code} แถวนี้ใช่หรือไม่?`,
      confirmButtonText: 'ลบข้อมูลเกณฑ์',
    })
    if (!ok) return
    setMsg('')
    setErr('')
    try {
      const res = await fetch('/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'ita',
          action: 'delete_item',
          data: { id },
        }),
      })
      if (!res.ok) throw new Error('ลบไม่สำเร็จ')
      setMsg('ลบข้อมูลหัวข้อประเมินสำเร็จ')
      if (editingItemId === id) cancelItemEdit()
      startTransition(() => router.refresh())
    } catch (err: any) {
      setErr(err.message || 'เกิดข้อผิดพลาดในการลบ')
    }
  }

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            ระบบจัดการประเมินคุณธรรมและความโปร่งใส (ITA)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            จัดการหัวข้อหลัก หัวข้อรอง และตารางแสดงข้อมูลเอกสารแนบประกอบเกณฑ์
          </p>
        </div>
        <Link
          href={`/ita?year=${selectedYear}`}
          target="_blank"
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-2xl shadow-lg shadow-indigo-600/10 transition flex items-center gap-2 text-sm cursor-pointer"
        >
          <ExternalLink className="w-4 h-4" />
          <span>ดูหน้าเว็บ ITA จริง</span>
        </Link>
      </div>

      {/* Year Management Toolbar */}
      <div className="mb-8 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <Calendar className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">
              ปีงบประมาณที่กำลังจัดการ
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              เลือกปีงบประมาณที่ต้องการจัดการข้อมูล
              หรือดำเนินการโคลนข้อมูล/เพิ่มปีงบประมาณใหม่
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Year selector */}
          <div className="relative w-full sm:w-48">
            <select
              value={selectedYear}
              onChange={(e) => handleYearChange(Number(e.target.value))}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-2xl text-sm font-bold text-slate-800 outline-none transition appearance-none cursor-pointer pr-10"
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  ปีงบประมาณ พ.ศ. {y}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>

          {/* Add Year Button */}
          <button
            type="button"
            onClick={() => setAddYearModal(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition flex items-center gap-1.5 text-sm shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มปีงบประมาณ</span>
          </button>

          {/* Clone Year Button */}
          <button
            type="button"
            onClick={() => {
              setCloneForm({
                from_year: selectedYear,
                to_year: Math.max(...availableYears) + 1,
              })
              setCloneYearModal(true)
            }}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition flex items-center gap-1.5 text-sm shadow-sm cursor-pointer"
          >
            <Copy className="w-4 h-4" />
            <span>โคลนปีงบประมาณ</span>
          </button>

          {/* Delete Year Button */}
          <button
            type="button"
            onClick={handleDeleteYear}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl transition flex items-center gap-1.5 text-sm shadow-sm cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>ลบปีงบประมาณ</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {msg && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-medium">{msg}</span>
        </div>
      )}
      {err && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="text-sm font-medium">{err}</span>
        </div>
      )}

      {/* Grid Content Panels (Left: 4 cols, Right: 8 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Left Column (4 cols) */}
        <div className="xl:col-span-4 space-y-6">
          {/* Setting / Banner Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Settings className="w-4 h-4 text-indigo-600" />
              <span>ตั้งค่าแบนเนอร์และป้ายเว็บ ITA</span>
            </h3>

            <form onSubmit={handleSaveBannerSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ภาพแบนเนอร์ปัจจุบัน (ปีงบฯ {selectedYear})
                </label>
                <div className="aspect-video bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 relative mb-2 flex items-center justify-center">
                  {bannerPreview ? (
                    <img
                      src={normalizeImageUrl(bannerPreview)}
                      alt="ITA Banner"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                  )}
                  {uploadingBanner && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBannerFileChange}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-indigo-50 file:text-indigo-700 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ป้ายเว็บ ITA ปัจจุบัน (ปีงบฯ {selectedYear})
                </label>
                <div className="w-32 h-32 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 relative mb-2 mx-auto flex items-center justify-center">
                  {badgePreview ? (
                    <img
                      src={normalizeImageUrl(badgePreview)}
                      alt="ITA Badge"
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                  )}
                  {uploadingBadge && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBadgeFileChange}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-indigo-50 file:text-indigo-700 cursor-pointer"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow transition cursor-pointer disabled:opacity-50"
              >
                บันทึกการตั้งค่าแบนเนอร์และป้ายเว็บ
              </button>
            </form>
          </div>

          {/* Topics & Tables Hierarchy Panel */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Folder className="w-4 h-4 text-indigo-600" />
                <span>หัวข้อหลัก / หัวข้อรอง / ตาราง</span>
              </h3>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => openSetupModal('main')}
                  className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-indigo-600 cursor-pointer"
                  title="เพิ่มหัวข้อหลัก"
                >
                  <PlusCircle className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => openSetupModal('sub')}
                  className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-indigo-600 cursor-pointer"
                  title="เพิ่มหัวข้อรอง"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => openSetupModal('table')}
                  className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-indigo-600 cursor-pointer"
                  title="เพิ่มชื่อตาราง"
                >
                  <Table className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* List Trees */}
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {yearTopics.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-6">
                  ยังไม่มีการสร้างผังหัวข้อในระบบ
                </p>
              ) : (
                yearTopics.map((main) => (
                  <div
                    key={main.id}
                    className="border border-slate-100 rounded-2xl bg-slate-50/50 p-3 space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-extrabold text-slate-900 truncate max-w-[70%]">
                        {main.name}
                      </span>
                      <div className="flex gap-2 text-[10px]">
                        <button
                          type="button"
                          onClick={() => openSetupModal('main', main)}
                          className="text-slate-400 hover:text-indigo-600 font-bold cursor-pointer"
                        >
                          แก้ไข
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteStructure('main', main.id)}
                          className="text-rose-400 hover:text-rose-600 font-bold cursor-pointer"
                        >
                          ลบ
                        </button>
                      </div>
                    </div>

                    {/* Sub topics container */}
                    <div className="pl-2 border-l border-slate-200 space-y-2">
                      {(main.ita_sub_topics || []).map((sub) => (
                        <div key={sub.id} className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-700 truncate max-w-[70%]">
                              {sub.code ? `${sub.code} ` : ''}
                              {sub.name}
                            </span>
                            <div className="flex gap-2 text-[10px]">
                              <button
                                type="button"
                                onClick={() => openSetupModal('sub', sub)}
                                className="text-slate-400 hover:text-indigo-600 font-semibold cursor-pointer"
                              >
                                แก้ไข
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteStructure('sub', sub.id)}
                                className="text-rose-400 hover:text-rose-600 font-semibold cursor-pointer"
                              >
                                ลบ
                              </button>
                            </div>
                          </div>

                          {/* Tables container */}
                          <div className="pl-3 space-y-1">
                            {(sub.ita_tables || []).map((table) => {
                              const isActive = activeTableId === table.id
                              const activeCls = isActive
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white text-slate-600 border border-slate-200/60 hover:bg-slate-50'

                              return (
                                <div
                                  key={table.id}
                                  className={`flex items-center justify-between p-2 rounded-xl text-[11px] transition ${activeCls}`}
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveTableId(table.id)
                                      cancelItemEdit()
                                    }}
                                    className="flex-1 text-left truncate font-semibold mr-2 cursor-pointer"
                                  >
                                    {table.name}
                                  </button>
                                  <div className="flex gap-1.5 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => openSetupModal('table', table)}
                                      className="hover:underline font-bold cursor-pointer"
                                    >
                                      แก้ไข
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDeleteStructure('table', table.id)
                                      }
                                      className="text-rose-400 hover:underline font-bold cursor-pointer"
                                    >
                                      ลบ
                                    </button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column (8 cols) */}
        <div className="xl:col-span-8 space-y-6">
          {activeTableId <= 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400">
              <Table className="w-12 h-12 mx-auto text-slate-400 mb-3 animate-bounce" />
              <h3 className="font-bold text-slate-800 text-base">
                กรุณาเลือกตารางด้านซ้าย หรือกดสร้างตารางใหม่เพื่อเริ่มต้นจัดการข้อมูล
              </h3>
            </div>
          ) : (
            <>
              {/* Form to Add / Edit ITA Item */}
              <div
                ref={formRef}
                className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4"
              >
                <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-indigo-600" />
                  <span>
                    {editingItemId
                      ? `แก้ไขข้อเกณฑ์ประเมิน: ${itemForm.item_code}`
                      : 'เพิ่มแถวข้อมูลประเมินในตาราง'}
                  </span>
                </h3>

                <form onSubmit={handleSaveItem} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        รหัสข้อประเมิน *
                      </label>
                      <input
                        type="text"
                        required
                        value={itemForm.item_code}
                        onChange={(e) =>
                          setItemForm({ ...itemForm, item_code: e.target.value })
                        }
                        placeholder="เช่น O1"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-sm outline-none transition font-bold text-indigo-600"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        ชื่อแสดงแทนข้อมูลประเมิน *
                      </label>
                      <input
                        type="text"
                        required
                        value={itemForm.info_detail}
                        onChange={(e) =>
                          setItemForm({ ...itemForm, info_detail: e.target.value })
                        }
                        placeholder="เช่น โครงสร้างและสายการบังคับบัญชาหน่วยงาน"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-sm outline-none transition font-semibold"
                      />
                    </div>

                    <div className="md:col-span-4">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        3. รายละเอียดองค์ประกอบด้านข้อมูล
                        (กดขึ้นบรรทัดใหม่เพื่อแสดงผลในรูปแบบหัวข้อลำดับเลข 1), 2))
                      </label>
                      <CKEditorField
                        value={itemForm.element_detail}
                        onChange={(html) =>
                          setItemForm({ ...itemForm, element_detail: html })
                        }
                        height={180}
                        placeholder="รายละเอียดองค์ประกอบข้อมูล..."
                      />
                    </div>

                    <div className="md:col-span-1">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        ลำดับการเรียง
                      </label>
                      <input
                        type="number"
                        value={itemForm.order_no}
                        onChange={(e) =>
                          setItemForm({
                            ...itemForm,
                            order_no: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-sm outline-none transition"
                      />
                    </div>
                  </div>

                  {/* Dynamic Link Attachments Section */}
                  <div className="border-t border-slate-100 pt-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="block text-xs font-bold text-slate-700">
                        4. แหล่งอ้างอิงการเผยแพร่ข้อมูล (แนบลิงก์ หรือ
                        อัปโหลดเอกสาร PDF / รูปภาพ / ZIP)
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => addAttachmentRow('url')}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                        >
                          <LinkIcon className="w-3.5 h-3.5" />
                          <span>เพิ่มลิงก์ภายนอก</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => addAttachmentRow('file')}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                        >
                          <FileUp className="w-3.5 h-3.5" />
                          <span>อัปโหลดเอกสารแนบ</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => addAttachmentRow('text')}
                          className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                        >
                          <AlignLeft className="w-3.5 h-3.5" />
                          <span>เพิ่มข้อความ</span>
                        </button>
                      </div>
                    </div>

                    {/* Attachments list */}
                    <div className="space-y-2.5">
                      {itemForm.links.map((link, idx) => (
                        <div
                          key={link.id}
                          className="flex flex-col sm:flex-row gap-3 bg-slate-50 border border-slate-200 p-3.5 rounded-2xl relative items-stretch sm:items-center"
                        >
                          {/* Up / Down reorder buttons */}
                          <div className="flex gap-1 shrink-0 self-center">
                            <button
                              type="button"
                              onClick={() => moveAttachmentRow(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 hover:bg-slate-200 text-slate-500 hover:text-indigo-600 rounded transition cursor-pointer disabled:opacity-30"
                              title="เลื่อนขึ้น"
                            >
                              <ChevronUp className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveAttachmentRow(idx, 'down')}
                              disabled={idx === itemForm.links.length - 1}
                              className="p-1 hover:bg-slate-200 text-slate-500 hover:text-indigo-600 rounded transition cursor-pointer disabled:opacity-30"
                              title="เลื่อนลง"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Link Name */}
                          <div className="flex-grow w-full sm:w-auto">
                            <input
                              type="text"
                              required
                              value={link.link_name}
                              onChange={(e) => {
                                const newLinks = [...itemForm.links]
                                newLinks[idx].link_name = e.target.value
                                setItemForm({ ...itemForm, links: newLinks })
                              }}
                              placeholder={
                                link.link_type === 'url'
                                  ? 'ชื่อลิงก์ปลายทาง (เช่น เว็บไซต์หลักเกณฑ์)'
                                  : link.link_type === 'file'
                                  ? 'ชื่อเอกสารอ้างอิง (เช่น รายงานผลการดำเนินงาน)'
                                  : 'หัวข้อหรือชื่อรายละเอียดข้อความ (เช่น คำชี้แจง)'
                              }
                              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 transition font-semibold"
                            />
                          </div>

                          {/* URL / File / Text field */}
                          <div className="flex-grow w-full sm:w-auto flex gap-2 items-center">
                            {link.link_type === 'url' && (
                              <input
                                type="url"
                                required
                                value={link.url}
                                onChange={(e) => {
                                  const newLinks = [...itemForm.links]
                                  newLinks[idx].url = e.target.value
                                  setItemForm({ ...itemForm, links: newLinks })
                                }}
                                placeholder="URL ลิงก์เชื่อมโยง (เช่น https://example.com)"
                                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 transition font-mono"
                              />
                            )}

                            {link.link_type === 'file' && (
                              <div className="flex-1 relative">
                                {link.uploading ? (
                                  <div className="text-xs text-indigo-600 font-semibold flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>กำลังอัปโหลดไฟล์...</span>
                                  </div>
                                ) : link.url ? (
                                  <div className="text-xs font-mono text-indigo-700 bg-white border border-slate-200 rounded-xl px-3 py-1.5 truncate flex items-center justify-between">
                                    <span className="truncate max-w-[200px]">
                                      {link.url}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newLinks = [...itemForm.links]
                                        newLinks[idx].url = ''
                                        setItemForm({ ...itemForm, links: newLinks })
                                      }}
                                      className="text-rose-500 text-[10px] font-bold hover:underline shrink-0 ml-2 cursor-pointer"
                                    >
                                      ลบไฟล์
                                    </button>
                                  </div>
                                ) : (
                                  <input
                                    type="file"
                                    onChange={(e) =>
                                      handleUploadAttachmentFile(idx, e.target.files)
                                    }
                                    className="w-full text-xs cursor-pointer"
                                  />
                                )}
                              </div>
                            )}

                            {link.link_type === 'text' && (
                              <textarea
                                required
                                rows={2}
                                value={link.url}
                                onChange={(e) => {
                                  const newLinks = [...itemForm.links]
                                  newLinks[idx].url = e.target.value
                                  setItemForm({ ...itemForm, links: newLinks })
                                }}
                                placeholder="กรอกข้อความที่ต้องการชี้แจง..."
                                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 transition font-sans"
                              />
                            )}

                            <button
                              type="button"
                              onClick={() => removeAttachmentRow(link.id)}
                              className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition shrink-0 self-center cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    {editingItemId && (
                      <button
                        type="button"
                        onClick={cancelItemEdit}
                        className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                      >
                        ยกเลิกแก้ไข
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={isPending}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow transition text-sm cursor-pointer disabled:opacity-50"
                    >
                      บันทึกข้อมูลเกณฑ์ประเมิน
                    </button>
                  </div>
                </form>
              </div>

              {/* List Active Items Table */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm overflow-hidden">
                <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2 mb-4">
                  <Table className="w-4 h-4 text-indigo-600" />
                  <span>ตารางประเมินผล: {activeTable?.name || ''}</span>
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 text-xs font-bold uppercase bg-slate-50/20">
                        <th className="py-3 px-4 text-center" style={{ width: '8%' }}>
                          ข้อ
                        </th>
                        <th className="py-3 px-4" style={{ width: '25%' }}>
                          ข้อมูล
                        </th>
                        <th className="py-3 px-4" style={{ width: '37%' }}>
                          องค์ประกอบด้านข้อมูล
                        </th>
                        <th className="py-3 px-4" style={{ width: '15%' }}>
                          เอกสารแนบ
                        </th>
                        <th className="py-3 px-4 text-right" style={{ width: '15%' }}>
                          จัดการ
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {activeItems.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-400">
                            <Table className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                            <p className="text-sm font-medium">
                              ยังไม่มีรายการข้อมูลในตารางนี้
                            </p>
                          </td>
                        </tr>
                      ) : (
                        activeItems.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/30 transition">
                            <td className="py-4 px-4 text-center font-bold text-slate-900 text-sm">
                              {item.item_code}
                            </td>
                            <td className="py-4 px-4 font-bold text-slate-800 text-sm">
                              {item.info_detail}
                            </td>
                            <td className="py-4 px-4 text-slate-650 leading-relaxed max-w-xs text-xs">
                              {item.element_detail ? (
                                <div
                                  className="max-h-24 overflow-y-auto pr-1 font-medium prose prose-xs"
                                  dangerouslySetInnerHTML={{
                                    __html: item.element_detail,
                                  }}
                                />
                              ) : (
                                <span className="text-slate-400 italic">-</span>
                              )}
                            </td>
                            <td className="py-4 px-4 space-y-1">
                              {item.ita_links && item.ita_links.length > 0 ? (
                                item.ita_links.map((link, lkIdx) => (
                                  <div
                                    key={link.id || lkIdx}
                                    className="flex items-center gap-1"
                                  >
                                    {link.link_type === 'text' ? (
                                      <>
                                        <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-amber-50 text-amber-700">
                                          TEXT
                                        </span>
                                        <span
                                          className="text-xs text-slate-700 font-semibold truncate max-w-[150px]"
                                          title={`${link.link_name || 'ข้อความ'}: ${
                                            link.url
                                          }`}
                                        >
                                          {link.link_name || 'ข้อความ'}
                                        </span>
                                      </>
                                    ) : (
                                      <>
                                        <span
                                          className={`px-1.5 py-0.5 text-[9px] font-bold rounded-full ${
                                            link.link_type === 'file'
                                              ? 'bg-emerald-50 text-emerald-700'
                                              : 'bg-indigo-50 text-indigo-700'
                                          }`}
                                        >
                                          {link.link_type.toUpperCase()}
                                        </span>
                                        <a
                                          href={
                                            link.link_type === 'file'
                                              ? normalizeImageUrl(link.url)
                                              : link.url
                                          }
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-indigo-600 hover:underline font-semibold truncate max-w-[110px]"
                                          title={link.link_name || link.url}
                                        >
                                          {link.link_name || 'ลิงก์'}
                                        </a>
                                      </>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <span className="text-slate-400 italic">-</span>
                              )}
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => editItem(item)}
                                  className="p-2 border border-slate-200 bg-white hover:border-slate-300 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition cursor-pointer"
                                  title="แก้ไข"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteItem(item.id, item.item_code)
                                  }
                                  className="p-2 border border-rose-100 bg-rose-50/50 hover:bg-rose-50 hover:border-rose-200 text-rose-600 rounded-xl transition cursor-pointer"
                                  title="ลบ"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal Add Year */}
      {addYearModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setAddYearModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <span>เพิ่มปีงบประมาณใหม่</span>
            </h3>
            <form onSubmit={handleAddYear} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  ปีงบประมาณ พ.ศ. (เช่น 2570) *
                </label>
                <input
                  type="number"
                  required
                  min={2500}
                  max={2700}
                  value={newYearInput}
                  onChange={(e) => setNewYearInput(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-sm outline-none transition font-bold"
                />
              </div>
              <p className="text-xs text-slate-500">
                ระบบจะช่วยสร้างปีงบประมาณใหม่พร้อมหัวข้อหลักเริ่มต้น
                เพื่อให้พร้อมบันทึกข้อมูลได้ทันที
              </p>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddYearModal(false)}
                  className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow transition font-bold cursor-pointer disabled:opacity-50"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Clone Year */}
      {cloneYearModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setCloneYearModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Copy className="w-5 h-5 text-indigo-600" />
              <span>โคลนข้อมูลปีงบประมาณ</span>
            </h3>
            <form onSubmit={handleCloneYear} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  ต้นทาง (ปีงบประมาณ พ.ศ.)
                </label>
                <select
                  value={cloneForm.from_year}
                  onChange={(e) =>
                    setCloneForm({ ...cloneForm, from_year: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-sm outline-none transition bg-white cursor-pointer"
                >
                  {availableYears.map((y) => (
                    <option key={y} value={y}>
                      พ.ศ. {y}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  ปลายทาง (ระบุปีงบประมาณ พ.ศ. ใหม่) *
                </label>
                <input
                  type="number"
                  required
                  min={2500}
                  max={2700}
                  value={cloneForm.to_year}
                  onChange={(e) =>
                    setCloneForm({ ...cloneForm, to_year: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-sm outline-none transition font-bold"
                />
              </div>
              <p className="text-xs text-rose-500 font-medium">
                คำเตือน: โครงสร้างและรายการประเมินปลายทางจะถูกสร้างเพิ่มขึ้น
                โปรดตรวจสอบให้แน่ใจว่าไม่มีข้อมูลซ้ำซ้อน
              </p>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCloneYearModal(false)}
                  className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow transition font-bold cursor-pointer disabled:opacity-50"
                >
                  เริ่มโคลนข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Setup (Main Topic / Sub Topic / Table) */}
      {setupModal.open && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setSetupModal((prev) => ({ ...prev, open: false }))}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Form for Main Topic */}
            {setupModal.type === 'main' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900">
                  {setupModal.id ? 'แก้ไขหัวข้อหลัก' : 'เพิ่มหัวข้อหลัก (Main Indicator)'}
                </h3>
                <form onSubmit={handleSaveSetup} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      ชื่อหัวข้อหลัก *
                    </label>
                    <input
                      type="text"
                      required
                      value={setupModal.name}
                      onChange={(e) =>
                        setSetupModal({ ...setupModal, name: e.target.value })
                      }
                      placeholder="เช่น การเปิดเผยข้อมูลสาธารณะ"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-sm outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      ลำดับการจัดเรียง
                    </label>
                    <input
                      type="number"
                      value={setupModal.order_no}
                      onChange={(e) =>
                        setSetupModal({
                          ...setupModal,
                          order_no: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-sm outline-none transition"
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() =>
                        setSetupModal((prev) => ({ ...prev, open: false }))
                      }
                      className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow transition font-bold cursor-pointer disabled:opacity-50"
                    >
                      บันทึกข้อมูล
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Form for Sub Topic */}
            {setupModal.type === 'sub' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900">
                  {setupModal.id ? 'แก้ไขหัวข้อรอง' : 'เพิ่มหัวข้อรอง (Sub Indicator)'}
                </h3>
                <form onSubmit={handleSaveSetup} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      ผูกกับหัวข้อหลัก *
                    </label>
                    <select
                      required
                      value={setupModal.main_topic_id}
                      onChange={(e) =>
                        setSetupModal({
                          ...setupModal,
                          main_topic_id: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-sm outline-none transition bg-white cursor-pointer"
                    >
                      <option value="">-- เลือกหัวข้อหลัก --</option>
                      {yearTopics.map((mt) => (
                        <option key={mt.id} value={mt.id}>
                          {mt.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      รหัสชี้วัดย่อย *
                    </label>
                    <input
                      type="text"
                      required
                      value={setupModal.code}
                      onChange={(e) =>
                        setSetupModal({ ...setupModal, code: e.target.value })
                      }
                      placeholder="เช่น 9.1"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-sm outline-none transition font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      ชื่อหัวข้อรอง *
                    </label>
                    <input
                      type="text"
                      required
                      value={setupModal.name}
                      onChange={(e) =>
                        setSetupModal({ ...setupModal, name: e.target.value })
                      }
                      placeholder="เช่น ข้อมูลพื้นฐาน"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-sm outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      ลำดับการจัดเรียง
                    </label>
                    <input
                      type="number"
                      value={setupModal.order_no}
                      onChange={(e) =>
                        setSetupModal({
                          ...setupModal,
                          order_no: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-sm outline-none transition"
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() =>
                        setSetupModal((prev) => ({ ...prev, open: false }))
                      }
                      className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow transition font-bold cursor-pointer disabled:opacity-50"
                    >
                      บันทึกข้อมูล
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Form for Table */}
            {setupModal.type === 'table' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900">
                  {setupModal.id ? 'แก้ไขชื่อตาราง' : 'เพิ่มชื่อตารางประเมิน (ITA Table)'}
                </h3>
                <form onSubmit={handleSaveSetup} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      ผูกกับหัวข้อรอง *
                    </label>
                    <select
                      required
                      value={setupModal.sub_topic_id}
                      onChange={(e) =>
                        setSetupModal({
                          ...setupModal,
                          sub_topic_id: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-sm outline-none transition bg-white cursor-pointer"
                    >
                      <option value="">-- เลือกหัวข้อรอง --</option>
                      {allYearSubTopics.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.code ? `${st.code} ` : ''}
                          {st.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      ชื่อตาราง *
                    </label>
                    <input
                      type="text"
                      required
                      value={setupModal.name}
                      onChange={(e) =>
                        setSetupModal({ ...setupModal, name: e.target.value })
                      }
                      placeholder="เช่น โครงสร้างและการดำเนินงานของหน่วยงาน"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-sm outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      ลำดับการจัดเรียง
                    </label>
                    <input
                      type="number"
                      value={setupModal.order_no}
                      onChange={(e) =>
                        setSetupModal({
                          ...setupModal,
                          order_no: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-sm outline-none transition"
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() =>
                        setSetupModal((prev) => ({ ...prev, open: false }))
                      }
                      className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow transition font-bold cursor-pointer disabled:opacity-50"
                    >
                      บันทึกข้อมูล
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
