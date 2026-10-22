import React from 'react'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { Images } from 'lucide-react'

export default async function AdminGalleriesPage() {
  const session = await getSession()
  if (!session) redirect('/admin/login')

  const albums = await prisma.galleries.findMany({
    include: {
      _count: { select: { gallery_images: true } },
    },
    orderBy: { created_at: 'desc' },
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
          <Images className="w-6 h-6 text-orange-500" />
          <span>จัดการคลังภาพกิจกรรม</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          อัลบั้มภาพทั้งหมด ({albums.length} อัลบั้ม)
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 px-6">ชื่ออัลบั้มกิจกรรม</th>
                <th className="py-3.5 px-4 text-center">จำนวนรูป</th>
                <th className="py-3.5 px-4">วันที่สร้าง</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {albums.map((a) => (
                <tr key={a.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-6 font-bold text-white max-w-md truncate">
                    {a.title}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-orange-400">
                    {a._count.gallery_images} รูป
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                    {a.created_at ? new Date(a.created_at).toLocaleDateString('th-TH') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
