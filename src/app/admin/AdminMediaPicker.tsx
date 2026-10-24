'use client'

import React, { useState } from 'react'
import { Upload, CheckCircle2, Loader2, ExternalLink } from 'lucide-react'
import { normalizeImageUrl } from '@/lib/url-helper'

interface UploadFieldProps {
  label: string
  value: string
  onChange: (path: string) => void
  folder?: string
  accept?: string
  placeholder?: string
  previewImage?: boolean
  helpText?: string
}

export function AdminUploadField({
  label,
  value,
  onChange,
  folder = 'media',
  accept = 'image/*',
  placeholder = 'uploads/... หรือ URL',
  previewImage = true,
  helpText,
}: UploadFieldProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', folder)
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: fd,
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Upload failed')
      onChange(json.path)
    } catch (err: any) {
      setError(err.message || 'อัปโหลดล้มเหลว')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-slate-700">{label}</label>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        />
        <label className="inline-flex items-center justify-center px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium text-sm rounded-xl border border-indigo-200 transition-colors cursor-pointer shrink-0">
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              กำลังอัปโหลด...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              เลือกไฟล์อัปโหลด
            </>
          )}
          <input
            type="file"
            accept={accept}
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>
      {helpText && <p className="text-xs text-slate-500">{helpText}</p>}
      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
      {value && previewImage && (
        <div className="mt-2 flex items-center gap-3 p-2 bg-slate-50 border border-slate-200 rounded-xl w-fit">
          <img
            src={normalizeImageUrl(value)}
            alt="Preview"
            className="h-16 w-24 object-cover object-top rounded-lg border border-slate-200 bg-white"
            onError={(e) => {
              ;(e.target as HTMLImageElement).style.display = 'none'
            }}
          />
          <div className="text-xs text-slate-600 pr-2">
            <div className="font-medium text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> พร้อมใช้งาน
            </div>
            <div className="truncate max-w-[200px] text-slate-400">{value}</div>
          </div>
        </div>
      )}
      {value && !previewImage && (
        <div className="mt-1 flex items-center gap-2 text-xs text-indigo-600">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <a
            href={value.startsWith('http') || value.startsWith('/') ? value : `/${value}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline flex items-center gap-1"
          >
            {value} <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  )
}
