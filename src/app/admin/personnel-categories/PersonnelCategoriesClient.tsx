'use client'

import React, { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Save,
  Plus,
  Folder,
  Users,
  Edit3,
  Edit2,
  Navigation,
  Trash2,
  Trash,
  PlusCircle,
  CornerDownRight,
  X,
  Search,
  Info,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Layers,
  ListTree,
  Compass,
} from 'lucide-react'
import { normalizeImageUrl } from '@/lib/url-helper'
import { swalConfirm } from '@/lib/sweetalert'

interface CategoryItem {
  id: number
  name: string
  order_num: number | null
  parent_id: number | null
}

interface PersonItem {
  id: number
  name: string
  position: string
  category_id: number | null
  is_head: boolean | null
  image_path: string | null
}

interface SpecialDutyRecord {
  id: number
  personnel_id: number
  category_id: number
  special_position: string | null
  is_head: boolean | null
}

interface NavbarRecord {
  id: number
  parent_id: number | null
  label: string
  url: string
}

export function PersonnelCategoriesClient({
  categories: initialCategories,
  personnel: initialPersonnel,
  specialDuties: initialSpecialDuties,
  navbars,
  initialSubId,
}: {
  categories: CategoryItem[]
  personnel: PersonItem[]
  specialDuties: SpecialDutyRecord[]
  navbars: NavbarRecord[]
  initialSubId?: number | null
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // State
  const [activeSubId, setActiveSubId] = useState<number | null>(initialSubId || null)
  const [msg, setMsg] = useState<string>('')
  const [err, setErr] = useState<string>('')

  // Orders state for inline order_num inputs
  const [orderMap, setOrderMap] = useState<Record<number, number>>(() => {
    const map: Record<number, number> = {}
    initialCategories.forEach((c) => {
      map[c.id] = c.order_num ?? 0
    })
    return map
  })

  // Category Modal State
  const [categoryModal, setCategoryModal] = useState<{
    open: boolean
    action: 'create' | 'create_sub' | 'update'
    id: number
    name: string
    parentId: string
    parentName?: string
  }>({
    open: false,
    action: 'create',
    id: 0,
    name: '',
    parentId: '',
  })

  // Navbar Modal State
  const [navbarModal, setNavbarModal] = useState<{
    open: boolean
    catId: number
    catName: string
    currentStatus: string
    parentNavId: string
    pageType: 'dept' | 'sub_dept'
    isAdded: boolean
  }>({
    open: false,
    catId: 0,
    catName: '',
    currentStatus: '',
    parentNavId: '',
    pageType: 'dept',
    isAdded: false,
  })

  // Manage Sub Department Assignment State
  const [deptSearch, setDeptSearch] = useState('')
  const [assignedMap, setAssignedMap] = useState<Record<number, boolean>>({})
  const [headMap, setHeadMap] = useState<Record<number, boolean>>({})

  // Build Navbar Map for badge display
  // Supports legacy URLs (personnel_dept.php?id=X) and modern URLs (/personnel/dept/X)
  const navMap: Record<
    string,
    { id: number; parent_id: number | null; label: string; parent_label?: string }
  > = {}

  // Find parent labels
  const navRecordMap = new Map<number, NavbarRecord>()
  navbars.forEach((n) => navRecordMap.set(n.id, n))

  navbars.forEach((n) => {
    const parent = n.parent_id ? navRecordMap.get(n.parent_id) : undefined
    navMap[n.url] = {
      id: n.id,
      parent_id: n.parent_id,
      label: n.label,
      parent_label: parent ? parent.label : undefined,
    }
  })

  // Helper to check navbar badge
  const getNavbarBadge = (catId: number, isSub = false) => {
    const legacyUrl = (isSub ? 'personnel_sub_dept.php?id=' : 'personnel_dept.php?id=') + catId
    const modernUrl = (isSub ? '/personnel/sub-dept/' : '/personnel/dept/') + catId
    const generalUrl = `/personnel?category=${catId}`

    const navItem = navMap[legacyUrl] || navMap[modernUrl] || navMap[generalUrl]
    if (!navItem) return null

    if (!navItem.parent_label) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mt-1.5 w-max">
          <Compass className="w-3 h-3" />
          อยู่บนแถบนำทางหลัก
        </span>
      )
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 mt-1.5 w-max">
        <Compass className="w-3 h-3" />
        ภายใต้เมนู: {navItem.parent_label}
      </span>
    )
  }

  // Categories partition
  const mainCategories = initialCategories.filter((c) => c.parent_id === null)
  const subCategories = initialCategories.filter((c) => c.parent_id !== null)
  const subCategoriesByParent: Record<number, CategoryItem[]> = {}
  subCategories.forEach((sub) => {
    if (sub.parent_id) {
      if (!subCategoriesByParent[sub.parent_id]) {
        subCategoriesByParent[sub.parent_id] = []
      }
      subCategoriesByParent[sub.parent_id].push(sub)
    }
  })

  // Root nav items for Navbar modal select
  const rootNavbars = navbars.filter((n) => n.parent_id === null)

  // -------------------------------------------------------------
  // Handlers for Categories
  // -------------------------------------------------------------
  const handleOrderChange = (id: number, val: number) => {
    setOrderMap((prev) => ({ ...prev, [id]: val }))
  }

  const handleSaveOrders = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg('')
    setErr('')
    try {
      const res = await fetch('/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'personnel_categories',
          action: 'update_order',
          data: { orders: orderMap },
        }),
      })
      if (!res.ok) throw new Error('เกิดข้อผิดพลาดในการบันทึกลำดับ')
      setMsg('อัปเดตลำดับการแสดงผลแผนก/ฝ่ายงานเรียบร้อยแล้ว')
      startTransition(() => router.refresh())
    } catch (err: any) {
      setErr(err.message || 'บันทึกลำดับไม่สำเร็จ')
    }
  }

  const openCreateModal = () => {
    setCategoryModal({
      open: true,
      action: 'create',
      id: 0,
      name: '',
      parentId: '',
    })
  }

  const openCreateSubModal = (parentId: number, parentName: string) => {
    setCategoryModal({
      open: true,
      action: 'create_sub',
      id: 0,
      name: '',
      parentId: String(parentId),
      parentName,
    })
  }

  const openEditModal = (cat: CategoryItem) => {
    setCategoryModal({
      open: true,
      action: 'update',
      id: cat.id,
      name: cat.name,
      parentId: cat.parent_id ? String(cat.parent_id) : '',
    })
  }

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!categoryModal.name.trim()) return
    setMsg('')
    setErr('')
    try {
      const res = await fetch('/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'personnel_categories',
          action: 'save',
          data: {
            id: categoryModal.id || undefined,
            name: categoryModal.name.trim(),
            parent_id: categoryModal.parentId ? Number(categoryModal.parentId) : null,
          },
        }),
      })
      if (!res.ok) throw new Error('บันทึกข้อมูลไม่สำเร็จ')
      setCategoryModal((prev) => ({ ...prev, open: false }))
      setMsg(
        categoryModal.action === 'create'
          ? 'สร้างฝ่าย/แผนกหลักเรียบร้อยแล้ว'
          : categoryModal.action === 'create_sub'
          ? 'สร้างแผนกย่อยเรียบร้อยแล้ว'
          : 'ปรับปรุงข้อมูลแผนก/ฝ่ายเรียบร้อยแล้ว'
      )
      startTransition(() => router.refresh())
    } catch (err: any) {
      setErr(err.message || 'เกิดข้อผิดพลาดในการบันทึก')
    }
  }

  const handleDeleteCategory = async (id: number, isSub = false) => {
    const confirmText = isSub
      ? 'ยืนยันลบแผนกย่อยนี้?'
      : 'ข้อมูลบุคลากรและแผนกย่อยทั้งหมดในหมวดนี้จะถูกลบออก ยืนยัน?'
    const ok = await swalConfirm({
      title: 'ยืนยันการลบ?',
      text: confirmText,
      confirmButtonText: 'ลบ',
    })
    if (!ok) return
    setMsg('')
    setErr('')
    try {
      const res = await fetch('/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'personnel_categories',
          action: 'delete',
          data: { id },
        }),
      })
      if (!res.ok) throw new Error('ลบไม่สำเร็จ')
      setMsg('ลบแผนก/ฝ่ายเรียบร้อยแล้ว')
      startTransition(() => router.refresh())
    } catch (err: any) {
      setErr(err.message || 'เกิดข้อผิดพลาดในการลบ')
    }
  }

  // -------------------------------------------------------------
  // Handlers for Add to Navbar
  // -------------------------------------------------------------
  const openNavbarModal = (cat: CategoryItem, isSub = false) => {
    const legacyUrl = (isSub ? 'personnel_sub_dept.php?id=' : 'personnel_dept.php?id=') + cat.id
    const modernUrl = (isSub ? '/personnel/sub-dept/' : '/personnel/dept/') + cat.id
    const generalUrl = `/personnel?category=${cat.id}`

    const navItem = navMap[legacyUrl] || navMap[modernUrl] || navMap[generalUrl]
    let statusText = ''
    let parentNavId = ''
    let isAdded = false

    if (navItem) {
      isAdded = true
      parentNavId = navItem.parent_id !== null ? String(navItem.parent_id) : ''
      statusText = !navItem.parent_label
        ? 'อยู่บนแถบนำทางหลัก'
        : `อยู่ภายใต้เมนู: ${navItem.parent_label}`
    }

    setNavbarModal({
      open: true,
      catId: cat.id,
      catName: cat.name,
      currentStatus: statusText,
      parentNavId,
      pageType: isSub ? 'sub_dept' : 'dept',
      isAdded,
    })
  }

  const handleSaveNavbar = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg('')
    setErr('')
    try {
      const res = await fetch('/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'personnel_categories',
          action: 'add_to_navbar',
          data: {
            cat_id: navbarModal.catId,
            label: navbarModal.catName,
            parent_nav_id: navbarModal.parentNavId ? Number(navbarModal.parentNavId) : null,
            page_type: navbarModal.pageType,
          },
        }),
      })
      if (!res.ok) throw new Error('เพิ่มลงแถบนำทางไม่สำเร็จ')
      setNavbarModal((prev) => ({ ...prev, open: false }))
      setMsg(
        navbarModal.isAdded
          ? 'ปรับปรุงเมนูนำทางของฝ่ายเรียบร้อยแล้ว'
          : 'เพิ่มหมวดหมู่ไปยังแถบนำทางเรียบร้อยแล้ว'
      )
      startTransition(() => router.refresh())
    } catch (err: any) {
      setErr(err.message || 'เกิดข้อผิดพลาดในการเพิ่มเมนู')
    }
  }

  // -------------------------------------------------------------
  // Handlers for Sub-Department Personnel Manager (manage_sub_department.php parity)
  // -------------------------------------------------------------
  const openSubDeptManager = (subId: number) => {
    setActiveSubId(subId)
    setDeptSearch('')

    // Initialize assigned & head maps for this subId
    const newAssigned: Record<number, boolean> = {}
    const newHead: Record<number, boolean> = {}

    initialPersonnel.forEach((p) => {
      const isPrimary = p.category_id === subId
      const specialDuty = initialSpecialDuties.find(
        (sd) => sd.personnel_id === p.id && sd.category_id === subId
      )
      const isAssigned = isPrimary || !!specialDuty
      const isHead = isPrimary ? !!p.is_head : !!specialDuty?.is_head

      newAssigned[p.id] = isAssigned
      newHead[p.id] = isHead
    })

    setAssignedMap(newAssigned)
    setHeadMap(newHead)
  }

  const handleToggleAssigned = (pId: number, checked: boolean) => {
    setAssignedMap((prev) => ({ ...prev, [pId]: checked }))
    if (!checked) {
      setHeadMap((prev) => ({ ...prev, [pId]: false }))
    }
  }

  const handleToggleHead = (pId: number, checked: boolean) => {
    setHeadMap((prev) => ({ ...prev, [pId]: checked }))
  }

  const handleSaveSubDeptAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeSubId) return
    setMsg('')
    setErr('')

    const assignedList = Object.entries(assignedMap)
      .filter(([_, assigned]) => assigned)
      .map(([id]) => Number(id))

    const headList = Object.entries(headMap)
      .filter(([id, isHead]) => isHead && assignedMap[Number(id)])
      .map(([id]) => Number(id))

    try {
      const res = await fetch('/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'personnel_categories',
          action: 'manage_sub_department_save',
          data: {
            sub_id: activeSubId,
            assigned_personnel: assignedList,
            head_personnel: headList,
          },
        }),
      })
      if (!res.ok) throw new Error('เกิดข้อผิดพลาดในการบันทึกข้อมูลการจัดสรรฝ่ายงาน')
      setMsg('บันทึกข้อมูลการจัดสรรบุคลากรและหัวหน้างานย่อยเรียบร้อยแล้ว')
      startTransition(() => router.refresh())
    } catch (err: any) {
      setErr(err.message || 'บันทึกไม่สำเร็จ')
    }
  }

  // =========================================================================
  // VIEW: Manage Sub Department Personnel (manage_sub_department.php 1:1)
  // =========================================================================
  if (activeSubId !== null) {
    const currentDept = initialCategories.find((c) => c.id === activeSubId)
    const parentDept = currentDept?.parent_id
      ? initialCategories.find((c) => c.id === currentDept.parent_id)
      : null

    const categoryMap = new Map<number, string>()
    initialCategories.forEach((c) => categoryMap.set(c.id, c.name))

    // Filter personnel by search term
    const searchLower = deptSearch.toLowerCase().trim()
    const filteredPersonnel = initialPersonnel.filter((p) => {
      if (!searchLower) return true
      const catName = categoryMap.get(p.category_id || 0) || ''
      return (
        p.name.toLowerCase().includes(searchLower) ||
        p.position.toLowerCase().includes(searchLower) ||
        catName.toLowerCase().includes(searchLower)
      )
    })

    return (
      <div className="space-y-6">
        {/* Title Header */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveSubId(null)}
              className="p-2 border border-slate-200 bg-white hover:bg-slate-100 text-slate-500 rounded-xl transition cursor-pointer"
              title="ย้อนกลับไปหน้ารายการแผนก/ฝ่ายงาน"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                จัดการจัดสรรบุคลากรประจำฝ่าย/แผนก
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {parentDept ? (
                  <>
                    ฝ่ายหลัก:{' '}
                    <span className="font-bold text-slate-700">{parentDept.name}</span>
                    &nbsp;|&nbsp; แผนกย่อย:{' '}
                    <span className="font-bold text-indigo-600">
                      {currentDept?.name || 'แผนกย่อย'}
                    </span>
                  </>
                ) : (
                  <>
                    ฝ่ายงานหลัก:{' '}
                    <span className="font-bold text-indigo-600">
                      {currentDept?.name || 'ฝ่ายหลัก'}
                    </span>
                  </>
                )}
              </p>
            </div>
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

        {/* Main 2-Column Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column: Department List Sidebar (1/4 width) */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm sticky top-6">
              <h2 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 mb-3 flex items-center gap-2">
                <ListTree className="w-4 h-4 text-indigo-600" />
                <span>ฝ่าย / แผนกงานทั้งหมด</span>
              </h2>
              <div className="space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
                {mainCategories.map((md) => {
                  const isActiveMd = activeSubId === md.id
                  const mdClass = isActiveMd
                    ? 'bg-indigo-50 text-indigo-700 font-bold border-l-4 border-indigo-600 pl-3'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 pl-4 border-l-4 border-transparent'

                  const subs = subCategoriesByParent[md.id] || []

                  return (
                    <div key={md.id} className="space-y-1">
                      <button
                        type="button"
                        onClick={() => openSubDeptManager(md.id)}
                        className={`w-full flex items-center justify-between py-2 pr-3 rounded-r-xl transition text-xs text-left cursor-pointer ${mdClass}`}
                      >
                        <span className="truncate" title={md.name}>
                          {md.name}
                        </span>
                        {isActiveMd && (
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />
                        )}
                      </button>

                      {subs.length > 0 && (
                        <div className="pl-4 space-y-1 border-l border-slate-100 ml-5">
                          {subs.map((sd) => {
                            const isActiveSd = activeSubId === sd.id
                            const sdClass = isActiveSd
                              ? 'bg-indigo-50 text-indigo-700 font-bold border-l-4 border-indigo-600 pl-3'
                              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 pl-4 border-l-4 border-transparent'

                            return (
                              <button
                                key={sd.id}
                                type="button"
                                onClick={() => openSubDeptManager(sd.id)}
                                className={`w-full flex items-center justify-between py-1.5 pr-2.5 rounded-r-lg transition text-[11px] text-left cursor-pointer ${sdClass}`}
                              >
                                <span className="truncate" title={sd.name}>
                                  {sd.name}
                                </span>
                                {isActiveSd && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />
                                )}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Management Form & Table (3/4 width) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Search and Help Bar */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              <div className="flex flex-col md:flex-row gap-3 items-center w-full xl:max-w-xl">
                <div className="relative w-full">
                  <input
                    type="text"
                    value={deptSearch}
                    onChange={(e) => setDeptSearch(e.target.value)}
                    placeholder="ค้นหาด้วยชื่อ, ตำแหน่ง หรือสังกัดดั้งเดิม..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-2xl text-sm outline-none transition"
                  />
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Search className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-400 flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>
                  <strong>สังกัดหลัก:</strong> สังกัดแผนกนี้โดยตรง |{' '}
                  <strong>หน้าที่พิเศษ:</strong> ร่วมทำงานในแผนกนี้เพิ่มเติม
                </span>
              </div>
            </div>

            {/* Main Form */}
            <form onSubmit={handleSaveSubDeptAssignment} className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-150 text-slate-500 text-xs font-bold uppercase bg-slate-50/50">
                        <th className="py-4 px-6 text-center w-28">เข้าร่วมแผนก</th>
                        <th className="py-4 px-4 w-16 text-center">รูปภาพ</th>
                        <th className="py-4 px-4">ชื่อ-นามสกุล</th>
                        <th className="py-4 px-4">ตำแหน่งงาน</th>
                        <th className="py-4 px-4">สังกัดหลักดั้งเดิม</th>
                        <th className="py-4 px-6 text-center w-40">ตั้งเป็นหัวหน้างาน</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {filteredPersonnel.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400">
                            <Users className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                            <span className="font-medium">ไม่พบข้อมูลบุคลากรในระบบ</span>
                          </td>
                        </tr>
                      ) : (
                        filteredPersonnel.map((p) => {
                          const isPrimary = p.category_id === activeSubId
                          const isAssigned = !!assignedMap[p.id]
                          const isHead = !!headMap[p.id]
                          const originalDeptName =
                            categoryMap.get(p.category_id || 0) || 'ไม่ระบุฝ่าย'

                          return (
                            <tr key={p.id} className="hover:bg-slate-50/50 transition">
                              {/* Assign Checkbox */}
                              <td className="py-4 px-6 text-center">
                                <label className="inline-flex items-center justify-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isAssigned}
                                    onChange={(e) =>
                                      handleToggleAssigned(p.id, e.target.checked)
                                    }
                                    className="w-4.5 h-4.5 text-indigo-600 bg-slate-100 border-slate-300 rounded focus:ring-indigo-500 transition cursor-pointer"
                                  />
                                </label>
                              </td>

                              {/* Avatar */}
                              <td className="py-4 px-4 text-center">
                                {p.image_path ? (
                                  <img
                                    src={normalizeImageUrl(p.image_path)}
                                    alt={p.name}
                                    className="w-10 h-10 rounded-full object-cover object-top border border-slate-200 mx-auto shadow-sm"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mx-auto">
                                    <Users className="w-5 h-5" />
                                  </div>
                                )}
                              </td>

                              {/* Name */}
                              <td className="py-4 px-4 font-bold text-slate-800">
                                <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
                                  <span>{p.name}</span>
                                  {isPrimary && (
                                    <span
                                      className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 w-fit"
                                      title="สังกัดหลักโดยตรง"
                                    >
                                      <ShieldCheck className="w-3 h-3" />
                                      <span>สังกัดหลัก</span>
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Position */}
                              <td className="py-4 px-4 text-slate-600 font-medium">
                                {p.position}
                              </td>

                              {/* Original Department */}
                              <td className="py-4 px-4 text-xs">
                                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 font-semibold">
                                  {originalDeptName}
                                </span>
                              </td>

                              {/* Head Checkbox */}
                              <td className="py-4 px-6 text-center">
                                <label className="inline-flex items-center justify-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isHead}
                                    disabled={!isAssigned}
                                    onChange={(e) =>
                                      handleToggleHead(p.id, e.target.checked)
                                    }
                                    className="w-4.5 h-4.5 text-rose-600 bg-slate-100 border-slate-300 rounded focus:ring-rose-500 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                  />
                                </label>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveSubId(null)}
                  className="px-6 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-2xl transition duration-150 cursor-pointer text-sm"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/20 transition duration-150 flex items-center gap-2 cursor-pointer text-sm disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>บันทึกการจัดสรรฝ่ายงาน</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // =========================================================================
  // VIEW: Main Category List (personnel_categories.php 1:1)
  // =========================================================================
  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/personnel"
            className="p-2 border border-slate-200 bg-white hover:bg-slate-100 text-slate-500 rounded-xl transition cursor-pointer"
            title="ย้อนกลับไปทำเนียบบุคลากร"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              การจัดการแผนก / ฝ่ายงาน
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              แบ่งโครงสร้างกลุ่มบุคลากร ฝ่ายหลัก และ แผนกย่อยภายในสถาบัน
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="submit"
            form="order-form"
            disabled={isPending}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-2xl shadow-lg shadow-emerald-600/10 transition flex items-center gap-2 text-sm cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>บันทึกการเรียงลำดับ</span>
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-2xl shadow-lg shadow-indigo-600/10 transition flex items-center gap-2 text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มฝ่ายหลักใหม่</span>
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

      {/* Categories Layout Grid */}
      <form onSubmit={handleSaveOrders} id="order-form" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {mainCategories.length === 0 ? (
            <div className="col-span-full bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400">
              <Layers className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <span className="font-medium text-slate-500 block">
                ยังไม่มีฝ่ายหรือแผนกหลักในระบบ
              </span>
            </div>
          ) : (
            mainCategories.map((cat) => {
              const subs = subCategoriesByParent[cat.id] || []

              return (
                <div
                  key={cat.id}
                  className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    {/* Main Category Header */}
                    <div className="flex justify-between items-start gap-4 pb-4 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={orderMap[cat.id] ?? 0}
                            onChange={(e) =>
                              handleOrderChange(cat.id, Number(e.target.value))
                            }
                            className="w-12 text-center px-1 py-0.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:border-indigo-500 outline-none"
                            title="ลำดับการแสดงผล"
                          />
                          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Folder className="w-5 h-5 text-indigo-500" />
                            <span>{cat.name}</span>
                          </h3>
                        </div>
                        <div className="flex flex-col mt-1">
                          <span className="text-xs text-slate-400 font-medium">
                            ฝ่ายหลัก (Parent Category)
                          </span>
                          {getNavbarBadge(cat.id, false)}
                        </div>
                      </div>

                      {/* Control Buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openSubDeptManager(cat.id)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition cursor-pointer"
                          title="จัดการบุคลากรและหัวหน้างาน"
                        >
                          <Users className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(cat)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition cursor-pointer"
                          title="แก้ไขชื่อฝ่าย"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openNavbarModal(cat, false)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-slate-50 rounded-lg transition cursor-pointer"
                          title="เพิ่มไปยังแถบนำทาง"
                        >
                          <Navigation className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat.id, false)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded-lg transition cursor-pointer"
                          title="ลบฝ่ายหลักนี้"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Subcategories Section */}
                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold text-slate-500">
                          แผนกย่อยภายในฝ่าย
                        </span>
                        {cat.name !== 'ฝ่ายบริหารสถานศึกษา' && (
                          <button
                            type="button"
                            onClick={() => openCreateSubModal(cat.id, cat.name)}
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 transition cursor-pointer"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>เพิ่มแผนกย่อย</span>
                          </button>
                        )}
                      </div>

                      <div className="space-y-2.5 max-h-[14rem] overflow-y-auto pr-1">
                        {subs.length > 0 ? (
                          subs.map((sub) => (
                            <div
                              key={sub.id}
                              className="flex justify-between items-center text-sm text-slate-700 bg-slate-50/60 hover:bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-150 transition"
                            >
                              <div className="flex flex-col font-medium min-w-0">
                                <div className="flex items-center gap-2">
                                  <CornerDownRight className="w-4 h-4 text-slate-400 shrink-0" />
                                  <input
                                    type="number"
                                    value={orderMap[sub.id] ?? 0}
                                    onChange={(e) =>
                                      handleOrderChange(sub.id, Number(e.target.value))
                                    }
                                    className="w-12 text-center px-1 py-0.5 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:border-indigo-500 outline-none shrink-0"
                                    title="ลำดับการแสดงผล"
                                  />
                                  <span className="truncate">{sub.name}</span>
                                </div>
                                <div className="pl-6 flex">
                                  {getNavbarBadge(sub.id, true)}
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0 ml-2">
                                <button
                                  type="button"
                                  onClick={() => openSubDeptManager(sub.id)}
                                  className="p-1 text-slate-400 hover:text-indigo-600 rounded transition cursor-pointer"
                                  title="จัดการบุคลากรและหัวหน้างานย่อย"
                                >
                                  <Users className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openEditModal(sub)}
                                  className="p-1 text-slate-400 hover:text-indigo-600 rounded transition cursor-pointer"
                                  title="แก้ไขชื่อ"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openNavbarModal(sub, true)}
                                  className="p-1 text-slate-400 hover:text-emerald-600 rounded transition cursor-pointer"
                                  title="เพิ่มไปยังแถบนำทาง"
                                >
                                  <Navigation className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCategory(sub.id, true)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                                  title="ลบ"
                                >
                                  <Trash className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4 text-slate-400 text-xs font-medium border border-dashed border-slate-200 rounded-2xl">
                            ยังไม่มีแผนกย่อย
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </form>

      {/* Add / Edit Main & Sub Category Modal */}
      {categoryModal.open && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() =>
                setCategoryModal((prev) => ({ ...prev, open: false }))
              }
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {categoryModal.action === 'create'
                ? 'เพิ่มฝ่ายงานหลัก'
                : categoryModal.action === 'create_sub'
                ? `เพิ่มแผนกย่อยภายใต้ "${categoryModal.parentName}"`
                : 'แก้ไขข้อมูลแผนก/ฝ่ายงาน'}
            </h3>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  ชื่อแผนก/ฝ่ายงาน *
                </label>
                <input
                  type="text"
                  required
                  value={categoryModal.name}
                  onChange={(e) =>
                    setCategoryModal((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-sm outline-none transition"
                  placeholder="เช่น ฝ่ายบริหารทรัพยากร"
                />
              </div>

              {categoryModal.action === 'update' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    สังกัดฝ่ายงานหลัก (Parent Department)
                  </label>
                  <select
                    value={categoryModal.parentId}
                    onChange={(e) =>
                      setCategoryModal((prev) => ({
                        ...prev,
                        parentId: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-sm outline-none transition"
                  >
                    <option value="">-- ไม่สังกัดฝ่ายใด (เป็นฝ่ายหลัก) --</option>
                    {mainCategories
                      .filter((p) => p.id !== categoryModal.id)
                      .map((pCat) => (
                        <option key={pCat.id} value={String(pCat.id)}>
                          {pCat.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() =>
                    setCategoryModal((prev) => ({ ...prev, open: false }))
                  }
                  className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add to Navbar Modal */}
      {navbarModal.open && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() =>
                setNavbarModal((prev) => ({ ...prev, open: false }))
              }
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {navbarModal.isAdded
                ? 'แก้ไขตำแหน่งในแถบนำทาง (Navbar)'
                : 'เพิ่มไปยังแถบนำทาง (Navbar)'}
            </h3>
            <p className="text-xs text-slate-500 mb-2">
              เป้าหมาย: สร้างปุ่มลิงก์สำหรับแผนก: {navbarModal.catName}
            </p>

            {navbarModal.currentStatus && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-xs flex items-center gap-2 mb-4">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <span className="font-bold">สถานะปัจจุบัน:</span> ถูกเพิ่มไว้แล้วที่{' '}
                  <span className="font-bold text-amber-900 underline">
                    {navbarModal.currentStatus}
                  </span>
                </div>
              </div>
            )}

            <form onSubmit={handleSaveNavbar} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  เลือกตำแหน่งเมนูหลัก (หรือปล่อยว่างไว้เพื่อสร้างเมนูบนสุด)
                </label>
                <select
                  value={navbarModal.parentNavId}
                  onChange={(e) =>
                    setNavbarModal((prev) => ({
                      ...prev,
                      parentNavId: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-sm outline-none transition"
                >
                  <option value="">-- เป็นเมนูระดับแรก (Root Level Menu) --</option>
                  {rootNavbars.map((navParent) => (
                    <option key={navParent.id} value={String(navParent.id)}>
                      {navParent.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  เลือกหน้าเพจเป้าหมายในการแสดงผล
                </label>
                <select
                  value={navbarModal.pageType}
                  onChange={(e) =>
                    setNavbarModal((prev) => ({
                      ...prev,
                      pageType: e.target.value as 'dept' | 'sub_dept',
                    }))
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-sm outline-none transition"
                >
                  <option value="dept">
                    โครงสร้างฝ่ายงานหลัก (personnel_dept.php)
                  </option>
                  <option value="sub_dept">
                    โครงสร้างแผนกย่อย/ฝ่ายย่อย (personnel_sub_dept.php)
                  </option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() =>
                    setNavbarModal((prev) => ({ ...prev, open: false }))
                  }
                  className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className={`px-4 py-2 text-sm text-white rounded-xl shadow-md transition cursor-pointer disabled:opacity-50 ${
                    navbarModal.isAdded
                      ? 'bg-indigo-600 hover:bg-indigo-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {navbarModal.isAdded ? 'ยืนยันการแก้ไข' : 'ยืนยันการเพิ่ม'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
