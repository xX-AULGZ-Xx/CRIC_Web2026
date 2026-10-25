'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  GripVertical,
  ChevronDown,
  Link as LinkIcon,
  CornerDownRight,
  Plus,
  X,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Home,
  Info,
  Users,
  BookOpen,
  FileText,
  Image as ImageIcon,
  Download,
  Compass,
  Settings,
  Shield,
  Award,
  Phone,
  Mail,
  Folder,
  HelpCircle,
  Layers,
  FileCheck,
  MessageSquare,
} from 'lucide-react'
import { swalConfirm } from '@/lib/sweetalert'

interface NavbarItem {
  id: number
  parent_id: number | null
  label: string
  url: string
  icon: string | null
  order_num: number | null
  is_active: boolean | null
  target_blank: boolean | null
}

function renderMenuIcon(iconName?: string | null, className = 'w-4 h-4') {
  if (!iconName) return <LinkIcon className={`${className} text-slate-400 shrink-0`} />
  const name = iconName.toLowerCase().trim()
  switch (name) {
    case 'home':
      return <Home className={`${className} text-indigo-500 shrink-0`} />
    case 'info':
      return <Info className={`${className} text-indigo-500 shrink-0`} />
    case 'users':
      return <Users className={`${className} text-indigo-500 shrink-0`} />
    case 'book':
    case 'bookopen':
    case 'book-open':
      return <BookOpen className={`${className} text-indigo-500 shrink-0`} />
    case 'file':
    case 'filetext':
    case 'file-text':
      return <FileText className={`${className} text-indigo-500 shrink-0`} />
    case 'image':
    case 'gallery':
    case 'photos':
      return <ImageIcon className={`${className} text-indigo-500 shrink-0`} />
    case 'download':
    case 'downloads':
      return <Download className={`${className} text-indigo-500 shrink-0`} />
    case 'compass':
      return <Compass className={`${className} text-indigo-500 shrink-0`} />
    case 'settings':
      return <Settings className={`${className} text-indigo-500 shrink-0`} />
    case 'shield':
      return <Shield className={`${className} text-indigo-500 shrink-0`} />
    case 'award':
      return <Award className={`${className} text-indigo-500 shrink-0`} />
    case 'phone':
      return <Phone className={`${className} text-indigo-500 shrink-0`} />
    case 'mail':
      return <Mail className={`${className} text-indigo-500 shrink-0`} />
    case 'folder':
      return <Folder className={`${className} text-indigo-500 shrink-0`} />
    case 'help':
    case 'help-circle':
      return <HelpCircle className={`${className} text-indigo-500 shrink-0`} />
    case 'layers':
      return <Layers className={`${className} text-indigo-500 shrink-0`} />
    case 'check':
    case 'file-check':
      return <FileCheck className={`${className} text-indigo-500 shrink-0`} />
    case 'message':
    case 'chat':
    case 'complaint':
      return <MessageSquare className={`${className} text-indigo-500 shrink-0`} />
    default:
      return <LinkIcon className={`${className} text-indigo-500 shrink-0`} />
  }
}

export function NavbarsAdminClient({
  initialNavbars,
  staticPages,
}: {
  initialNavbars: NavbarItem[]
  staticPages: Array<{ slug: string; title: string }>
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Collapse states
  const [collapsedParents, setCollapsedParents] = useState<Record<number, boolean>>({})
  const [collapsedLevel3, setCollapsedLevel3] = useState<Record<number, boolean>>({})

  // Toast notification
  const [toast, setToast] = useState<{ show: boolean; msg: string; isError?: boolean }>({
    show: false,
    msg: '',
    isError: false,
  })

  // Flash msg / err
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [form, setForm] = useState({
    id: 0,
    label: '',
    parent_id: '',
    url: '',
    icon: '',
    order_num: 0,
    is_active: true,
    target_blank: false,
  })

  // Partition menus into parents and children
  const parentMenus = initialNavbars.filter((m) => !m.parent_id)
  const childMenus: Record<number, NavbarItem[]> = {}
  initialNavbars.forEach((m) => {
    if (m.parent_id) {
      if (!childMenus[m.parent_id]) childMenus[m.parent_id] = []
      childMenus[m.parent_id].push(m)
    }
  })

  // Show Toast Helper
  const showToast = (message: string, isError = false) => {
    setToast({ show: true, msg: message, isError })
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }))
    }, 3000)
  }

  // Toggle Collapse
  const toggleParentCollapse = (id: number) => {
    setCollapsedParents((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const toggleLevel3Collapse = (id: number) => {
    setCollapsedLevel3((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // Open Create Modal
  const openCreateModal = (parentId?: number) => {
    setModalMode('create')
    setForm({
      id: 0,
      label: '',
      parent_id: parentId ? String(parentId) : '',
      url: '',
      icon: '',
      order_num: initialNavbars.length + 1,
      is_active: true,
      target_blank: false,
    })
    setModalOpen(true)
  }

  // Open Edit Modal
  const openEditModal = (item: NavbarItem) => {
    setModalMode('edit')
    setForm({
      id: item.id,
      label: item.label,
      parent_id: item.parent_id ? String(item.parent_id) : '',
      url: item.url,
      icon: item.icon || '',
      order_num: item.order_num ?? 0,
      is_active: Boolean(item.is_active ?? true),
      target_blank: Boolean(item.target_blank ?? false),
    })
    setModalOpen(true)
  }

  // Save Modal Form
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.label.trim()) return
    setMsg('')
    setErr('')
    try {
      const res = await fetch('/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'navbars',
          action: 'save',
          data: {
            id: form.id || undefined,
            label: form.label.trim(),
            url: form.url.trim() || '#',
            parent_id: form.parent_id ? Number(form.parent_id) : null,
            icon: form.icon.trim() || null,
            order_num: Number(form.order_num),
            is_active: form.is_active,
            target_blank: form.target_blank,
          },
        }),
      })
      if (!res.ok) throw new Error('บันทึกข้อมูลไม่สำเร็จ')
      setModalOpen(false)
      setMsg(modalMode === 'create' ? 'สร้างเมนูเรียบร้อยแล้ว' : 'อัพเดทเมนูเรียบร้อยแล้ว')
      showToast('บันทึกข้อมูลเมนูสำเร็จ')
      startTransition(() => router.refresh())
    } catch (err: any) {
      setErr(err.message || 'เกิดข้อผิดพลาดในการบันทึก')
      showToast(err.message || 'บันทึกไม่สำเร็จ', true)
    }
  }

  // Delete Menu Item
  const handleDelete = async (item: NavbarItem, isParent = false) => {
    const confirmText = isParent
      ? 'ยืนยันการลบเมนูหลักนี้? เมนูย่อยทั้งหมดในหัวข้อนี้จะถูกลบไปด้วยอย่างถาวร'
      : item.parent_id && childMenus[item.id]
      ? 'ยืนยันการลบเมนูย่อยนี้? เมนูย่อยระดับ 3 ทั้งหมดในหัวข้อนี้จะถูกลบไปด้วย'
      : 'ยืนยันการลบเมนูนี้?'

    const ok = await swalConfirm({
      title: 'ยืนยันการลบเมนู?',
      text: confirmText,
      confirmButtonText: 'ลบเมนู',
    })
    if (!ok) return
    setMsg('')
    setErr('')
    try {
      const res = await fetch('/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'navbars',
          action: 'delete',
          data: { id: item.id },
        }),
      })
      if (!res.ok) throw new Error('ลบไม่สำเร็จ')
      setMsg('ลบเมนูเรียบร้อยแล้ว')
      showToast('ลบเมนูเรียบร้อยแล้ว')
      startTransition(() => router.refresh())
    } catch (err: any) {
      setErr(err.message || 'เกิดข้อผิดพลาดในการลบ')
      showToast(err.message || 'ลบไม่สำเร็จ', true)
    }
  }

  // Reorder Handler (Up / Down)
  const handleReorder = async (item: NavbarItem, direction: 'up' | 'down') => {
    // Find siblings
    const siblings = initialNavbars
      .filter((m) => m.parent_id === item.parent_id)
      .sort((a, b) => (a.order_num ?? 0) - (b.order_num ?? 0))

    const currentIdx = siblings.findIndex((s) => s.id === item.id)
    if (currentIdx === -1) return

    const swapIdx = direction === 'up' ? currentIdx - 1 : currentIdx + 1
    if (swapIdx < 0 || swapIdx >= siblings.length) return

    // Swap items in array and get new IDs order
    const reordered = [...siblings]
    const temp = reordered[currentIdx]
    reordered[currentIdx] = reordered[swapIdx]
    reordered[swapIdx] = temp

    const newMenuIds = reordered.map((m) => m.id)

    showToast('กำลังบันทึกลำดับเมนู...')
    try {
      const res = await fetch('/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'navbars',
          action: 'update_order',
          data: { menu_ids: newMenuIds },
        }),
      })
      if (!res.ok) throw new Error('เกิดข้อผิดพลาดในการบันทึกลำดับ')
      showToast('บันทึกลำดับเมนูเสร็จสิ้น')
      startTransition(() => router.refresh())
    } catch (err: any) {
      showToast('เกิดข้อผิดพลาด: ' + err.message, true)
    }
  }

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            การจัดการ Navbar เมนูนำทาง
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            ปรับเปลี่ยนลำดับของเมนูหลักและเมนูย่อยดรอปดาวน์ได้ตามต้องการ
          </p>
        </div>
        <button
          onClick={() => openCreateModal()}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-2xl shadow-lg shadow-indigo-600/10 transition flex items-center gap-2 text-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มเมนูหลัก / ย่อย</span>
        </button>
      </div>

      {/* Floating save notification toast */}
      {toast.show && (
        <div
          className={`fixed bottom-6 right-6 px-4 py-3 text-white text-xs font-semibold rounded-2xl shadow-2xl flex items-center gap-2 transition duration-300 transform z-50 ${
            toast.isError ? 'bg-rose-600' : 'bg-slate-900'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
          <span>{toast.msg}</span>
        </div>
      )}

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

      {/* Dynamic Drag-and-Drop / Reorder Menu Tree View */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
          <span className="text-sm font-bold text-slate-800">
            ผังโครงสร้างเมนูนำทาง (ปรับเปลี่ยนลำดับเมนูได้โดยใช้ปุ่มจัดลำดับด้านซ้ายสุด)
          </span>
        </div>

        <div className="space-y-3">
          {parentMenus.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Compass className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium">
                ยังไม่มีข้อมูลเมนูนำทาง กรุณากดปุ่มเพื่อสร้างเมนูใหม่
              </p>
            </div>
          ) : (
            parentMenus.map((parent, pIdx) => {
              const children = childMenus[parent.id] || []
              const hasChildren = children.length > 0
              const isCollapsed = !collapsedParents[parent.id] // default: open or collapsed

              return (
                <div
                  key={parent.id}
                  className="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden"
                >
                  {/* Parent Header row */}
                  <div className="p-4 bg-slate-50/70 hover:bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Reorder Up / Down Buttons */}
                      <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shrink-0 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => handleReorder(parent, 'up')}
                          disabled={pIdx === 0}
                          className="p-1 hover:bg-slate-100 text-slate-400 hover:text-indigo-600 rounded cursor-pointer disabled:opacity-20"
                          title="เลื่อนขึ้น"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReorder(parent, 'down')}
                          disabled={pIdx === parentMenus.length - 1}
                          className="p-1 hover:bg-slate-100 text-slate-400 hover:text-indigo-600 rounded cursor-pointer disabled:opacity-20"
                          title="เลื่อนลง"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Collapse Toggle Button */}
                      {hasChildren ? (
                        <button
                          type="button"
                          onClick={() => toggleParentCollapse(parent.id)}
                          className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition duration-200 shrink-0 select-none cursor-pointer"
                          title={isCollapsed ? 'ขยายเมนูย่อย' : 'ยุบเมนูย่อย'}
                        >
                          <ChevronDown
                            className="w-4 h-4 transition-transform duration-200"
                            style={{
                              transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                            }}
                          />
                        </button>
                      ) : (
                        <span className="w-7 shrink-0" />
                      )}

                      {/* Menu Icon & Label */}
                      <div className="flex items-center gap-2 font-bold text-slate-800 min-w-0">
                        {renderMenuIcon(parent.icon, 'w-4 h-4')}
                        <span className="truncate">{parent.label}</span>
                      </div>

                      <span className="hidden md:inline font-mono text-[10px] text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded truncate max-w-xs">
                        {parent.url}
                      </span>

                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                          parent.is_active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : 'bg-slate-100 text-slate-500 border border-slate-200/60'
                        }`}
                      >
                        {parent.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => openCreateModal(parent.id)}
                        className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-xl transition cursor-pointer"
                        title="เพิ่มเมนูย่อยภายใต้เมนูนี้"
                      >
                        + เมนูย่อย
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(parent)}
                        className="px-3 py-1.5 border border-slate-200 hover:border-slate-350 text-slate-600 hover:text-indigo-650 hover:bg-white text-xs font-semibold rounded-xl transition cursor-pointer"
                      >
                        แก้ไข
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(parent, true)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold rounded-xl transition cursor-pointer"
                      >
                        ลบ
                      </button>
                    </div>
                  </div>

                  {/* Child cards wrapper */}
                  {!isCollapsed && (
                    <div className="border-t border-slate-100 bg-slate-50/20 p-4 transition-all duration-350">
                      <div className="space-y-2">
                        {children.length > 0 ? (
                          children.map((child, cIdx) => {
                            const level3 = childMenus[child.id] || []
                            const hasLevel3 = level3.length > 0
                            const isL3Collapsed = !collapsedLevel3[child.id]

                            return (
                              <div key={child.id} className="space-y-2">
                                {/* Child item card */}
                                <div className="border border-slate-200/75 rounded-xl bg-white p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                    {/* Child Reorder */}
                                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-md p-0.5 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => handleReorder(child, 'up')}
                                        disabled={cIdx === 0}
                                        className="p-0.5 hover:bg-slate-200 text-slate-400 hover:text-indigo-600 rounded cursor-pointer disabled:opacity-20"
                                      >
                                        <ArrowUp className="w-3 h-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleReorder(child, 'down')}
                                        disabled={cIdx === children.length - 1}
                                        className="p-0.5 hover:bg-slate-200 text-slate-400 hover:text-indigo-600 rounded cursor-pointer disabled:opacity-20"
                                      >
                                        <ArrowDown className="w-3 h-3" />
                                      </button>
                                    </div>

                                    {/* Collapse Toggle for Level 3 */}
                                    {hasLevel3 ? (
                                      <button
                                        type="button"
                                        onClick={() => toggleLevel3Collapse(child.id)}
                                        className="p-1 hover:bg-slate-100 rounded text-slate-550 transition duration-200 shrink-0 select-none cursor-pointer"
                                      >
                                        <ChevronDown
                                          className="w-3.5 h-3.5 transition-transform duration-200"
                                          style={{
                                            transform: isL3Collapsed
                                              ? 'rotate(-90deg)'
                                              : 'rotate(0deg)',
                                          }}
                                        />
                                      </button>
                                    ) : (
                                      <CornerDownRight className="w-4 h-4 text-slate-300 shrink-0" />
                                    )}

                                    <div className="flex items-center gap-2 text-slate-700 min-w-0 font-medium">
                                      {renderMenuIcon(child.icon, 'w-3.5 h-3.5')}
                                      <span className="truncate">{child.label}</span>
                                    </div>

                                    <span className="hidden md:inline font-mono text-[9px] text-slate-450 bg-slate-50 border border-slate-150 px-1.5 py-0.5 rounded truncate max-w-xs">
                                      {child.url}
                                    </span>

                                    <span
                                      className={`px-1.5 py-0.5 text-[9px] font-bold rounded-full ${
                                        child.is_active
                                          ? 'bg-emerald-50 text-emerald-700'
                                          : 'bg-slate-100 text-slate-500'
                                      }`}
                                    >
                                      {child.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => openCreateModal(child.id)}
                                      className="px-2 py-1 text-[10px] font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                                      title="เพิ่มเมนูย่อยระดับ 3"
                                    >
                                      + ระดับ 3
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => openEditModal(child)}
                                      className="p-1 text-slate-400 hover:text-indigo-650 hover:bg-slate-50 rounded transition text-xs font-semibold cursor-pointer"
                                    >
                                      แก้ไข
                                    </button>
                                    <span className="text-slate-200">|</span>
                                    <button
                                      type="button"
                                      onClick={() => handleDelete(child, false)}
                                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded transition text-xs font-semibold cursor-pointer"
                                    >
                                      ลบ
                                    </button>
                                  </div>
                                </div>

                                {/* Sub-child list (Level 3) */}
                                {hasLevel3 && !isL3Collapsed && (
                                  <div className="pl-8 space-y-2 mt-2 mb-3 transition-all duration-350">
                                    {level3.map((subChild, scIdx) => (
                                      <div
                                        key={subChild.id}
                                        className="border border-slate-200/60 rounded-xl bg-slate-50/50 p-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-3xs"
                                      >
                                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                          <CornerDownRight className="w-4 h-4 text-slate-350 shrink-0" />

                                          <div className="flex items-center bg-white border border-slate-200 rounded p-0.5 shrink-0">
                                            <button
                                              type="button"
                                              onClick={() => handleReorder(subChild, 'up')}
                                              disabled={scIdx === 0}
                                              className="p-0.5 hover:bg-slate-100 text-slate-400 hover:text-indigo-600 rounded cursor-pointer disabled:opacity-20"
                                            >
                                              <ArrowUp className="w-2.5 h-2.5" />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleReorder(subChild, 'down')}
                                              disabled={scIdx === level3.length - 1}
                                              className="p-0.5 hover:bg-slate-100 text-slate-400 hover:text-indigo-600 rounded cursor-pointer disabled:opacity-20"
                                            >
                                              <ArrowDown className="w-2.5 h-2.5" />
                                            </button>
                                          </div>

                                          <div className="flex items-center gap-2 text-slate-600 min-w-0 font-medium">
                                            {renderMenuIcon(subChild.icon, 'w-3.5 h-3.5')}
                                            <span className="truncate text-xs">
                                              {subChild.label}
                                            </span>
                                          </div>

                                          <span className="hidden md:inline font-mono text-[9px] text-slate-400 bg-white border border-slate-150 px-1.5 py-0.5 rounded truncate max-w-xs">
                                            {subChild.url}
                                          </span>

                                          <span
                                            className={`px-1.5 py-0.5 text-[9px] font-bold rounded-full ${
                                              subChild.is_active
                                                ? 'bg-emerald-50 text-emerald-700'
                                                : 'bg-slate-100 text-slate-500'
                                            }`}
                                          >
                                            {subChild.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                                          </span>
                                        </div>

                                        <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                                          <button
                                            type="button"
                                            onClick={() => openEditModal(subChild)}
                                            className="p-1 text-slate-400 hover:text-indigo-650 hover:bg-slate-50 rounded transition text-xs font-semibold cursor-pointer"
                                          >
                                            แก้ไข
                                          </button>
                                          <span className="text-slate-200">|</span>
                                          <button
                                            type="button"
                                            onClick={() => handleDelete(subChild, false)}
                                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded transition text-xs font-semibold cursor-pointer"
                                          >
                                            ลบ
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )
                          })
                        ) : (
                          <div className="text-slate-400 py-2 text-xs italic px-6 select-none">
                            ไม่มีรายการเมนูย่อยในหัวข้อนี้
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Modal Form */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {modalMode === 'create' ? 'เพิ่มเมนูนำทาง' : 'แก้ไขเมนูนำทาง'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    ชื่อแสดงบนเมนู (Label) *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.label}
                    onChange={(e) => setForm({ ...form, label: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-sm outline-none transition"
                    placeholder="เช่น ข้อมูลพื้นฐาน"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    เมนูระดับบนสุด (Parent)
                  </label>
                  <select
                    value={form.parent_id}
                    onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-sm outline-none transition bg-white cursor-pointer"
                  >
                    <option value="">-- เป็นเมนูระดับแรก --</option>
                    {parentMenus
                      .filter((pm) => pm.id !== form.id)
                      .map((pm) => (
                        <React.Fragment key={pm.id}>
                          <option value={String(pm.id)}>{pm.label}</option>
                          {(childMenus[pm.id] || [])
                            .filter((cm) => cm.id !== form.id)
                            .map((cm) => (
                              <option key={cm.id} value={String(cm.id)}>
                                &nbsp;&nbsp;&nbsp;&nbsp;↳ {cm.label}
                              </option>
                            ))}
                        </React.Fragment>
                      ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    URL ลิงก์ปลายทาง *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.url}
                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                    placeholder="เช่น /news, /personnel, /ita หรือ https://..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-sm outline-none transition font-mono"
                  />
                  {/* Quick URL Shortcuts */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="text-[11px] text-slate-400 self-center">ลัด:</span>
                    {[
                      { label: 'หน้าแรก', url: '/' },
                      { label: 'ข่าวสาร', url: '/news' },
                      { label: 'บุคลากร', url: '/personnel' },
                      { label: 'ผู้บริหาร', url: '/executives' },
                      { label: 'หลักสูตร', url: '/curriculum' },
                      { label: 'ภาพกิจกรรม', url: '/gallery' },
                      { label: 'ดาวน์โหลด', url: '/downloads' },
                      { label: 'ITA', url: '/ita' },
                      { label: 'ร้องเรียน', url: '/complaints' },
                    ].map((s) => (
                      <button
                        key={s.url}
                        type="button"
                        onClick={() => setForm({ ...form, url: s.url })}
                        className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-md text-slate-600 transition cursor-pointer"
                      >
                        {s.label}
                      </button>
                    ))}
                    {staticPages.slice(0, 4).map((p) => (
                      <button
                        key={p.slug}
                        type="button"
                        onClick={() => setForm({ ...form, url: `/${p.slug}` })}
                        className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-md text-slate-600 transition cursor-pointer"
                      >
                        {p.title}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    ไอคอน (Lucide Icon name)
                  </label>
                  <input
                    type="text"
                    value={form.icon}
                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                    placeholder="เช่น home, info, users"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-sm outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    ลำดับการจัดวาง (Order)
                  </label>
                  <input
                    type="number"
                    value={form.order_num}
                    onChange={(e) =>
                      setForm({ ...form, order_num: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-sm outline-none transition"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="menu-is-active"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                  />
                  <label
                    htmlFor="menu-is-active"
                    className="text-sm font-medium text-slate-700 cursor-pointer"
                  >
                    เปิดใช้งานให้แสดงผล
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="menu-target-blank"
                    checked={form.target_blank}
                    onChange={(e) =>
                      setForm({ ...form, target_blank: e.target.checked })
                    }
                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                  />
                  <label
                    htmlFor="menu-target-blank"
                    className="text-sm font-medium text-slate-700 cursor-pointer"
                  >
                    เปิดลิงก์ในหน้าต่างใหม่ (New Tab)
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition font-semibold cursor-pointer disabled:opacity-50"
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
