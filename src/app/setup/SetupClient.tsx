'use client'

import React, { useState, useEffect } from 'react'
import {
  Server,
  Database,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FolderCheck,
  FolderX,
  Globe,
  User,
  KeyRound,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ArrowRight,
  ArrowLeft,
  Loader2,
  RefreshCw,
  Lock,
  ExternalLink,
} from 'lucide-react'
import Link from 'next/link'
import type { SystemRequirementsResult } from '@/lib/installer'

export function SetupClient({
  initialData,
}: {
  initialData: SystemRequirementsResult
}) {
  const [data, setData] = useState<SystemRequirementsResult>(initialData)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)

  // Form states
  const [adminUsername, setAdminUsername] = useState('admin')
  const [adminEmail, setAdminEmail] = useState('admin@cric.ac.th')
  const [adminPassword, setAdminPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [siteName, setSiteName] = useState('วิทยาลัยการอาชีพเชียงราย')
  const [siteTitle, setSiteTitle] = useState(
    'Chiang Rai Industrial and Community Education College'
  )
  const [currentYear, setCurrentYear] = useState('2569')
  const [sitePhone, setSitePhone] = useState('053-774422')
  const [siteEmail, setSiteEmail] = useState('cric@cric.ac.th')
  const [siteAddress, setSiteAddress] = useState(
    '111 หมู่ 8 ต.ป่าซาง อ.แม่จัน จ.เชียงราย 57110'
  )

  // Install states
  const [installing, setInstalling] = useState(false)
  const [installLogs, setInstallLogs] = useState<string[]>([])
  const [installSuccess, setInstallSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [dbTesting, setDbTesting] = useState(false)
  const [dbTestMessage, setDbTestMessage] = useState('')

  // Database configuration states
  const [dbHost, setDbHost] = useState('172.17.0.1')
  const [dbPort, setDbPort] = useState('3306')
  const [dbUser, setDbUser] = useState('cric_web')
  const [dbPass, setDbPass] = useState('@cricweb26')
  const [dbName, setDbName] = useState('cric_web')

  // Refresh status
  const refreshStatus = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/setup')
      const json = await res.json()
      if (json.success) {
        setData(json.data)
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false)
    }
  }

  // Test DB connection
  const handleTestDb = async (save: boolean = true) => {
    setDbTesting(true)
    setDbTestMessage('')
    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test_db',
          dbHost,
          dbPort,
          dbUser,
          dbPass,
          dbName,
          saveConfig: save,
        }),
      })
      const json = await res.json()
      if (json.connected) {
        setDbTestMessage(`✅ ${json.message}`)
        setData((prev) => ({
          ...prev,
          databaseConnected: true,
          databaseName: json.databaseName || dbName,
          existingTablesCount: json.existingTablesCount || 0,
        }))
      } else {
        setDbTestMessage(`❌ ${json.message}`)
      }
    } catch (e: any) {
      setDbTestMessage(`❌ ข้อผิดพลาด: ${e.message}`)
    } finally {
      setDbTesting(false)
    }
  }

  // Handle Installation
  const handleInstall = async () => {
    if (adminPassword.length < 6) {
      setErrorMessage('รหัสผ่านผู้ดูแลระบบต้องมีความยาวอย่างน้อย 6 ตัวอักษร')
      return
    }
    if (adminPassword !== confirmPassword) {
      setErrorMessage('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน')
      return
    }

    setInstalling(true)
    setErrorMessage('')
    setInstallLogs(['กำลังส่งคำสั่งติดตั้งระบบ...'])

    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'install',
          adminUsername,
          adminPassword,
          adminEmail,
          siteName,
          siteTitle,
          currentYear,
          sitePhone,
          siteEmail,
          siteAddress,
          forceInstall: true,
        }),
      })

      const json = await res.json()
      if (json.logs) {
        setInstallLogs(json.logs)
      }

      if (json.success) {
        setInstallSuccess(true)
        setStep(5)
      } else {
        setErrorMessage(json.message || 'การติดตั้งล้มเหลว')
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์')
    } finally {
      setInstalling(false)
    }
  }

  // If already installed and not on success step
  if (data.isInstalled && !installSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200/80 p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800">
              ระบบได้รับการติดตั้งแล้ว
            </h1>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              เว็บไซต์และฐานข้อมูลนี้ถูกตั้งค่าและเปิดใช้งานเรียบร้อยแล้ว
              ระบบจึงล็อกหน้าติดตั้งเพื่อความปลอดภัย
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 text-left space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-500">ฐานข้อมูล:</span>
              <span className="font-mono text-emerald-700 font-bold">
                {data.databaseName || 'cric_cms'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-500">สถานะเซิร์ฟเวอร์:</span>
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                ออนไลน์ปกติ
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200 text-slate-400">
              * หากต้องการติดตั้งใหม่ทั้งหมด กรุณาลบไฟล์{' '}
              <code className="text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded">
                installed.lock
              </code>{' '}
              บนเซิร์ฟเวอร์
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href="/admin/login"
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <ShieldCheck className="w-5 h-5" />
              เข้าสู่ระบบจัดการหลังบ้าน (Admin Login)
            </Link>
            <Link
              href="/"
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-all cursor-pointer"
            >
              <Globe className="w-5 h-5" />
              ไปยังหน้าหลักเว็บไซต์ (Home)
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50/30 py-10 px-4">
      <div className="max-w-3xl w-full mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500" />
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full mb-3">
            <Server className="w-3.5 h-3.5" />
            CRiC Web CMS Setup Wizard
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">
            ตัวช่วยติดตั้งระบบสำหรับเซิร์ฟเวอร์ใหม่
          </h1>
          <p className="text-sm text-slate-500 mt-2 max-w-lg mx-auto">
            เตรียมโครงสร้างฐานข้อมูล บัญชีผู้ดูแลระบบ และข้อมูลเริ่มต้นให้พร้อมใช้งานทันที
          </p>

          {/* Stepper Indicator */}
          <div className="flex items-center justify-center gap-2 sm:gap-4 mt-8">
            {[
              { num: 1, label: 'ความพร้อม' },
              { num: 2, label: 'ฐานข้อมูล' },
              { num: 3, label: 'ผู้ดูแลระบบ' },
              { num: 4, label: 'ข้อมูลองค์กร' },
              { num: 5, label: 'เสร็จสิ้น' },
            ].map((s) => (
              <div key={s.num} className="flex items-center gap-1.5 sm:gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step === s.num
                      ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 shadow'
                      : step > s.num || installSuccess
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {step > s.num || installSuccess ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    s.num
                  )}
                </div>
                <span
                  className={`text-xs font-medium hidden sm:inline ${
                    step === s.num
                      ? 'text-indigo-600 font-bold'
                      : step > s.num
                      ? 'text-emerald-600'
                      : 'text-slate-400'
                  }`}
                >
                  {s.label}
                </span>
                {s.num < 5 && (
                  <div
                    className={`w-4 sm:w-8 h-0.5 ${
                      step > s.num ? 'bg-emerald-400' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 text-red-700 text-sm">
            <XCircle className="w-5 h-5 shrink-0 text-red-500" />
            <p>{errorMessage}</p>
          </div>
        )}

        {/* Wizard Steps */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-6">
          {/* STEP 1: System Requirements */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    ขั้นตอนที่ 1: ตรวจสอบความพร้อมของเซิร์ฟเวอร์
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    ตรวจสอบสภาพแวดล้อม สิทธิ์การเขียนไฟล์ และการเชื่อมต่อฐานข้อมูล
                  </p>
                </div>
                <button
                  type="button"
                  onClick={refreshStatus}
                  disabled={loading}
                  className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                  title="รีเฟรชการตรวจสอบ"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
                  />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Node version */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                      JS
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Node Runtime</p>
                      <p className="text-sm font-bold text-slate-800">
                        {data.nodeVersion}
                      </p>
                    </div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </div>

                {/* Database Connection */}
                <div
                  className={`p-4 rounded-2xl border flex items-center justify-between ${
                    data.databaseConnected
                      ? 'border-emerald-200 bg-emerald-50/50'
                      : 'border-red-200 bg-red-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        data.databaseConnected
                          ? 'bg-emerald-100 text-emerald-600'
                          : 'bg-red-100 text-red-600'
                      }`}
                    >
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">ฐานข้อมูล MariaDB/MySQL</p>
                      <p className="text-sm font-bold text-slate-800">
                        {data.databaseConnected
                          ? `เชื่อมต่อแล้ว (${data.databaseName})`
                          : 'เชื่อมต่อไม่สำเร็จ'}
                      </p>
                    </div>
                  </div>
                  {data.databaseConnected ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>

                {/* Uploads writable */}
                <div
                  className={`p-4 rounded-2xl border flex items-center justify-between ${
                    data.uploadsWritable
                      ? 'border-slate-200 bg-slate-50'
                      : 'border-red-200 bg-red-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        data.uploadsWritable
                          ? 'bg-sky-100 text-sky-600'
                          : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {data.uploadsWritable ? (
                        <FolderCheck className="w-5 h-5" />
                      ) : (
                        <FolderX className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">โฟลเดอร์ไฟล์อัปโหลด</p>
                      <p className="text-sm font-bold text-slate-800">
                        /public/uploads
                      </p>
                    </div>
                  </div>
                  {data.uploadsWritable ? (
                    <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-md">
                      เขียนได้
                    </span>
                  ) : (
                    <span className="text-xs text-red-600 font-bold bg-red-50 px-2 py-1 rounded-md">
                      ไม่มีสิทธิ์เขียน
                    </span>
                  )}
                </div>

                {/* Backups writable */}
                <div
                  className={`p-4 rounded-2xl border flex items-center justify-between ${
                    data.backupsWritable
                      ? 'border-slate-200 bg-slate-50'
                      : 'border-red-200 bg-red-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        data.backupsWritable
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {data.backupsWritable ? (
                        <FolderCheck className="w-5 h-5" />
                      ) : (
                        <FolderX className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">โฟลเดอร์สำรองข้อมูล</p>
                      <p className="text-sm font-bold text-slate-800">/backups</p>
                    </div>
                  </div>
                  {data.backupsWritable ? (
                    <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-md">
                      เขียนได้
                    </span>
                  ) : (
                    <span className="text-xs text-red-600 font-bold bg-red-50 px-2 py-1 rounded-md">
                      ไม่มีสิทธิ์เขียน
                    </span>
                  )}
                </div>
              </div>

              {(!data.uploadsWritable || !data.backupsWritable) && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 space-y-2">
                  <p className="font-bold flex items-center gap-1.5 text-sm text-red-900">
                    <FolderX className="w-4 h-4 text-red-600" />
                    วิธีแก้ไขสิทธิ์โฟลเดอร์บนเซิร์ฟเวอร์ Linux
                  </p>
                  <p className="text-slate-600">
                    รันคำสั่งนี้บน Terminal ของเซิร์ฟเวอร์เพื่อให้คอนเทนเนอร์มีสิทธิ์เขียนไฟล์:
                  </p>
                  <div className="p-2.5 bg-slate-900 text-emerald-400 font-mono rounded-xl select-all text-[11px]">
                    chown -R 1001:1001 public/uploads backups &amp;&amp; chmod -R 775 public/uploads backups
                  </div>
                </div>
              )}

              {!data.databaseConnected && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 space-y-2">
                  <p className="font-bold flex items-center gap-1.5 text-sm text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    ยังไม่สามารถติดต่อฐานข้อมูลได้
                  </p>
                  <p className="text-slate-700">
                    หากใช้ MariaDB/MySQL บนเซิร์ฟเวอร์ (เช่น aaPanel) กรุณาตรวจสอบ:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1">
                    <li>
                      <strong>สิทธิ์การเข้าถึง (Access Permission):</strong> ใน aaPanel ให้แก้ไข Database ตั้งเป็น <code>Everyone (%)</code> หรืออนุญาตจาก IP <code>172.17.0.1</code>
                    </li>
                    <li>
                      <strong>ชื่อฐานข้อมูลและรหัสผ่าน:</strong> ตรวจสอบว่าตรงกับในไฟล์ <code>.env</code> หรือ <code>docker-compose.yml</code> (รหัสผ่านที่มีอักขระพิเศษ <code>@</code> ให้ใช้ <code>%40</code> แทน)
                    </li>
                  </ul>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  ถัดไป: ฐานข้อมูล
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Database Status & Test */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  ขั้นตอนที่ 2: ตั้งค่าและการเชื่อมต่อฐานข้อมูล (MariaDB/MySQL)
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  กรอกข้อมูลบัญชีฐานข้อมูลเพื่อทดสอบการเชื่อมต่อ และระบบจะสร้าง 27 ตารางหลักให้อัตโนมัติ
                </p>
              </div>

              {/* Status summary */}
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between ${
                  data.databaseConnected
                    ? 'border-emerald-200 bg-emerald-50/50'
                    : 'border-amber-200 bg-amber-50/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      data.databaseConnected
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-amber-100 text-amber-600'
                    }`}
                  >
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">สถานะการเชื่อมต่อปัจจุบัน</p>
                    <p className="text-sm font-bold text-slate-800">
                      {data.databaseConnected
                        ? `เชื่อมต่อสำเร็จ: ${data.databaseName} (พบ ${data.existingTablesCount} ตาราง)`
                        : 'ยังไม่ได้เชื่อมต่อ หรือการเชื่อมต่อล้มเหลว'}
                    </p>
                  </div>
                </div>
                {data.databaseConnected ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-amber-500" />
                )}
              </div>

              {/* DB Connection Form */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-600" />
                  พารามิเตอร์การเชื่อมต่อฐานข้อมูล (Database Credentials)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Host / Server IP
                    </label>
                    <input
                      type="text"
                      value={dbHost}
                      onChange={(e) => setDbHost(e.target.value)}
                      placeholder="172.17.0.1"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500">
                      <span>ค่าที่แนะนำ:</span>
                      <button
                        type="button"
                        onClick={() => setDbHost('172.17.0.1')}
                        className="text-indigo-600 hover:underline bg-indigo-50 px-1.5 py-0.5 rounded cursor-pointer"
                      >
                        172.17.0.1 (Linux Host)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDbHost('host.docker.internal')}
                        className="text-indigo-600 hover:underline bg-indigo-50 px-1.5 py-0.5 rounded cursor-pointer"
                      >
                        host.docker.internal
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Port
                    </label>
                    <input
                      type="text"
                      value={dbPort}
                      onChange={(e) => setDbPort(e.target.value)}
                      placeholder="3306"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      ชื่อผู้ใช้ฐานข้อมูล (Username)
                    </label>
                    <input
                      type="text"
                      value={dbUser}
                      onChange={(e) => setDbUser(e.target.value)}
                      placeholder="cric_web"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      รหัสผ่าน (Password)
                    </label>
                    <input
                      type="password"
                      value={dbPass}
                      onChange={(e) => setDbPass(e.target.value)}
                      placeholder="@cricweb26"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      ชื่อฐานข้อมูล (Database)
                    </label>
                    <input
                      type="text"
                      value={dbName}
                      onChange={(e) => setDbName(e.target.value)}
                      placeholder="cric_web"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {dbTestMessage && (
                  <div
                    className={`p-3 rounded-xl border text-xs font-semibold ${
                      dbTestMessage.startsWith('✅')
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-red-50 border-red-200 text-red-800'
                    }`}
                  >
                    {dbTestMessage}
                  </div>
                )}

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleTestDb(true)}
                    disabled={dbTesting}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow transition-all cursor-pointer disabled:opacity-50"
                  >
                    {dbTesting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Database className="w-3.5 h-3.5" />
                    )}
                    ทดสอบและบันทึกการเชื่อมต่อฐานข้อมูล
                  </button>
                </div>
              </div>

              {/* Troubleshooting hint */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600 space-y-1.5">
                <p className="font-bold text-slate-700">💡 เคล็ดลับการตั้งค่าบน Linux / aaPanel:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>
                    หากรันบน Linux Server โดยมี MySQL ติดตั้งอยู่บนโฮสต์ แนะนำให้ใช้ Host: <code className="text-indigo-600 font-bold bg-indigo-50 px-1 py-0.5 rounded">172.17.0.1</code>
                  </li>
                  <li>
                    ใน aaPanel เมนู <strong>Databases</strong> ตรวจสอบว่าสิทธิ์เข้าถึง (Access Permission) ของผู้ใช้ <code className="font-bold">{dbUser}</code> ตั้งเป็น <strong>Everyone (%)</strong> หรือไม่
                  </li>
                </ul>
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold text-sm transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  ย้อนกลับ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!data.databaseConnected) {
                      setErrorMessage('กรุณาทดสอบและเชื่อมต่อฐานข้อมูลให้สำเร็จก่อนดำเนินการต่อ')
                      return
                    }
                    setErrorMessage('')
                    setStep(3)
                  }}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  ถัดไป: ตั้งค่าบัญชีผู้ดูแลระบบ
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Admin Account */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  ขั้นตอนที่ 3: บัญชีผู้ดูแลระบบสูงสุด (Super Administrator)
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  ใช้สำหรับเข้าจัดการระบบหลังบ้าน (/admin) มีสิทธิ์เต็มทุกโมดูล
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    ชื่อผู้ใช้งาน (Username)
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      required
                      placeholder="admin"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    อีเมลผู้ดูแลระบบ (Admin Email)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      required
                      placeholder="admin@cric.ac.th"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      รหัสผ่าน (Password)
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        required
                        placeholder="อย่างน้อย 6 ตัวอักษร"
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      ยืนยันรหัสผ่าน (Confirm Password)
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        placeholder="กรอกรหัสผ่านซ้ำอีกครั้ง"
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold text-sm transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  ย้อนกลับ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (adminPassword.length < 6) {
                      setErrorMessage('กรุณาระบุรหัสผ่านอย่างน้อย 6 ตัวอักษร')
                      return
                    }
                    if (adminPassword !== confirmPassword) {
                      setErrorMessage('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน')
                      return
                    }
                    setErrorMessage('')
                    setStep(4)
                  }}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  ถัดไป: ข้อมูลองค์กร
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Site Profile */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  ขั้นตอนที่ 4: ข้อมูลพื้นฐานของหน่วยงานและเว็บไซต์
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  ข้อมูลนี้สามารถแก้ไขเปลี่ยนแปลงได้ภายหลังผ่านเมนู &quot;ตั้งค่าทั่วไป&quot;
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    ชื่อหน่วยงาน / สถานศึกษา
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={siteName}
                      onChange={(e) => setSiteName(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    ชื่อภาษาอังกฤษ / สโลแกน
                  </label>
                  <input
                    type="text"
                    value={siteTitle}
                    onChange={(e) => setSiteTitle(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      ปีการศึกษา / ปี ITA
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="number"
                        value={currentYear}
                        onChange={(e) => setCurrentYear(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      เบอร์โทรศัพท์ติดต่อ
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={sitePhone}
                        onChange={(e) => setSitePhone(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      อีเมลกลางของหน่วยงาน
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        value={siteEmail}
                        onChange={(e) => setSiteEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    ที่อยู่หน่วยงาน
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <textarea
                      rows={2}
                      value={siteAddress}
                      onChange={(e) => setSiteAddress(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold text-sm transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  ย้อนกลับ
                </button>
                <button
                  type="button"
                  disabled={installing}
                  onClick={handleInstall}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {installing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      กำลังติดตั้งระบบ...
                    </>
                  ) : (
                    <>
                      🚀 เริ่มต้นการติดตั้งระบบทันที
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {installing && (
                <div className="mt-4 p-4 bg-slate-900 text-slate-200 rounded-2xl font-mono text-xs space-y-1 max-h-48 overflow-y-auto">
                  {installLogs.map((log, idx) => (
                    <div key={idx} className="leading-relaxed">
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 5: Success & Completion */}
          {step === 5 && (
            <div className="text-center py-6 space-y-6">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h2 className="text-2xl font-extrabold text-slate-800">
                  🎉 ติดตั้งระบบเสร็จสมบูรณ์เรียบร้อยแล้ว!
                </h2>
                <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
                  ระบบได้สร้างตารางฐานข้อมูล บัญชีผู้ดูแลระบบ ({adminUsername})
                  และการตั้งค่าทั้งหมดพร้อมใช้งานบนเซิร์ฟเวอร์เรียบร้อยแล้ว
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl max-w-md mx-auto text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">ชื่อผู้ดูแลระบบ:</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {adminUsername}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">หน่วยงาน:</span>
                  <span className="font-bold text-slate-800">{siteName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ไฟล์ล็อกความปลอดภัย:</span>
                  <span className="font-mono text-emerald-600 font-bold">
                    installed.lock
                  </span>
                </div>
              </div>

              {installLogs.length > 0 && (
                <div className="max-w-md mx-auto text-left p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-[11px] max-h-36 overflow-y-auto">
                  {installLogs.map((l, i) => (
                    <div key={i}>{l}</div>
                  ))}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto pt-2">
                <Link
                  href="/admin/login"
                  className="inline-flex items-center justify-center gap-2 py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  เข้าสู่ระบบหลังบ้าน (Admin Login)
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  ไปที่หน้าแรกของเว็บไซต์
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
