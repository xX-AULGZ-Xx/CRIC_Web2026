import React from 'react'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { UserCog } from 'lucide-react'

export default async function AdminUsersPage() {
  const session = await getSession()
  if (!session || session.role !== 'admin') redirect('/admin')

  const users = await prisma.users.findMany({
    select: {
      id: true,
      username: true,
      role: true,
      email: true,
      created_at: true,
      allowed_pages: true,
    },
    orderBy: { id: 'asc' },
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
          <UserCog className="w-6 h-6 text-orange-500" />
          <span>จัดการผู้ใช้งานระบบหลังบ้าน (Users Management)</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          รายชื่อผู้ใช้งานและสิทธิ์การเข้าถึงทั้งหมด ({users.length} บัญชี)
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 px-6">ชื่อผู้ใช้งาน (Username)</th>
                <th className="py-3.5 px-4">สิทธิ์การใช้งาน (Role)</th>
                <th className="py-3.5 px-4">อีเมล</th>
                <th className="py-3.5 px-4">สิทธิ์เฉพาะ (Allowed Pages)</th>
                <th className="py-3.5 px-4">วันที่สร้างบัญชี</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-6 font-bold text-white">
                    {u.username}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        u.role === 'admin'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          : u.role === 'editor'
                          ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                    {u.email || '-'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate text-[11px]">
                    {u.role === 'admin' ? 'ทุกโมดูล (Full Access)' : u.allowed_pages || 'ตามบทบาทพื้นฐาน'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString('th-TH') : '-'}
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
