'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Award, UserPlus, Save, UserMinus, Search } from 'lucide-react'
import { normalizeImageUrl } from '@/lib/url-helper'
import { swalConfirm, swalSuccess } from '@/lib/sweetalert'

interface PersonRecord {
  id: number
  name: string
  position: string
  academic_standing: string | null
  image_path: string | null
  order_num: number | null
  is_executive: boolean | null
  personnel_categories?: { name: string } | null
}

export function ExecutivesAdminClient({
  allPersonnel,
}: {
  allPersonnel: PersonRecord[]
}) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'current' | 'appoint'>('current')
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)

  const isExec = (p: PersonRecord) => {
    if (p.is_executive) return true
    const pos = (p.position || '').trim()
    if (pos.includes('ผู้อำนวยการ') || pos.includes('รองผู้อำนวยการ')) return true
    if (p.personnel_categories?.name?.includes('ผู้บริหาร')) return true
    return false
  }

  const executives = allPersonnel.filter(isExec).sort((a, b) => {
    const getPrio = (p: PersonRecord) => {
      const pos = (p.position || '').trim()
      if (pos.includes('ผู้อำนวยการ') && !pos.includes('รอง')) return 1
      if (pos.includes('รองผู้อำนวยการ')) return 2
      if (p.is_executive) return 3
      return 4
    }
    const prioA = getPrio(a)
    const prioB = getPrio(b)
    if (prioA !== prioB) return prioA - prioB
    return (a.order_num ?? 9999) - (b.order_num ?? 9999)
  })

  const candidates = allPersonnel.filter((p) => !isExec(p))

  const [orders, setOrders] = useState<Record<number, number>>(() => {
    const map: Record<number, number> = {}
    executives.forEach((e, idx) => {
      map[e.id] = e.order_num ?? idx + 1
    })
    return map
  })

  const handleSaveOrders = async () => {
    setSaving(true)
    try {
      const payload = executives.map((e) => ({
        id: e.id,
        order_num: Number(orders[e.id] ?? e.order_num ?? 1),
      }))
      const res = await fetch('/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'executives',
          action: 'save_order',
          data: { orders: payload },
        }),
      })
      if (res.ok) {
        swalSuccess('สำเร็จ', 'บันทึกลำดับการแสดงผลคณะผู้บริหารเรียบร้อยแล้ว')
        router.refresh()
      }
    } finally {
      setSaving(false)
    }
  }

  const handleAppoint = async (personId: number) => {
    const res = await fetch('/api/admin/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        module: 'executives',
        action: 'appoint',
        data: { personnel_id: personId, order_num: executives.length + 1 },
      }),
    })
    if (res.ok) router.refresh()
  }

  const handleRemove = async (personId: number) => {
    const ok = await swalConfirm({
      title: 'ยืนยันการนำออก?',
      text: 'ต้องการนำรายชื่อนี้ออกจากทำเนียบผู้บริหารใช่หรือไม่? (ข้อมูลบุคลากรเดิมจะไม่ถูกลบ)',
      confirmButtonText: 'นำออก',
    })
    if (!ok) return
    const res = await fetch('/api/admin/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        module: 'executives',
        action: 'remove',
        data: { personnel_id: personId },
      }),
    })
    if (res.ok) router.refresh()
  }

  const filteredCandidates = candidates.filter(
    (c) =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.position.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-500" />
            จัดการทำเนียบผู้บริหาร ({executives.length} ท่าน)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            จัดลำดับการแสดงผลคณะผู้บริหารสถานศึกษา และแต่งตั้งบุคลากรเข้าสู่ทำเนียบผู้บริหาร
          </p>
        </div>
        <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('current')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'current'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            คณะผู้บริหารปัจจุบัน ({executives.length})
          </button>
          <button
            onClick={() => setActiveTab('appoint')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'appoint'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            + แต่งตั้งจากบุคลากร ({candidates.length})
          </button>
        </div>
      </div>

      {activeTab === 'current' ? (
        <div className="space-y-4">
          <div className="bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="font-bold text-slate-800 text-sm">
              รายชื่อผู้บริหารและลำดับการแสดงผล (เลขน้อยแสดงก่อน เช่น 1 = ผู้อำนวยการ)
            </h2>
            {executives.length > 0 && (
              <button
                onClick={handleSaveOrders}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-1.5" />
                {saving ? 'กำลังบันทึก...' : 'บันทึกลำดับการแสดงผล'}
              </button>
            )}
          </div>

          {executives.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 shadow-sm">
              ยังไม่มีรายชื่อในทำเนียบผู้บริหาร กดแท็บ &ldquo;แต่งตั้งจากบุคลากร&rdquo; ด้านบนเพื่อเพิ่ม
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {executives.map((exec) => (
                <div
                  key={exec.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-200 transition-all p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-500">ลำดับที่:</span>
                        <input
                          type="number"
                          value={orders[exec.id] ?? exec.order_num ?? 1}
                          onChange={(e) =>
                            setOrders({ ...orders, [exec.id]: Number(e.target.value) })
                          }
                          className="w-16 text-center bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 font-bold text-slate-800 text-xs"
                        />
                      </div>
                      {exec.position?.includes('ผู้อำนวยการ') && !exec.position?.includes('รอง') ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold shadow-xs">
                          <Award className="w-3 h-3 mr-0.5" /> ผู้อำนวยการ
                        </span>
                      ) : exec.position?.includes('รองผู้อำนวยการ') ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold shadow-xs">
                          <Award className="w-3 h-3 mr-0.5" /> รองผู้อำนวยการ
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                          <Award className="w-3 h-3 mr-0.5 text-rose-500" /> ครู ทำหน้าที่รองผู้อำนวยการ
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col items-center text-center">
                      <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-amber-200 bg-slate-100 mb-3 shadow-sm">
                        {exec.image_path ? (
                          <img
                            src={normalizeImageUrl(exec.image_path)}
                            alt={exec.name}
                            className="w-full h-full object-cover object-top"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-slate-400">
                            {exec.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <h3 className="font-bold text-slate-800 text-base">{exec.name}</h3>
                      <div className="text-xs font-semibold text-indigo-700 mt-0.5">
                        {exec.position}
                      </div>
                      {exec.is_executive && !exec.position?.includes('ผู้อำนวยการ') && (
                        <div className="text-xs font-bold text-rose-600 mt-0.5">
                          (ครู ทำหน้าที่รองผู้อำนวยการ)
                        </div>
                      )}
                      {exec.academic_standing && (
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {exec.academic_standing}
                        </div>
                      )}
                      {exec.personnel_categories?.name && (
                        <div className="text-[11px] text-slate-400 mt-1">
                          {exec.personnel_categories.name}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100">
                    <button
                      onClick={() => handleRemove(exec.id)}
                      className="w-full inline-flex items-center justify-center px-3 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors cursor-pointer"
                    >
                      <UserMinus className="w-3.5 h-3.5 mr-1.5" />
                      นำออกจากทำเนียบผู้บริหาร
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <div className="relative max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาชื่อบุคลากรเพื่อแต่งตั้ง..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {filteredCandidates.map((c) => (
              <div
                key={c.id}
                className="px-6 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 bg-slate-100">
                    {c.image_path ? (
                      <img
                        src={normalizeImageUrl(c.image_path)}
                        alt={c.name}
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400">
                        {c.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800 text-sm">{c.name}</div>
                    <div className="text-xs text-slate-500">
                      {c.position} • {c.personnel_categories?.name || 'ไม่ระบุสังกัด'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleAppoint(c.id)}
                  className="inline-flex items-center px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                  แต่งตั้งเป็นผู้บริหาร
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
