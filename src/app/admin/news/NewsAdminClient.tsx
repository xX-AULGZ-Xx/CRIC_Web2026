'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Newspaper,
  Plus,
  Pencil,
  Trash2,
  X,
  FolderPlus,
  Search,
  Eye,
  Tag,
  FileText,
  Upload,
  Loader2,
  RotateCw,
  Sparkles,
  Clock,
  Image as ImageIcon,
  ExternalLink,
  MoveVertical,
  CheckCircle2,
  Star,
  CheckSquare,
  Square,
} from 'lucide-react'
import CKEditorField from '../CKEditorField'
import { normalizeImageUrl } from '@/lib/url-helper'
import { swalConfirm, swalSuccess, swalError, swalWarning } from '@/lib/sweetalert'

const FacebookIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
)

interface NewsCategory {
  id: number
  name: string
  slug: string
}

interface GalleryOption {
  id: number
  title: string
}

interface NewsItem {
  id: number
  title: string
  slug: string
  content: string | null
  cover_image: string | null
  cover_position: string | null
  category_id: number | null
  status: 'draft' | 'published' | null
  views: number | null
  gallery_id: number | null
  additional_images: string | null
  pdf_path: string | null
  meta_title: string | null
  meta_description: string | null
  created_at: string | null
  news_categories?: { id: number; name: string } | null
  news_tags?: Array<{ tag_name: string }>
}

export function NewsAdminClient({
  initialNews,
  categories,
  galleries,
}: {
  initialNews: NewsItem[]
  categories: NewsCategory[]
  galleries: GalleryOption[]
}) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const [modalOpen, setModalOpen] = useState(false)
  const [catModalOpen, setCatModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingMulti, setUploadingMulti] = useState(false)
  const [rotating, setRotating] = useState(false)

  // Facebook Import State
  const [fbOpen, setFbOpen] = useState(false)
  const [fbUrl, setFbUrl] = useState('')
  const [fbLoading, setFbLoading] = useState(false)
  const [fbPreview, setFbPreview] = useState<{
    title: string
    content: string
    images: string[]
  } | null>(null)
  const [fbSelectedImages, setFbSelectedImages] = useState<string[]>([])
  const [fbCoverImage, setFbCoverImage] = useState<string>('')
  const [fbImporting, setFbImporting] = useState(false)

  // Cover Image Drag Focal State
  const [isDraggingCover, setIsDraggingCover] = useState(false)
  const [dragStartY, setDragStartY] = useState(0)
  const [dragStartPos, setDragStartPos] = useState(50)

  const [catForm, setCatForm] = useState({ id: 0, name: '', slug: '' })

  const [form, setForm] = useState({
    id: 0,
    title: '',
    slug: '',
    content: '',
    cover_image: '',
    cover_position: '50%',
    category_id: '',
    status: 'published' as 'draft' | 'published',
    gallery_id: '',
    additional_images: [] as string[],
    pdf_path: '',
    tags: '',
    meta_title: '',
    meta_description: '',
    created_at: '',
  })

  const parseAdditionalImages = (raw: string | null): string[] => {
    if (!raw) return []
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    } catch {
      // comma separated fallback
    }
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }

  const getNowDatetimeLocal = () => {
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    return now.toISOString().slice(0, 16)
  }

  const openCreate = () => {
    setForm({
      id: 0,
      title: '',
      slug: '',
      content: '',
      cover_image: '',
      cover_position: '50%',
      category_id: categories[0]?.id ? String(categories[0].id) : '',
      status: 'published',
      gallery_id: '',
      additional_images: [],
      pdf_path: '',
      tags: '',
      meta_title: '',
      meta_description: '',
      created_at: getNowDatetimeLocal(),
    })
    setFbOpen(false)
    setFbPreview(null)
    setFbSelectedImages([])
    setFbCoverImage('')
    setFbUrl('')
    setModalOpen(true)
  }

  const openEdit = (n: NewsItem) => {
    let dt = ''
    if (n.created_at) {
      try {
        const d = new Date(n.created_at)
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
        dt = d.toISOString().slice(0, 16)
      } catch {
        dt = ''
      }
    }

    setForm({
      id: n.id,
      title: n.title || '',
      slug: n.slug || '',
      content: n.content || '',
      cover_image: n.cover_image || '',
      cover_position: n.cover_position || '50%',
      category_id: n.category_id ? String(n.category_id) : '',
      status: n.status || 'published',
      gallery_id: n.gallery_id ? String(n.gallery_id) : '',
      additional_images: parseAdditionalImages(n.additional_images),
      pdf_path: n.pdf_path || '',
      tags: n.news_tags?.map((t) => t.tag_name).join(', ') || '',
      meta_title: n.meta_title || '',
      meta_description: n.meta_description || '',
      created_at: dt || getNowDatetimeLocal(),
    })
    setFbOpen(false)
    setFbPreview(null)
    setFbSelectedImages([])
    setFbCoverImage('')
    setFbUrl('')
    setModalOpen(true)
  }

  // Cover Image Local Upload
  const handleLocalCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const fd = new FormData()
      fd.append('folder', 'news')
      fd.append('file', file)
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Upload failed')
      setForm((prev) => ({
        ...prev,
        cover_image: json.path || json.url,
      }))
    } catch (err: any) {
      swalError('อัปโหลดรูปภาพไม่สำเร็จ', err.message)
    } finally {
      e.target.value = ''
    }
  }

  // PDF Local Upload
  const handleLocalPdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const fd = new FormData()
      fd.append('folder', 'news')
      fd.append('file', file)
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Upload failed')
      setForm((prev) => ({
        ...prev,
        pdf_path: json.path || json.url,
      }))
    } catch (err: any) {
      swalError('อัปโหลด PDF ไม่สำเร็จ', err.message)
    } finally {
      e.target.value = ''
    }
  }

  // Multi Image Upload
  const handleMultiImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploadingMulti(true)
    try {
      const fd = new FormData()
      fd.append('folder', 'news')
      for (let i = 0; i < files.length; i++) {
        fd.append('files', files[i])
      }
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Upload failed')
      const newPaths = (json.files || []).map((f: any) => f.path)
      setForm((prev) => ({
        ...prev,
        additional_images: [...prev.additional_images, ...newPaths],
      }))
    } catch (err: any) {
      swalError('อัปโหลดรูปภาพไม่สำเร็จ', err.message)
    } finally {
      setUploadingMulti(false)
      e.target.value = ''
    }
  }

  // Cover Image Rotation (Canvas 90 degrees)
  const handleRotateCover = async () => {
    if (!form.cover_image) return
    setRotating(true)
    try {
      const imgUrl = normalizeImageUrl(form.cover_image)
      const img = new Image()
      img.crossOrigin = 'anonymous'
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = imgUrl
      })

      const canvas = document.createElement('canvas')
      canvas.width = img.height
      canvas.height = img.width
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Cannot get canvas context')

      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate((90 * Math.PI) / 180)
      ctx.drawImage(img, -img.width / 2, -img.height / 2)

      const blob: Blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('Blob creation failed'))),
          'image/jpeg',
          0.92
        )
      })

      const fd = new FormData()
      fd.append('folder', 'news')
      fd.append('file', blob, `rotated_${Date.now()}.jpg`)

      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Rotate upload failed')

      setForm((prev) => ({ ...prev, cover_image: json.path || json.url }))
    } catch (err: any) {
      swalError('ไม่สามารถหมุนภาพได้', err.message || '')
    } finally {
      setRotating(false)
    }
  }

  // Cover Focal Drag Helper
  const getCoverFocalPercent = (pos: string | null) => {
    if (!pos) return 50
    const m = pos.match(/\d+/)
    if (m) return Math.max(0, Math.min(100, parseInt(m[0], 10)))
    if (pos.includes('top')) return 20
    if (pos.includes('bottom')) return 80
    return 50
  }

  const handleMouseDownCover = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDraggingCover(true)
    setDragStartY(e.clientY)
    setDragStartPos(getCoverFocalPercent(form.cover_position))
  }

  const handleMouseMoveCover = (e: React.MouseEvent) => {
    if (!isDraggingCover) return
    const deltaY = e.clientY - dragStartY
    const newPos = Math.max(0, Math.min(100, Math.round(dragStartPos + deltaY * 0.4)))
    setForm((prev) => ({ ...prev, cover_position: `${newPos}%` }))
  }

  const handleMouseUpCover = () => {
    setIsDraggingCover(false)
  }

  // Decode HTML numeric & named entities on client for absolute safety
  const decodeEntitiesClient = (text: string): string => {
    if (!text) return ''
    let prev = ''
    let current = String(text)
    let passes = 0
    while (current !== prev && passes < 4) {
      prev = current
      passes++
      current = current
        .replace(/&#x([0-9a-fA-F]+);?/gi, (_, hex) => {
          try {
            return String.fromCharCode(parseInt(hex, 16))
          } catch {
            return _
          }
        })
        .replace(/&#([0-9]+);?/g, (_, dec) => {
          try {
            return String.fromCharCode(parseInt(dec, 10))
          } catch {
            return _
          }
        })
        .replace(/&quot;/gi, '"')
        .replace(/&apos;/gi, "'")
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&hellip;/gi, '...')
        .replace(/&copy;/gi, '©')
        .replace(/&amp;/gi, '&')
    }
    return current
  }

  // Facebook Import Actions
  const handlePreviewFb = async () => {
    if (!fbUrl.trim()) {
      swalWarning('กรุณากรอกข้อมูล', 'กรุณากรอก URL โพสต์ Facebook')
      return
    }
    setFbLoading(true)
    try {
      const res = await fetch('/api/admin/news/facebook-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'preview', url: fbUrl.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'ไม่สามารถดึงข้อมูลได้')
      const imgList: string[] = json.images || []
      const decodedTitle = decodeEntitiesClient(json.title || '').trim()
      const decodedContent = decodeEntitiesClient(json.content || '').trim()

      setFbPreview({
        title: decodedTitle,
        content: decodedContent,
        images: imgList,
      })
      setFbSelectedImages(imgList)
      setFbCoverImage(imgList.length > 0 ? imgList[0] : '')
    } catch (err: any) {
      swalError('ไม่สามารถดึงข้อมูล Facebook ได้', err.message)
    } finally {
      setFbLoading(false)
    }
  }

  const toggleFbImageSelection = (img: string) => {
    if (fbSelectedImages.includes(img)) {
      const updated = fbSelectedImages.filter((i) => i !== img)
      setFbSelectedImages(updated)
      if (fbCoverImage === img) {
        setFbCoverImage(updated.length > 0 ? updated[0] : '')
      }
    } else {
      const updated = [...fbSelectedImages, img]
      setFbSelectedImages(updated)
      if (!fbCoverImage) {
        setFbCoverImage(img)
      }
    }
  }

  const setAsFbCover = (img: string) => {
    setFbCoverImage(img)
    if (!fbSelectedImages.includes(img)) {
      setFbSelectedImages([...fbSelectedImages, img])
    }
  }

  const handleToggleSelectAllFbImages = () => {
    if (!fbPreview) return
    if (fbSelectedImages.length === fbPreview.images.length) {
      setFbSelectedImages([])
      setFbCoverImage('')
    } else {
      setFbSelectedImages([...fbPreview.images])
      if (!fbCoverImage && fbPreview.images.length > 0) {
        setFbCoverImage(fbPreview.images[0])
      }
    }
  }

  const handleConfirmFbImport = async () => {
    if (!fbPreview) return
    setFbImporting(true)
    try {
      let downloadedCover = ''
      let downloadedAdd: string[] = []

      // Separate designated cover image and remaining selected images
      const nonCoverImages = fbSelectedImages.filter((img) => img !== fbCoverImage)

      if (fbCoverImage || nonCoverImages.length > 0) {
        const res = await fetch('/api/admin/news/facebook-import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'download_images',
            cover_image: fbCoverImage || undefined,
            images: nonCoverImages,
          }),
        })
        const json = await res.json()
        if (res.ok) {
          downloadedCover = json.cover_image || ''
          downloadedAdd = json.additional_images || []
        }
      }

      const formattedContent = fbPreview.content
        ? `<p>${fbPreview.content.replace(/\r?\n\r?\n/g, '</p><p>').replace(/\r?\n/g, '<br/>')}</p>`
        : form.content

      setForm((prev) => ({
        ...prev,
        title: fbPreview.title || prev.title,
        content: formattedContent,
        cover_image: downloadedCover || prev.cover_image,
        additional_images: [...prev.additional_images, ...downloadedAdd],
      }))

      setFbPreview(null)
      setFbSelectedImages([])
      setFbCoverImage('')
      setFbUrl('')
      setFbOpen(false)
      swalSuccess('สำเร็จ', 'นำเข้าข้อมูลและรูปภาพจาก Facebook สำเร็จ!')
    } catch (err: any) {
      swalError('นำเข้าไม่สำเร็จ', err.message)
    } finally {
      setFbImporting(false)
    }
  }

  // Auto SEO Helper
  const handleAutoSEO = () => {
    const cleanContent = (form.content || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    setForm((prev) => ({
      ...prev,
      meta_title: prev.title.slice(0, 100),
      meta_description: cleanContent.slice(0, 160),
    }))
  }

  // Save News
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!form.title.trim()) {
      swalWarning('ข้อมูลไม่ครบถ้วน', 'กรุณาระบุหัวข้อข่าว')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'news',
          action: 'save',
          data: {
            ...form,
            category_id: form.category_id ? Number(form.category_id) : null,
            gallery_id: form.gallery_id ? Number(form.gallery_id) : null,
          },
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'บันทึกไม่สำเร็จ')
      setModalOpen(false)
      router.refresh()
    } catch (err: any) {
      swalError('บันทึกไม่สำเร็จ', err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    const ok = await swalConfirm({
      title: 'ยืนยันการลบข่าว?',
      text: 'รายการข่าวนี้และรูปภาพประกอบจะถูกลบออกจากระบบอย่างถาวร',
      confirmButtonText: 'ลบข่าว',
    })
    if (!ok) return
    const res = await fetch('/api/admin/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ module: 'news', action: 'delete', data: { id } }),
    })
    if (res.ok) router.refresh()
  }

  // Category Manager
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!catForm.name.trim()) return
    const res = await fetch('/api/admin/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        module: 'news',
        action: 'save_category',
        data: catForm,
      }),
    })
    if (res.ok) {
      setCatForm({ id: 0, name: '', slug: '' })
      router.refresh()
    }
  }

  const handleDeleteCategory = async (id: number) => {
    const ok = await swalConfirm({
      title: 'ยืนยันการลบหมวดหมู่?',
      text: 'ต้องการลบหมวดหมู่นี้ใช่หรือไม่? (ข่าวในหมวดนี้จะกลายเป็นไม่มีหมวด)',
      confirmButtonText: 'ลบหมวดหมู่',
    })
    if (!ok) return
    const res = await fetch('/api/admin/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        module: 'news',
        action: 'delete_category',
        data: { id },
      }),
    })
    if (res.ok) router.refresh()
  }

  // Filtering
  const filteredNews = initialNews.filter((n) => {
    const matchSearch =
      !search ||
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.news_tags?.some((t) => t.tag_name.toLowerCase().includes(search.toLowerCase()))
    const matchCat = filterCategory === 'all' || String(n.category_id) === filterCategory
    const matchStatus = filterStatus === 'all' || n.status === filterStatus
    return matchSearch && matchCat && matchStatus
  })

  // Content Stats
  const cleanText = (form.content || '').replace(/<[^>]*>/g, ' ').trim()
  const wordCount = cleanText ? cleanText.split(/\s+/).filter(Boolean).length : 0
  const charCount = cleanText.length
  const readingTime = Math.max(1, Math.ceil(wordCount / 180))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-indigo-600" />
            การจัดการข่าวประชาสัมพันธ์ ({initialNews.length} รายการ)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            เพิ่ม แก้ไข ข่าวสาร กิจกรรม ประกาศ นำเข้าจาก Facebook จัดตำแหน่งภาพปก และแนบไฟล์เอกสาร
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setCatModalOpen(true)}
            className="inline-flex items-center px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors cursor-pointer"
          >
            <FolderPlus className="w-4 h-4 mr-1.5 text-slate-500" />
            หมวดหมู่ข่าว ({categories.length})
          </button>
          <button
            onClick={openCreate}
            className="inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            เขียนข่าวประชาสัมพันธ์ใหม่
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาตามชื่อเรื่อง หรือแท็ก..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-700 font-medium"
        >
          <option value="all">ทุกหมวดหมู่ข่าว</option>
          {categories.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-700 font-medium"
        >
          <option value="all">ทุกสถานะ ({filteredNews.length})</option>
          <option value="published">เผยแพร่สู่หน้าเว็บ (Published)</option>
          <option value="draft">ฉบับร่าง (Draft)</option>
        </select>
      </div>

      {/* News Card Grid List */}
      {filteredNews.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 shadow-sm">
          ไม่พบรายการข่าวสาร
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredNews.map((n) => (
            <div
              key={n.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all overflow-hidden flex flex-col group justify-between"
            >
              <div>
                {/* 16:9 Cover Image with object-position */}
                <div className="aspect-video bg-slate-100 relative overflow-hidden">
                  {n.cover_image ? (
                    <img
                      src={normalizeImageUrl(n.cover_image)}
                      alt={n.title}
                      style={{ objectPosition: `center ${n.cover_position || '50%'}` }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1">
                      <Newspaper className="w-8 h-8 opacity-40" />
                      <span className="text-xs">ไม่มีภาพปก</span>
                    </div>
                  )}

                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/95 text-indigo-700 shadow-sm backdrop-blur-sm">
                      {n.news_categories?.name || 'ทั่วไป'}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold shadow-sm ${
                        n.status === 'published'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-amber-500 text-white'
                      }`}
                    >
                      {n.status === 'published' ? 'เผยแพร่' : 'ฉบับร่าง'}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-3">
                  <h3 className="font-bold text-slate-800 line-clamp-2 leading-snug text-base">
                    {n.title}
                  </h3>

                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" /> {n.views || 0} ครั้ง
                    </span>
                    <span>•</span>
                    <span>
                      {n.created_at
                        ? new Date(n.created_at).toLocaleDateString('th-TH', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '-'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {n.pdf_path && (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-red-50 text-red-600 text-[11px] font-semibold">
                        <FileText className="w-3 h-3" /> PDF
                      </span>
                    )}
                    {n.gallery_id && (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-purple-50 text-purple-600 text-[11px] font-semibold">
                        <ImageIcon className="w-3 h-3" /> อัลบั้ม
                      </span>
                    )}
                    {n.news_tags &&
                      n.news_tags.map((t) => (
                        <span
                          key={t.tag_name}
                          className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px]"
                        >
                          <Tag className="w-2.5 h-2.5" /> {t.tag_name}
                        </span>
                      ))}
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 bg-slate-50/50">
                <a
                  href={`/news/${n.slug || n.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" /> ดูตัวอย่าง
                </a>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEdit(n)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" /> แก้ไข
                  </button>
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> ลบ
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FULL-SCREEN WORKSPACE MODAL (Clean, No Horizontal Scrollbars, Sticky Top Header & Sticky Bottom Actions) */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-slate-900/60 backdrop-blur-sm overflow-hidden"
          onMouseMove={handleMouseMoveCover}
          onMouseUp={handleMouseUpCover}
        >
          <div className="bg-white w-full h-full md:max-h-[96vh] md:max-w-7xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header (Fixed at top) */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Newspaper className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg leading-tight">
                    {form.id ? 'แก้ไขข่าวประชาสัมพันธ์' : 'เขียนข่าวประชาสัมพันธ์ใหม่'}
                  </h3>
                  <span className="text-xs text-slate-400">
                    {form.id ? `รหัสบทความ: #${form.id}` : 'สร้างเนื้อหาและเผยแพร่สู่หน้าเว็บหลัก'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFbOpen(!fbOpen)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                    fbOpen
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                  }`}
                >
                  <FacebookIcon className="w-3.5 h-3.5 fill-current" />
                  {fbOpen ? 'ปิดกล่อง Facebook' : 'นำเข้าจาก Facebook'}
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-8 space-y-6">
              {/* FACEBOOK IMPORT BOX (Legacy 1:1 Accordion) */}
              {fbOpen && (
                <div className="bg-gradient-to-r from-blue-50/70 to-indigo-50/70 border-2 border-blue-200 rounded-2xl p-5 space-y-4 shadow-sm animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-blue-900 flex items-center gap-2">
                      <FacebookIcon className="w-4 h-4 text-blue-600 fill-current" />
                      นำเข้าข้อมูลโพสต์จาก Facebook อัตโนมัติ
                    </label>
                    <span className="text-xs text-blue-600">
                      ดึงข้อความ รูปภาพปก และรูปภาพทั้งหมดมาใส่ในข่าวทันที
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={fbUrl}
                      onChange={(e) => setFbUrl(e.target.value)}
                      placeholder="วางลิงก์โพสต์ Facebook ที่นี่ (เช่น https://www.facebook.com/...)"
                      className="flex-1 px-4 py-2 bg-white border border-blue-200 focus:border-blue-500 rounded-xl text-sm outline-none font-sans"
                    />
                    <button
                      type="button"
                      onClick={handlePreviewFb}
                      disabled={fbLoading}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition shrink-0 flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                      {fbLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> กำลังตรวจสอบ...
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4" /> ตรวจสอบลิงก์
                        </>
                      )}
                    </button>
                  </div>

                  {/* Facebook Preview Box */}
                  {fbPreview && (
                    <div className="bg-white rounded-2xl border border-blue-200 p-5 space-y-5 shadow-sm">
                      <div className="border-b border-slate-100 pb-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-blue-600" /> หัวข้อข่าวที่ตรวจพบ
                          </span>
                          <div className="flex items-center gap-2">
                            {fbPreview.content && (
                              <button
                                type="button"
                                onClick={() => {
                                  const clean = fbPreview.content
                                    .replace(/\s+/g, ' ')
                                    .replace(/<[^>]*>/g, '')
                                    .trim()
                                  if (clean) {
                                    setFbPreview({
                                      ...fbPreview,
                                      title:
                                        clean.slice(0, 95) +
                                        (clean.length > 95 ? '...' : ''),
                                    })
                                  }
                                }}
                                className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold hover:underline cursor-pointer flex items-center gap-1 bg-blue-50/80 px-2 py-0.5 rounded-md"
                              >
                                <Sparkles className="w-3 h-3 text-amber-500" /> ดึงหัวข้อจากเนื้อหา
                              </button>
                            )}
                            <span className="text-[11px] text-slate-400 font-medium">
                              {fbPreview.title.length} ตัวอักษร
                            </span>
                          </div>
                        </div>
                        <input
                          type="text"
                          value={fbPreview.title}
                          onChange={(e) =>
                            setFbPreview({ ...fbPreview, title: e.target.value })
                          }
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl text-sm font-semibold text-slate-800 outline-none transition"
                          placeholder="หัวข้อข่าว..."
                        />
                      </div>

                      <div className="border-b border-slate-100 pb-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-blue-600" /> ข้อความเนื้อหาโพสต์
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {fbPreview.content.length} ตัวอักษร (ปรับแต่งย่อหน้าได้)
                          </span>
                        </div>
                        <textarea
                          rows={6}
                          value={fbPreview.content}
                          onChange={(e) =>
                            setFbPreview({ ...fbPreview, content: e.target.value })
                          }
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl text-xs leading-relaxed text-slate-700 outline-none transition font-sans"
                          placeholder="เนื้อหาข่าว..."
                        ></textarea>
                      </div>

                      {fbPreview.images.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                            <div>
                              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                <ImageIcon className="w-4 h-4 text-blue-600" />
                                รูปภาพที่ตรวจพบ ({fbPreview.images.length} รูป)
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                เลือกนำเข้า {fbSelectedImages.length} รูป • คลิกรูปหรือดาวเพื่อตั้งเป็น <strong className="text-amber-600">ภาพปกหลัก</strong>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={handleToggleSelectAllFbImages}
                              className="self-start sm:self-auto px-3 py-1 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                            >
                              {fbSelectedImages.length === fbPreview.images.length ? (
                                <>
                                  <Square className="w-3.5 h-3.5" /> ยกเลิกการเลือกทั้งหมด
                                </>
                              ) : (
                                <>
                                  <CheckSquare className="w-3.5 h-3.5 text-blue-600" /> เลือกทั้งหมด
                                </>
                              )}
                            </button>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            {fbPreview.images.map((img, idx) => {
                              const isSelected = fbSelectedImages.includes(img)
                              const isCover = fbCoverImage === img

                              return (
                                <div
                                  key={idx}
                                  className={`group relative rounded-xl overflow-hidden border-2 transition-all flex flex-col bg-white shadow-2xs ${
                                    isCover
                                      ? 'border-amber-500 ring-2 ring-amber-400/40 shadow-md'
                                      : isSelected
                                      ? 'border-blue-500'
                                      : 'border-slate-200 opacity-50 grayscale hover:grayscale-0 hover:opacity-100'
                                  }`}
                                >
                                  {/* Thumbnail Preview */}
                                  <div
                                    className="aspect-square relative cursor-pointer overflow-hidden bg-slate-100"
                                    onClick={() => toggleFbImageSelection(img)}
                                  >
                                    <img
                                      src={img}
                                      alt=""
                                      referrerPolicy="no-referrer"
                                      onError={(e) => {
                                        const target = e.currentTarget
                                        if (!target.dataset.triedProxy) {
                                          target.dataset.triedProxy = 'true'
                                          target.src = `/api/admin/news/facebook-import?action=proxy_image&url=${encodeURIComponent(img)}`
                                        }
                                      }}
                                      className="w-full h-full object-cover transition duration-200 group-hover:scale-105"
                                    />

                                    {/* Selection Checkbox */}
                                    <div
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        toggleFbImageSelection(img)
                                      }}
                                      className="absolute top-1.5 left-1.5 p-1 rounded-md bg-black/60 hover:bg-black/80 backdrop-blur-xs text-white transition cursor-pointer"
                                    >
                                      {isSelected ? (
                                        <CheckSquare className="w-4 h-4 text-emerald-400" />
                                      ) : (
                                        <Square className="w-4 h-4 text-white/80" />
                                      )}
                                    </div>

                                    {/* Index / Cover Badge */}
                                    {isCover ? (
                                      <div className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold shadow-md flex items-center gap-1">
                                        <Star className="w-2.5 h-2.5 fill-current" /> ปกหลัก
                                      </div>
                                    ) : (
                                      <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 text-[9px] text-white font-medium">
                                        #{idx + 1}
                                      </span>
                                    )}
                                  </div>

                                  {/* Bottom Action: Set as Cover */}
                                  <div className="p-1.5 bg-slate-50 border-t border-slate-100 flex items-center justify-center">
                                    {isCover ? (
                                      <span className="text-[11px] font-bold text-amber-700 flex items-center gap-1">
                                        <Star className="w-3 h-3 fill-current text-amber-500" /> ภาพปก
                                      </span>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => setAsFbCover(img)}
                                        className="w-full py-1 px-1.5 rounded-lg bg-white border border-slate-200 hover:border-amber-400 hover:bg-amber-50 text-[10px] font-medium text-slate-700 hover:text-amber-800 transition flex items-center justify-center gap-1 cursor-pointer"
                                      >
                                        <Star className="w-2.5 h-2.5 text-amber-500" /> ตั้งเป็นปก
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                        <div className="text-xs text-slate-500">
                          {fbSelectedImages.length > 0 ? (
                            <span>
                              พร้อมนำเข้า: ภาพปก 1 รูป และภาพประกอบ{' '}
                              {fbSelectedImages.filter((i) => i !== fbCoverImage).length} รูป
                            </span>
                          ) : (
                            <span>นำเข้าเฉพาะข้อความ (ไม่มีรูปภาพ)</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={handleConfirmFbImport}
                          disabled={fbImporting}
                          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {fbImporting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" /> กำลังดาวน์โหลดรูปภาพ...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4" /> ยืนยันนำเข้าข้อมูลลงฟอร์ม ({fbSelectedImages.length} รูป)
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* WORKSPACE GRID (Left 8 Cols / Right 4 Cols on lg, giving plenty of room for both CKEditor and Settings) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-w-0">
                {/* LEFT MAIN AREA (8 Cols) */}
                <div className="lg:col-span-7 xl:col-span-8 space-y-6 min-w-0">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-bold text-slate-800 mb-2">
                      หัวข้อข่าวประชาสัมพันธ์ *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="พิมพ์หัวข้อข่าวประชาสัมพันธ์ให้ชัดเจน น่าสนใจ..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-base font-bold text-slate-800 outline-none transition"
                    />
                  </div>

                  {/* CKEditor Rich Text Area */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-bold text-slate-800">
                        เนื้อหาข่าวสาร (CKEditor Rich Text Editor) *
                      </label>
                      <span className="text-xs text-slate-400">
                        สามารถพิมพ์ จัดรูปแบบ ย่อหน้า แทรกตาราง และวางรูปภาพลงในเนื้อหาได้โดยตรง
                      </span>
                    </div>

                    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs min-w-0">
                      <CKEditorField
                        value={form.content}
                        onChange={(html) => setForm((prev) => ({ ...prev, content: html }))}
                        height={480}
                        placeholder="พิมพ์เนื้อหาข่าวสาร หรือวางข้อความ..."
                      />
                    </div>

                    {/* Content Stats Bar */}
                    <div className="flex items-center gap-4 mt-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        คำ: <strong>{wordCount}</strong> คำ
                      </span>
                      <span>•</span>
                      <span>
                        ตัวอักษร: <strong>{charCount}</strong> ตัว
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        เวลาอ่านประมาณ: <strong>~{readingTime} นาที</strong>
                      </span>
                    </div>
                  </div>

                  {/* ADDITIONAL IMAGES (Activity Photos Gallery - moved below CKEditor for full width) */}
                  {!form.gallery_id ? (
                    <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <ImageIcon className="w-5 h-5 text-indigo-600" />
                            <h4 className="font-bold text-slate-800 text-sm">
                              ภาพกิจกรรมเพิ่มเติม
                            </h4>
                            <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                              {form.additional_images.length} รูป
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            แสดงเป็นแกลเลอรีภาพท้ายข่าว สามารถเลือกอัปโหลดพร้อมกันได้หลายรูป
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {form.additional_images.length > 0 && (
                            <button
                              type="button"
                              onClick={async () => {
                                const ok = await swalConfirm({
                                  title: 'ยืนยันการลบรูปทั้งหมด?',
                                  text: 'ต้องการลบภาพกิจกรรมเพิ่มเติมทั้งหมดออกจากข่าวนี้ใช่หรือไม่?',
                                  confirmButtonText: 'ลบทั้งหมด',
                                })
                                if (ok) {
                                  setForm({ ...form, additional_images: [] })
                                }
                              }}
                              className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                            >
                              ลบทั้งหมด
                            </button>
                          )}
                          <label className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer gap-1.5">
                            {uploadingMulti ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" /> กำลังอัปโหลด...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4" /> + อัปโหลดรูปภาพเพิ่มเติม
                              </>
                            )}
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={handleMultiImageUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>

                      {form.additional_images.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 gap-3 max-h-80 overflow-y-auto p-1">
                          {form.additional_images.map((img, idx) => (
                            <div
                              key={idx}
                              className="relative group aspect-video rounded-xl overflow-hidden border border-slate-200 bg-white shadow-xs hover:border-indigo-300 transition-all"
                            >
                              <img
                                src={normalizeImageUrl(img)}
                                alt=""
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 text-[10px] text-white font-mono">
                                #{idx + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setForm({
                                    ...form,
                                    additional_images: form.additional_images.filter(
                                      (_, i) => i !== idx
                                    ),
                                  })
                                }
                                className="absolute top-1.5 right-1.5 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow cursor-pointer"
                                title="ลบรูปนี้"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-8 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 gap-2 bg-white/50">
                          <ImageIcon className="w-8 h-8 opacity-40 text-slate-400" />
                          <span className="text-xs">ยังไม่มีภาพกิจกรรมเพิ่มเติม กดปุ่ม "+ อัปโหลดรูปภาพเพิ่มเติม" เพื่อเพิ่มรูป</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-center justify-between text-xs text-amber-800">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-amber-600" />
                        <span>ข่าวนี้เชื่อมโยงกับอัลบั้มภาพกิจกรรมจากระบบ Gallery แล้ว (รูปภาพจะถูกดึงจากอัลบั้มที่เลือก)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, gallery_id: '' })}
                        className="text-indigo-600 hover:underline font-semibold cursor-pointer"
                      >
                        ยกเลิกการเชื่อมโยงอัลบั้ม
                      </button>
                    </div>
                  )}
                </div>

                {/* RIGHT SIDEBAR CONFIG (4 Cols, comfortable width with zero button overflow) */}
                <div className="lg:col-span-5 xl:col-span-4 space-y-5 bg-slate-50/90 p-5 sm:p-6 rounded-3xl border border-slate-200 min-w-0">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-200 pb-2">
                    ตั้งค่าข่าวสาร & เผยแพร่
                  </span>

                  {/* Category */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      หมวดหมู่ข่าว *
                    </label>
                    <select
                      value={form.category_id}
                      onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium"
                    >
                      <option value="">-- เลือกหมวดหมู่ --</option>
                      {categories.map((c) => (
                        <option key={c.id} value={String(c.id)}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      แท็ก (คั่นด้วยคอมม่า ,)
                    </label>
                    <input
                      type="text"
                      value={form.tags}
                      onChange={(e) => setForm({ ...form, tags: e.target.value })}
                      placeholder="วิชาการ, ประกาศ, รับสมัคร"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                    />
                  </div>

                  {/* COVER IMAGE WITH ROTATE & VERTICAL DRAG */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700">
                      ภาพปกข่าวประชาสัมพันธ์
                    </label>

                    <div className="space-y-2">
                      <input
                        type="text"
                        value={form.cover_image}
                        onChange={(e) => setForm({ ...form, cover_image: e.target.value })}
                        placeholder="URL หรือที่อยู่ไฟล์ภาพปก..."
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 outline-none truncate"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <label className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition flex items-center justify-center gap-1.5 cursor-pointer">
                          <Upload className="w-3.5 h-3.5" />
                          <span>อัปโหลดภาพปก</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLocalCoverUpload}
                            className="hidden"
                          />
                        </label>
                        {form.cover_image ? (
                          <button
                            type="button"
                            onClick={handleRotateCover}
                            disabled={rotating}
                            className="w-full py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-xl border border-amber-200 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                            title="หมุนภาพ 90 องศา"
                          >
                            <RotateCw
                              className={`w-3.5 h-3.5 ${rotating ? 'animate-spin' : ''}`}
                            />
                            <span>หมุน 90°</span>
                          </button>
                        ) : (
                          <div className="w-full py-2 bg-slate-100 text-slate-400 text-xs rounded-xl border border-slate-200 flex items-center justify-center">
                            ยังไม่มีภาพปก
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Interactive Focal Drag Preview Box (Legacy Feature) */}
                    {form.cover_image && (
                      <div className="space-y-1.5 mt-2">
                        <div
                          onMouseDown={handleMouseDownCover}
                          className="relative aspect-video rounded-xl overflow-hidden border-2 border-indigo-200 bg-slate-900 group cursor-ns-resize select-none shadow-sm"
                        >
                          <img
                            src={normalizeImageUrl(form.cover_image)}
                            alt="Cover"
                            style={{
                              objectPosition: `center ${form.cover_position || '50%'}`,
                            }}
                            className="w-full h-full object-cover pointer-events-none"
                            draggable={false}
                          />

                          {/* Hover Instruction Overlay */}
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white pointer-events-none">
                            <MoveVertical className="w-5 h-5 animate-bounce" />
                            <span className="text-[10px] font-bold mt-0.5">
                              คลิกค้างแล้วลากขึ้น-ลงเพื่อจัดโฟกัส
                            </span>
                          </div>

                          {/* Position Badge */}
                          <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-sm text-[9px] font-bold text-white">
                            จุดโฟกัส: {form.cover_position || '50%'}
                          </div>

                          {/* Clear Cover Button */}
                          <button
                            type="button"
                            onClick={() =>
                              setForm({ ...form, cover_image: '', cover_position: '50%' })
                            }
                            className="absolute top-1.5 right-1.5 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full transition shadow-md cursor-pointer"
                            title="ลบภาพปก"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Slider control */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400">บน</span>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={getCoverFocalPercent(form.cover_position)}
                            onChange={(e) =>
                              setForm({ ...form, cover_position: `${e.target.value}%` })
                            }
                            className="flex-1 accent-indigo-600 cursor-pointer h-1.5"
                          />
                          <span className="text-[10px] text-slate-400">ล่าง</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Link Gallery Album */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      ดึงอัลบั้มภาพกิจกรรม (ถ้ามี)
                    </label>
                    <select
                      value={form.gallery_id}
                      onChange={(e) => setForm({ ...form, gallery_id: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                    >
                      <option value="">-- ไม่เชื่อมโยงอัลบั้ม --</option>
                      {galleries.map((g) => (
                        <option key={g.id} value={String(g.id)}>
                          {g.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* PDF Attachment */}
                  <div className="pt-2 border-t border-slate-200/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700">
                        แนบเอกสาร PDF
                      </label>
                      {form.pdf_path && (
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, pdf_path: '' })}
                          className="text-[10px] text-red-500 hover:underline cursor-pointer"
                        >
                          ลบไฟล์ PDF
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      value={form.pdf_path}
                      onChange={(e) => setForm({ ...form, pdf_path: e.target.value })}
                      placeholder="ยังไม่มีไฟล์ PDF..."
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 outline-none truncate"
                    />

                    <label className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl border border-red-200 transition flex items-center justify-center gap-1.5 cursor-pointer">
                      <FileText className="w-4 h-4" />
                      <span>{form.pdf_path ? 'เปลี่ยนไฟล์ PDF' : 'เลือกไฟล์ PDF'}</span>
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={handleLocalPdfUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Published Datetime (Backdated/Scheduled) */}
                  <div className="pt-2 border-t border-slate-200/60">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        วันเวลาที่ลงข่าว
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setForm({ ...form, created_at: getNowDatetimeLocal() })
                        }
                        className="text-[10px] text-indigo-600 hover:underline"
                      >
                        ใช้วันนี้
                      </button>
                    </div>
                    <input
                      type="datetime-local"
                      value={form.created_at}
                      onChange={(e) => setForm({ ...form, created_at: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-sans"
                    />
                  </div>

                  {/* SEO Metadata Tools */}
                  <div className="pt-2 border-t border-slate-200/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        SEO Metadata
                      </span>
                      <button
                        type="button"
                        onClick={handleAutoSEO}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200 cursor-pointer"
                        title="สร้าง Title และ Description จากหัวข้อและเนื้อหาอัตโนมัติ"
                      >
                        <Sparkles className="w-3 h-3" /> สร้างอัตโนมัติ
                      </button>
                    </div>

                    <div>
                      <input
                        type="text"
                        value={form.meta_title}
                        onChange={(e) => setForm({ ...form, meta_title: e.target.value })}
                        placeholder="SEO Meta Title (เว้นว่างใช้ชื่อข่าว)"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                      />
                    </div>
                    <div>
                      <textarea
                        rows={2}
                        value={form.meta_description}
                        onChange={(e) =>
                          setForm({ ...form, meta_description: e.target.value })
                        }
                        placeholder="SEO Meta Description สำหรับ Google..."
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                      ></textarea>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="pt-2 border-t border-slate-200/60">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      สถานะเนื้อหา
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          status: e.target.value as 'draft' | 'published',
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-bold"
                    >
                      <option value="published">เผยแพร่สู่หน้าเว็บหลัก (Published)</option>
                      <option value="draft">ฉบับร่าง (Draft - ซ่อนจากหน้าเว็บ)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Fixed Bottom Action Bar (Fixed, Never overlaps content, Zero horizontal scrollbar) */}
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between shrink-0 bg-white z-20">
              <div>
                {form.id > 0 && (
                  <a
                    href={`/news/${form.slug || form.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> ดูตัวอย่างบนหน้าเว็บจริง
                  </a>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={() => handleSave()}
                  disabled={saving}
                  className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saving ? 'กำลังบันทึก...' : 'บันทึกบทความ / ข่าวสาร'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Manager Modal */}
      {catModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">จัดการหมวดหมู่ข่าวสาร</h3>
              <button
                onClick={() => setCatModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <form onSubmit={handleSaveCategory} className="flex gap-2">
                <input
                  type="text"
                  required
                  value={catForm.name}
                  onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                  placeholder="ชื่อหมวดหมู่ข่าวใหม่..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl cursor-pointer"
                >
                  {catForm.id ? 'อัปเดต' : 'เพิ่มหมวดหมู่'}
                </button>
                {catForm.id > 0 && (
                  <button
                    type="button"
                    onClick={() => setCatForm({ id: 0, name: '', slug: '' })}
                    className="px-3 py-2 bg-slate-100 text-slate-600 text-sm rounded-xl cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                )}
              </form>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl max-h-64 overflow-y-auto">
                {categories.map((c) => (
                  <div
                    key={c.id}
                    className="px-4 py-2.5 flex items-center justify-between text-sm"
                  >
                    <div>
                      <span className="font-medium text-slate-800">{c.name}</span>
                      <span className="text-xs text-slate-400 ml-2">({c.slug})</span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() =>
                          setCatForm({ id: c.id, name: c.name, slug: c.slug })
                        }
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(c.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
