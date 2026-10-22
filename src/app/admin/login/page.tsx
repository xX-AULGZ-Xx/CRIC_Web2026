'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, User, AlertCircle, ArrowLeft, Loader2, ShieldCheck } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง')
      }

      router.push('/admin')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 relative">
      <Link
        href="/"
        className="absolute top-6 left-6 inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>กลับสู่หน้าเว็บไซต์</span>
      </Link>

      <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-orange-600/20 text-orange-500 border border-orange-500/30 flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            เข้าสู่ระบบจัดการ
          </h1>
          <p className="text-xs text-slate-400">
            ระบบบริหารจัดการเว็บไซต์ วิทยาลัยการอาชีพเชียงราย
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-400 flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              ชื่อผู้ใช้งาน (Username)
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="กรอกชื่อผู้ใช้..."
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              รหัสผ่าน (Password)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="กรอกรหัสผ่าน..."
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-orange-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50 mt-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>กำลังเข้าสู่ระบบ...</span>
              </>
            ) : (
              <span>เข้าสู่ระบบ</span>
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-[11px] text-slate-500">
            ระบบความปลอดภัยสำหรับบุคลากรภายในวิทยาลัยเท่านั้น
          </p>
        </div>
      </div>
    </div>
  )
}
