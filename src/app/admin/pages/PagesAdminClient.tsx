'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Layout,
  Plus,
  Pencil,
  Trash2,
  X,
  ExternalLink,
  ArrowLeft,
  Save,
  Heading as HeadingIcon,
  Type,
  Image as ImageIcon,
  Images,
  AlertTriangle,
  HelpCircle,
  ChevronsUpDown,
  Link as LinkIcon,
  FileText,
  Minus,
  Sliders as SlidersIcon,
  LayoutGrid,
  Newspaper,
  FolderHeart,
  Users as UsersIcon,
  ImageDown,
  GripVertical,
  ChevronUp,
  ChevronDown,
  UploadCloud,
  CheckCircle,
  Search,
  Settings,
  Eye,
  Download,
  Loader2,
  Code,
  FileCheck,
} from 'lucide-react'
import { AdminUploadField } from '../AdminMediaPicker'
import CKEditorField from '../CKEditorField'
import { normalizeImageUrl } from '@/lib/url-helper'

export interface StaticPageItem {
  id: number
  slug: string
  title: string
  subtitle: string | null
  layout: string | null
  featured_image: string | null
  content: string | null
  blocks_data: string | null
  meta_title: string | null
  meta_description: string | null
  updated_at: string | null
}

interface PagesAdminProps {
  initialPages: StaticPageItem[]
  newsCategories: Array<{ id: number; name: string }>
  galleries: Array<{ id: number; title: string }>
}

export interface BlockItem {
  id: string
  type: string
  data: any
}

function getInitialBlockData(type: string): any {
  switch (type) {
    case 'heading':
      return { text: '', level: 'h2', align: 'left' }
    case 'paragraph':
      return { text: '' }
    case 'image':
      return { path: '', caption: '', align: 'center' }
    case 'gallery':
      return { images: [] }
    case 'alert':
      return { text: '', status: 'info' }
    case 'accordion':
      return { items: [{ question: '', answer: '' }] }
    case 'collapsible':
      return { title: '', content: '', pdf_files: [] }
    case 'button':
      return { label: '', link: '', align: 'center', new_tab: 0 }
    case 'pdf':
      return { path: '', title: '', display_type: 'both' }
    case 'divider':
      return { style: 'solid', color: 'slate-200', thickness: '2px', spacing: 'my-6' }
    case 'home_sliders':
      return {}
    case 'quick_access':
      return {
        items: [
          { title: 'สาขาวิชาที่เปิดสอน', subtitle: 'ดูรายชื่อสาขาวิชาเรียนทั้งหมด', url: 'curriculum.php', icon: 'book-open' },
          { title: 'ทำเนียบคณาจารย์', subtitle: 'รู้จักคณะผู้บริหารและอาจารย์ผู้สอน', url: 'personnel.php', icon: 'users' },
          { title: 'ดาวน์โหลดใบสมัคร', subtitle: 'ดาวน์โหลดเอกสารสมัครเรียน/คำร้อง', url: 'download.php', icon: 'download' },
        ],
      }
    case 'latest_news':
      return {}
    case 'categorized_news':
      return { category_id: '', limit: 6, title: '' }
    case 'executives':
      return {
        title: 'คณะผู้บริหารระดับสูง',
        subtitle: 'ผู้สนับสนุนดูแล ขับเคลื่อนนโยบายและการศึกษาที่มีคุณภาพของวิทยาลัย',
      }
    case 'activity_album':
      return { gallery_id: '' }
    default:
      return {}
  }
}

function compileBlockToHtml(block: BlockItem): string {
  const data = block.data || {}
  switch (block.type) {
    case 'home_sliders':
      return `<!-- block:home_sliders -->\n`
    case 'quick_access':
      return `<!-- block:quick_access:${encodeURIComponent(JSON.stringify(data.items || []))} -->\n`
    case 'latest_news':
      return `<!-- block:latest_news -->\n`
    case 'categorized_news': {
      const encCatTitle = encodeURIComponent(data.title || '')
      return `<!-- block:categorized_news:${data.category_id || 0}:${data.limit || 6}:${encCatTitle} -->\n`
    }
    case 'executives': {
      const encTitle = encodeURIComponent(data.title !== undefined ? data.title : 'คณะผู้บริหารระดับสูง')
      const encSub = encodeURIComponent(
        data.subtitle !== undefined
          ? data.subtitle
          : 'ผู้สนับสนุนดูแล ขับเคลื่อนนโยบายและการศึกษาที่มีคุณภาพของวิทยาลัย'
      )
      return `<!-- block:executives:${encTitle}:${encSub} -->\n`
    }
    case 'activity_album':
      return `<!-- block:activity_album:${data.gallery_id || 0} -->\n`
    case 'divider': {
      const borderStyle = data.style || 'solid'
      let borderColorClass = 'border-slate-200'
      if (data.color === 'indigo-500') borderColorClass = 'border-indigo-500'
      else if (data.color === 'emerald-500') borderColorClass = 'border-emerald-500'
      else if (data.color === 'rose-500') borderColorClass = 'border-rose-500'

      const spacingClass = data.spacing || 'my-6'
      const thicknessStyle = data.thickness || '2px'
      let inlineMargin = 'margin: 1.5rem 0;'
      if (spacingClass === 'my-3') inlineMargin = 'margin: 0.75rem 0;'
      else if (spacingClass === 'my-12') inlineMargin = 'margin: 3rem 0;'

      return `<hr class="${borderColorClass}" style="border: 0; border-top: ${thicknessStyle} ${borderStyle}; ${inlineMargin} opacity: 1; height: 0;">\n`
    }
    case 'heading': {
      let headingAlignClass = ''
      if (data.align === 'center') headingAlignClass = ' text-center'
      if (data.align === 'right') headingAlignClass = ' text-right'
      const lvl = data.level || 'h2'
      return `<${lvl} class="text-2xl font-bold text-slate-900 mt-6 mb-3${headingAlignClass}">${data.text || ''}</${lvl}>\n`
    }
    case 'paragraph':
      return `<div class="prose text-slate-700 leading-relaxed my-4">${data.text || ''}</div>\n`
    case 'image': {
      if (!data.path) return ''
      let alignClass = 'mx-auto'
      if (data.align === 'left') alignClass = 'mr-auto ml-0'
      if (data.align === 'right') alignClass = 'ml-auto mr-0'
      return `<figure class="my-6 max-w-2xl ${alignClass}">
  <img src="${data.path}" class="w-full h-auto object-cover rounded-2xl shadow-md border border-slate-100" alt="${data.caption || 'Image'}">
  ${data.caption ? `<figcaption class="text-center text-xs text-slate-400 mt-2 font-medium">${data.caption}</figcaption>` : ''}
</figure>\n`
    }
    case 'gallery': {
      if (!data.images || data.images.length === 0) return ''
      const imgsHtml = data.images
        .map(
          (img: string) => `<div class="aspect-video overflow-hidden rounded-xl border border-slate-200 shadow-sm">
  <a href="${img}" target="_blank">
    <img src="${img}" class="w-full h-full object-cover hover:scale-105 transition duration-300">
  </a>
</div>`
        )
        .join('\n')
      return `<div class="grid grid-cols-2 sm:grid-cols-4 gap-4 my-6">\n${imgsHtml}\n</div>\n`
    }
    case 'alert': {
      let alertBg = 'bg-blue-50 border-blue-200 text-blue-800'
      let alertIcon = 'info'
      if (data.status === 'success') {
        alertBg = 'bg-emerald-50 border-emerald-250 text-emerald-800'
        alertIcon = 'check-circle'
      } else if (data.status === 'warning') {
        alertBg = 'bg-amber-50 border-amber-250 text-amber-800'
        alertIcon = 'alert-triangle'
      } else if (data.status === 'danger') {
        alertBg = 'bg-rose-50 border-rose-250 text-rose-800'
        alertIcon = 'alert-octagon'
      }
      return `<div class="p-4 border rounded-2xl ${alertBg} my-4 flex items-center gap-3">
  <span class="shrink-0"><i data-lucide="${alertIcon}"></i></span>
  <span class="text-sm font-medium">${data.text || ''}</span>
</div>\n`
    }
    case 'accordion': {
      if (!data.items || data.items.length === 0) return ''
      const itemsHtml = data.items
        .map((item: any) => {
          const randomId = Math.random().toString(36).substring(2, 8)
          return `<div class="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
  <button type="button" onclick="document.getElementById('acc_body_${randomId}').classList.toggle('hidden')" class="w-full px-5 py-4 text-left font-bold text-slate-800 hover:bg-slate-50 flex justify-between items-center text-sm">
    <span>${item.question || 'คำถาม FAQ'}</span>
    <span class="text-slate-400"><i data-lucide="chevron-down" class="w-4 h-4"></i></span>
  </button>
  <div id="acc_body_${randomId}" class="hidden px-5 py-4 border-t border-slate-100 text-slate-655 text-sm leading-relaxed bg-slate-50/20">
    ${item.answer || ''}
  </div>
</div>`
        })
        .join('\n')
      return `<div class="space-y-3 my-6">\n${itemsHtml}\n</div>\n`
    }
    case 'collapsible': {
      const colRandomId = Math.random().toString(36).substring(2, 8)
      const colTitle = data.title || 'แสดงรายละเอียดเพิ่มเติม'
      const colContent = data.content || ''
      let pdfBlocksHtml = ''

      if (data.pdf_files && Array.isArray(data.pdf_files) && data.pdf_files.length > 0) {
        pdfBlocksHtml = data.pdf_files
          .filter((p: any) => p.path)
          .map(
            (p: any) => `<div class="flex flex-col sm:flex-row items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl gap-3 my-3">
  <div class="flex items-center gap-3">
    <div class="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
      <i data-lucide="file-text" class="w-6 h-6"></i>
    </div>
    <div class="text-left">
      <span class="font-bold text-slate-800 text-sm block">${p.title || 'เอกสารประกอบ'}</span>
      <span class="text-xs text-slate-400 block font-mono">${p.path}</span>
    </div>
  </div>
  <a href="${p.path}" target="_blank" download class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md transition text-xs">
    <i data-lucide="download" class="w-4 h-4"></i>
    <span>ดาวน์โหลดเอกสาร PDF</span>
  </a>
</div>`
          )
          .join('\n')
      }

      return `<div class="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm my-6">
  <button type="button" onclick="
    const content = document.getElementById('col_body_${colRandomId}');
    const icon = document.getElementById('col_icon_${colRandomId}');
    content.classList.toggle('hidden');
    if(content.classList.contains('hidden')) {
      icon.style.transform = 'rotate(0deg)';
    } else {
      icon.style.transform = 'rotate(180deg)';
    }
  " class="w-full px-6 py-4 text-left font-bold text-slate-800 hover:bg-slate-50/50 flex justify-between items-center text-sm transition">
    <span>${colTitle}</span>
    <span id="col_icon_${colRandomId}" class="text-slate-400 transition-transform duration-200"><i data-lucide="chevron-down" class="w-4 h-4"></i></span>
  </button>
  <div id="col_body_${colRandomId}" class="hidden px-6 py-5 border-t border-slate-100 text-slate-655 text-sm leading-relaxed bg-slate-50/10">
    <div>${colContent}</div>
    ${pdfBlocksHtml}
  </div>
</div>\n`
    }
    case 'button': {
      if (!data.label || !data.link) return ''
      let btnAlign = 'justify-center'
      if (data.align === 'left') btnAlign = 'justify-start'
      if (data.align === 'right') btnAlign = 'justify-end'
      const targetAttr = data.new_tab == 1 ? 'target="_blank" rel="noopener noreferrer"' : ''
      return `<div class="flex ${btnAlign} my-6">
  <a href="${data.link}" ${targetAttr} class="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-2xl shadow-md shadow-orange-600/20 transition text-sm">
    <span>${data.label}</span>
    <i data-lucide="arrow-right" class="w-4 h-4"></i>
  </a>
</div>\n`
    }
    case 'pdf': {
      if (!data.path) return ''
      const pdfTitle = data.title || 'เอกสาร PDF'
      return `<div class="flex flex-col sm:flex-row items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl gap-3 my-4">
  <div class="flex items-center gap-3">
    <div class="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
      <i data-lucide="file-text" class="w-6 h-6"></i>
    </div>
    <div>
      <span class="font-bold text-slate-800 text-sm block">${pdfTitle}</span>
      <span class="text-xs text-slate-400 block font-mono">${data.path}</span>
    </div>
  </div>
  <a href="${data.path}" target="_blank" download class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md transition text-xs">
    <i data-lucide="download" class="w-4 h-4"></i>
    <span>ดาวน์โหลดเอกสาร PDF</span>
  </a>
</div>\n`
    }
    default:
      return ''
  }
}

export function PagesAdminClient({
  initialPages,
  newsCategories,
  galleries,
}: PagesAdminProps) {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<'list' | 'editor'>('list')
  const [editorMode, setEditorMode] = useState<'blocks' | 'html'>('blocks')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  // Current page under edit
  const [pageId, setPageId] = useState<number>(0)
  const [title, setTitle] = useState<string>('')
  const [subtitle, setSubtitle] = useState<string>('')
  const [slug, setSlug] = useState<string>('')
  const [layout, setLayout] = useState<string>('container')
  const [featuredImage, setFeaturedImage] = useState<string>('')
  const [metaTitle, setMetaTitle] = useState<string>('')
  const [metaDescription, setMetaDescription] = useState<string>('')
  const [contentHtml, setContentHtml] = useState<string>('')
  const [blocks, setBlocks] = useState<BlockItem[]>([])

  // Open Create page view
  const openCreate = () => {
    setPageId(0)
    setTitle('')
    setSubtitle('')
    setSlug('')
    setLayout('container')
    setFeaturedImage('')
    setMetaTitle('')
    setMetaDescription('')
    setContentHtml('')
    setBlocks([])
    setEditorMode('blocks')
    setViewMode('editor')
  }

  // Open Edit page view
  const openEdit = (p: StaticPageItem) => {
    setPageId(p.id)
    setTitle(p.title || '')
    setSubtitle(p.subtitle || '')
    setSlug(p.slug || '')
    setLayout(p.layout || 'container')
    setFeaturedImage(p.featured_image || '')
    setMetaTitle(p.meta_title || '')
    setMetaDescription(p.meta_description || '')
    setContentHtml(p.content || '')

    // Parse blocks_data JSON
    let parsedBlocks: BlockItem[] = []
    if (p.blocks_data) {
      try {
        const parsed = JSON.parse(p.blocks_data)
        if (Array.isArray(parsed)) {
          parsedBlocks = parsed.map((b, i) => ({
            id: b.id || `block_${i + 1}`,
            type: b.type,
            data: b.data || {},
          }))
        }
      } catch (err) {
        console.error('Failed to parse blocks_data:', err)
      }
    }
    setBlocks(parsedBlocks)
    setEditorMode('blocks')
    setViewMode('editor')
  }

  // Add a block to the canvas
  const addBlock = (type: string) => {
    const newBlock: BlockItem = {
      id: `block_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type,
      data: getInitialBlockData(type),
    }
    setBlocks((prev) => [...prev, newBlock])
  }

  // Delete a block from canvas
  const deleteBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id))
  }

  // Move block up or down
  const moveBlock = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === blocks.length - 1) return
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    const copy = [...blocks]
    const temp = copy[index]
    copy[index] = copy[targetIndex]
    copy[targetIndex] = temp
    setBlocks(copy)
  }

  // Update data of a specific block
  const updateBlockData = (id: string, key: string, val: any) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, data: { ...b.data, [key]: val } } : b))
    )
  }

  // Save the page
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      alert('กรุณากรอกชื่อเรื่องของหน้าเว็บ (Title)')
      return
    }

    // Auto-generate slug if empty
    let finalSlug = slug.trim().toLowerCase()
    if (!finalSlug && title.trim()) {
      finalSlug = title
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w?-?-]/g, '')
    }
    if (!finalSlug) finalSlug = `page-${Date.now()}`

    setSaving(true)
    try {
      // Compile blocks to HTML if in blocks mode
      let compiledHtml = contentHtml
      if (editorMode === 'blocks' || blocks.length > 0) {
        compiledHtml = blocks.map((b) => compileBlockToHtml(b)).join('\n')
      }

      const payload = {
        id: pageId,
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        slug: finalSlug,
        layout,
        featured_image: featuredImage || null,
        meta_title: metaTitle || null,
        meta_description: metaDescription || null,
        content: compiledHtml,
        blocks_data: JSON.stringify(blocks),
      }

      const res = await fetch('/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'pages',
          action: 'save',
          data: payload,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'บันทึกไม่สำเร็จ')

      setMsg('บันทึกหน้าเว็บสำเร็จเรียบร้อยแล้ว')
      setTimeout(() => setMsg(null), 3500)
      setViewMode('list')
      router.refresh()
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาดในการบันทึก')
    } finally {
      setSaving(false)
    }
  }

  // Delete page
  const handleDelete = async (p: StaticPageItem) => {
    if (p.slug === 'home') {
      alert('ไม่สามารถลบหน้าแรก (home) ของระบบได้')
      return
    }
    if (!confirm(`ยืนยันการลบหน้าเว็บ "${p.title}" อย่างถาวร?`)) return

    try {
      const res = await fetch('/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: 'pages', action: 'delete', data: { id: p.id } }),
      })
      if (res.ok) {
        setMsg('ลบหน้าเว็บสำเร็จเรียบร้อยแล้ว')
        setTimeout(() => setMsg(null), 3500)
        router.refresh()
      }
    } catch (err) {
      console.error(err)
    }
  }

  // =========================================================================
  // VIEW 1: WORDPRESS-STYLE PAGE LISTING (Original Layout)
  // =========================================================================
  if (viewMode === 'list') {
    return (
      <div className="space-y-6">
        {/* Page Listing Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Layout className="w-6 h-6 text-indigo-600" />
              การจัดการหน้าเว็บแบบ Static Page
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              สร้างและแก้ไขเนื้อหาหน้าเว็บด้วยระบบ Block Layout Builder คล้าย WordPress Gutenberg
            </p>
          </div>
          <button
            onClick={openCreate}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl shadow-sm transition flex items-center gap-2 text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>เขียนหน้าใหม่</span>
          </button>
        </div>

        {msg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-medium">{msg}</span>
          </div>
        )}

        {/* WordPress-style Static Page Table Listing */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="text-sm font-bold text-slate-800">
              หน้าเว็บทั้งหมด ({initialPages.length})
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-xs font-bold uppercase bg-slate-50/20">
                  <th className="py-3.5 px-6">ชื่อหน้าเว็บ</th>
                  <th className="py-3.5 px-6">ภาพหน้าปก (Featured)</th>
                  <th className="py-3.5 px-6">URL Link (Slug)</th>
                  <th className="py-3.5 px-6">แก้ไขล่าสุด</th>
                  <th className="py-3.5 px-6 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {initialPages.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <Layout className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                      <p className="text-sm font-medium">ยังไม่มีข้อมูลหน้าเว็บในระบบ</p>
                      <button
                        onClick={openCreate}
                        className="text-indigo-600 font-semibold hover:underline text-xs mt-1 inline-block cursor-pointer"
                      >
                        กดปุ่มเขียนหน้าใหม่เพื่อสร้างหน้าแรก
                      </button>
                    </td>
                  </tr>
                ) : (
                  initialPages.map((page) => {
                    const publicUrl = page.slug === 'home' ? '/' : `/${page.slug}`
                    return (
                      <tr key={page.id} className="group hover:bg-slate-50/40 transition">
                        <td className="py-4 px-6">
                          <div className="flex flex-col">
                            <button
                              type="button"
                              onClick={() => openEdit(page)}
                              className="font-bold text-slate-800 hover:text-indigo-600 text-base flex items-center gap-2 text-left cursor-pointer"
                            >
                              <span>{page.title}</span>
                              {page.slug === 'home' && (
                                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-extrabold rounded-md shadow-xs">
                                  หน้าแรกหลัก (Homepage)
                                </span>
                              )}
                            </button>
                            <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition duration-150">
                              <button
                                type="button"
                                onClick={() => openEdit(page)}
                                className="text-[11px] text-indigo-500 hover:text-indigo-700 font-bold cursor-pointer"
                              >
                                แก้ไข
                              </button>
                              <span className="text-slate-300 text-[10px]">|</span>
                              <Link
                                href={publicUrl}
                                target="_blank"
                                className="text-[11px] text-emerald-500 hover:text-emerald-700 font-bold"
                              >
                                ดูหน้าเว็บ
                              </Link>
                              {page.slug !== 'home' && (
                                <>
                                  <span className="text-slate-300 text-[10px]">|</span>
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(page)}
                                    className="text-[11px] text-rose-500 hover:text-rose-700 font-bold cursor-pointer"
                                  >
                                    ลบถาวร
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          {page.featured_image ? (
                            <img
                              src={normalizeImageUrl(page.featured_image)}
                              className="w-16 h-10 object-cover rounded-lg border border-slate-200"
                              alt="Featured"
                            />
                          ) : (
                            <span className="text-xs text-slate-400 italic">ไม่มีรูปภาพหน้าปก</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-mono text-xs text-slate-500 bg-slate-100 border border-slate-200/60 px-2 py-1 rounded-md">
                            {page.slug === 'home' ? '/' : `about.php?slug=${page.slug}`}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-slate-400 text-xs font-medium">
                          {page.updated_at
                            ? new Date(page.updated_at).toLocaleString('th-TH')
                            : '-'}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEdit(page)}
                              className="p-2 border border-slate-200 bg-white hover:border-slate-300 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition cursor-pointer"
                              title="แก้ไข"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            {page.slug !== 'home' && (
                              <button
                                type="button"
                                onClick={() => handleDelete(page)}
                                className="p-2 border border-rose-100 bg-rose-50/50 hover:bg-rose-50 hover:border-rose-200 text-rose-600 rounded-xl transition cursor-pointer"
                                title="ลบถาวร"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  // =========================================================================
  // VIEW 2: ORIGINAL GUTENBERG-STYLE FULL BLOCK BUILDER (Original Layout)
  // =========================================================================
  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Top Bar Sticky Navigation */}
      <div className="sticky top-0 bg-slate-50/95 backdrop-blur-md py-4 z-40 border-b border-slate-200/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-100 text-slate-500 rounded-xl transition cursor-pointer"
            title="ย้อนกลับไปหน้ารายการ"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {pageId === 0 ? 'เขียนหน้าเว็บใหม่' : `แก้ไขหน้าเว็บ: ${title}`}
            </h1>
            <span className="text-xs text-slate-500">ระบบลากวางบล็อกเนื้อหาระดับพรีเมียม</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setEditorMode(editorMode === 'blocks' ? 'html' : 'blocks')}
            className="px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 rounded-xl transition text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Code className="w-3.5 h-3.5 text-indigo-600" />
            <span>{editorMode === 'blocks' ? 'สลับดูโค้ด HTML' : 'สลับดูบล็อก Canvas'}</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className="px-4 py-2 border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 rounded-xl transition text-sm font-semibold cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition text-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>กำลังบันทึก...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>บันทึกหน้าเว็บ</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Gutenberg Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Main Editor Workspace (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Title & Subtitle Input (WordPress Styled) */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                ชื่อเรื่องของหน้าเว็บ (Title) *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ใส่ชื่อเรื่องของหน้าเว็บที่นี่..."
                className="w-full text-2xl md:text-3xl font-extrabold text-slate-900 placeholder-slate-300 outline-none border-b border-transparent focus:border-slate-200 pb-3 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                คำอธิบายย่อย (Subtitle)
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="ใส่คำอธิบายย่อยของหน้าเว็บที่นี่..."
                className="w-full text-base font-medium text-slate-600 placeholder-slate-400 outline-none border-b border-transparent focus:border-slate-200 pb-2 transition"
              />
            </div>
          </div>

          {/* HTML Source Mode */}
          {editorMode === 'html' ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
                  <Code className="w-4 h-4 text-indigo-600" />
                  โค้ด HTML และ Dynamic Block Tags ของหน้าเว็บ
                </span>
                <span className="text-[11px] text-slate-400">
                  (ระบบจะบันทึกโค้ดนี้ลงในหน้าเว็บโดยตรง)
                </span>
              </div>
              <textarea
                rows={18}
                value={contentHtml}
                onChange={(e) => setContentHtml(e.target.value)}
                placeholder="ใส่โค้ด HTML หรือ Dynamic Blocks..."
                className="w-full bg-slate-900 text-emerald-400 font-mono text-xs rounded-2xl p-4 leading-relaxed outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          ) : (
            /* Block Builder Workspace */
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row gap-6 min-h-[550px]">
              {/* Toolbar Shelf Sidebar */}
              <div className="w-full md:w-56 shrink-0 space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 px-1">
                  บล็อกองค์ประกอบเว็บ
                </span>

                <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => addBlock('heading')}
                    className="w-full text-left p-3 border border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/30 text-slate-700 font-bold rounded-2xl transition flex items-center gap-2 text-xs cursor-pointer"
                  >
                    <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                      <HeadingIcon className="w-4 h-4" />
                    </span>
                    <span>หัวข้อ (Heading)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => addBlock('paragraph')}
                    className="w-full text-left p-3 border border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/30 text-slate-700 font-bold rounded-2xl transition flex items-center gap-2 text-xs cursor-pointer"
                  >
                    <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                      <Type className="w-4 h-4" />
                    </span>
                    <span>เนื้อหาข้อความ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => addBlock('image')}
                    className="w-full text-left p-3 border border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/30 text-slate-700 font-bold rounded-2xl transition flex items-center gap-2 text-xs cursor-pointer"
                  >
                    <span className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
                      <ImageIcon className="w-4 h-4" />
                    </span>
                    <span>รูปภาพเดี่ยว</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => addBlock('gallery')}
                    className="w-full text-left p-3 border border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/30 text-slate-700 font-bold rounded-2xl transition flex items-center gap-2 text-xs cursor-pointer"
                  >
                    <span className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
                      <Images className="w-4 h-4" />
                    </span>
                    <span>แกลเลอรีภาพคู่</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => addBlock('alert')}
                    className="w-full text-left p-3 border border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/30 text-slate-700 font-bold rounded-2xl transition flex items-center gap-2 text-xs cursor-pointer"
                  >
                    <span className="p-1.5 bg-rose-100 text-rose-700 rounded-lg">
                      <AlertTriangle className="w-4 h-4" />
                    </span>
                    <span>กล่องแจ้งเตือน</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => addBlock('accordion')}
                    className="w-full text-left p-3 border border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/30 text-slate-700 font-bold rounded-2xl transition flex items-center gap-2 text-xs cursor-pointer"
                  >
                    <span className="p-1.5 bg-sky-100 text-sky-700 rounded-lg">
                      <HelpCircle className="w-4 h-4" />
                    </span>
                    <span>กล่องคำถาม FAQ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => addBlock('collapsible')}
                    className="w-full text-left p-3 border border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/30 text-slate-700 font-bold rounded-2xl transition flex items-center gap-2 text-xs cursor-pointer"
                  >
                    <span className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
                      <ChevronsUpDown className="w-4 h-4" />
                    </span>
                    <span>กล่องพับหุบได้</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => addBlock('button')}
                    className="w-full text-left p-3 border border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/30 text-slate-700 font-bold rounded-2xl transition flex items-center gap-2 text-xs cursor-pointer"
                  >
                    <span className="p-1.5 bg-teal-100 text-teal-700 rounded-lg">
                      <LinkIcon className="w-4 h-4" />
                    </span>
                    <span>ปุ่มลิงก์ภายนอก</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => addBlock('pdf')}
                    className="w-full text-left p-3 border border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/30 text-slate-700 font-bold rounded-2xl transition flex items-center gap-2 text-xs cursor-pointer"
                  >
                    <span className="p-1.5 bg-rose-100 text-rose-700 rounded-lg">
                      <FileText className="w-4 h-4" />
                    </span>
                    <span>เอกสาร PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => addBlock('divider')}
                    className="w-full text-left p-3 border border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/30 text-slate-700 font-bold rounded-2xl transition flex items-center gap-2 text-xs cursor-pointer"
                  >
                    <span className="p-1.5 bg-slate-100 text-slate-700 rounded-lg">
                      <Minus className="w-4 h-4" />
                    </span>
                    <span>เส้นคั่น (Divider)</span>
                  </button>
                </div>

                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mt-4 mb-2 px-1">
                  บล็อกฟังก์ชันพิเศษหน้าแรก
                </span>

                <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => addBlock('home_sliders')}
                    className="w-full text-left p-3 border border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/30 text-slate-700 font-bold rounded-2xl transition flex items-center gap-2 text-xs cursor-pointer"
                  >
                    <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                      <SlidersIcon className="w-4 h-4" />
                    </span>
                    <span>สไลเดอร์หน้าแรก</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => addBlock('quick_access')}
                    className="w-full text-left p-3 border border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/30 text-slate-700 font-bold rounded-2xl transition flex items-center gap-2 text-xs cursor-pointer"
                  >
                    <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                      <LayoutGrid className="w-4 h-4" />
                    </span>
                    <span>ปุ่มทางลัดด่วน</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => addBlock('latest_news')}
                    className="w-full text-left p-3 border border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/30 text-slate-700 font-bold rounded-2xl transition flex items-center gap-2 text-xs cursor-pointer"
                  >
                    <span className="p-1.5 bg-sky-100 text-sky-700 rounded-lg">
                      <Newspaper className="w-4 h-4" />
                    </span>
                    <span>ข่าวสารล่าสุด</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => addBlock('categorized_news')}
                    className="w-full text-left p-3 border border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/30 text-slate-700 font-bold rounded-2xl transition flex items-center gap-2 text-xs cursor-pointer"
                  >
                    <span className="p-1.5 bg-sky-100 text-sky-700 rounded-lg">
                      <FolderHeart className="w-4 h-4" />
                    </span>
                    <span>ข่าวแยกประเภท</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => addBlock('executives')}
                    className="w-full text-left p-3 border border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/30 text-slate-700 font-bold rounded-2xl transition flex items-center gap-2 text-xs cursor-pointer"
                  >
                    <span className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
                      <UsersIcon className="w-4 h-4" />
                    </span>
                    <span>ทำเนียบผู้บริหาร</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => addBlock('activity_album')}
                    className="w-full text-left p-3 border border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/30 text-slate-700 font-bold rounded-2xl transition flex items-center gap-2 text-xs cursor-pointer"
                  >
                    <span className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
                      <ImageDown className="w-4 h-4" />
                    </span>
                    <span>ดึงอัลบั้มกิจกรรม</span>
                  </button>
                </div>
              </div>

              {/* Gutenberg Canvas */}
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    ผืนผ้าจัดวางบล็อก (Canvas - {blocks.length} บล็อก)
                  </span>
                  {blocks.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setBlocks([])}
                      className="text-[10px] text-rose-500 hover:underline font-bold"
                    >
                      ล้างบล็อกทั้งหมด
                    </button>
                  )}
                </div>

                <div className="flex-1 border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-2xl bg-slate-50/40 p-4 space-y-4 min-h-[400px]">
                  {blocks.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-12 text-slate-400">
                      <LayoutGrid className="w-12 h-12 text-slate-300 mb-2" />
                      <span className="font-bold block text-sm">ยังไม่มีบล็อกเนื้อหา</span>
                      <span className="text-xs text-slate-400 mt-1 block">
                        กดปุ่มหัวข้อข้อความทางด้านซ้ายเพื่อเพิ่มบล็อกลงบน Canvas
                      </span>
                    </div>
                  ) : (
                    blocks.map((block, index) => (
                      <div
                        key={block.id}
                        className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm relative group hover:border-slate-300 transition"
                      >
                        {/* Block Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="p-1 text-slate-400">
                              <GripVertical className="w-4 h-4" />
                            </span>
                            <span className="text-xs font-bold text-slate-700">
                              #{index + 1} {block.type.toUpperCase()}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => moveBlock(index, 'up')}
                              disabled={index === 0}
                              className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded cursor-pointer"
                              title="เลื่อนขึ้น"
                            >
                              <ChevronUp className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveBlock(index, 'down')}
                              disabled={index === blocks.length - 1}
                              className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded cursor-pointer"
                              title="เลื่อนลง"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteBlock(block.id)}
                              className="p-1 text-rose-400 hover:text-rose-600 rounded cursor-pointer ml-1"
                              title="ลบบล็อกนี้"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Block Content Field Editor */}
                        <div className="space-y-3">
                          {block.type === 'heading' && (
                            <div className="flex flex-col sm:flex-row gap-3">
                              <select
                                value={block.data.level || 'h2'}
                                onChange={(e) => updateBlockData(block.id, 'level', e.target.value)}
                                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                              >
                                <option value="h2">H2 (หัวข้อหลัก)</option>
                                <option value="h3">H3 (หัวข้อย่อย)</option>
                                <option value="h4">H4 (หัวข้อเล็ก)</option>
                              </select>
                              <input
                                type="text"
                                value={block.data.text || ''}
                                onChange={(e) => updateBlockData(block.id, 'text', e.target.value)}
                                placeholder="ใส่เนื้อหาหัวข้อ..."
                                className="flex-1 px-4 py-2 border border-slate-200 focus:border-indigo-500 rounded-xl text-sm outline-none"
                              />
                              <select
                                value={block.data.align || 'left'}
                                onChange={(e) => updateBlockData(block.id, 'align', e.target.value)}
                                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                              >
                                <option value="left">ชิดซ้าย</option>
                                <option value="center">จัดกึ่งกลาง</option>
                                <option value="right">ชิดขวา</option>
                              </select>
                            </div>
                          )}

                          {block.type === 'paragraph' && (
                            <div>
                              <CKEditorField
                                value={block.data.text || ''}
                                onChange={(html) => updateBlockData(block.id, 'text', html)}
                                height={240}
                                compact
                              />
                            </div>
                          )}

                          {block.type === 'image' && (
                            <div className="space-y-3">
                              <AdminUploadField
                                label="รูปภาพเดี่ยว"
                                value={block.data.path || ''}
                                onChange={(p) => updateBlockData(block.id, 'path', p)}
                                folder="media"
                              />
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 mb-1">
                                    คำอธิบายภาพ (Caption)
                                  </label>
                                  <input
                                    type="text"
                                    value={block.data.caption || ''}
                                    onChange={(e) => updateBlockData(block.id, 'caption', e.target.value)}
                                    placeholder="ระบุคำอธิบายภาพ..."
                                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 mb-1">
                                    การจัดวางตำแหน่ง (Align)
                                  </label>
                                  <select
                                    value={block.data.align || 'center'}
                                    onChange={(e) => updateBlockData(block.id, 'align', e.target.value)}
                                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs outline-none"
                                  >
                                    <option value="center">กึ่งกลาง</option>
                                    <option value="left">ชิดซ้าย</option>
                                    <option value="right">ชิดขวา</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          )}

                          {block.type === 'gallery' && (
                            <div className="space-y-2">
                              <label className="block text-xs font-bold text-slate-700">
                                รูปภาพในแกลเลอรี ({(block.data.images || []).length} รูป)
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {(block.data.images || []).map((img: string, i: number) => (
                                  <div key={i} className="relative w-24 h-16 rounded-xl overflow-hidden border border-slate-200">
                                    <img src={normalizeImageUrl(img)} className="w-full h-full object-cover" />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = [...block.data.images]
                                        updated.splice(i, 1)
                                        updateBlockData(block.id, 'images', updated)
                                      }}
                                      className="absolute top-1 right-1 p-0.5 bg-rose-500 text-white rounded-full text-xs"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                              <AdminUploadField
                                label="+ อัปโหลดรูปภาพเพิ่มเข้าแกลเลอรี"
                                value=""
                                onChange={(newPath) => {
                                  if (newPath) {
                                    const updated = [...(block.data.images || []), newPath]
                                    updateBlockData(block.id, 'images', updated)
                                  }
                                }}
                                folder="media"
                              />
                            </div>
                          )}

                          {block.type === 'alert' && (
                            <div className="flex flex-col sm:flex-row gap-3">
                              <select
                                value={block.data.status || 'info'}
                                onChange={(e) => updateBlockData(block.id, 'status', e.target.value)}
                                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                              >
                                <option value="info">ข้อมูลทั่วไป (Info)</option>
                                <option value="success">สำเร็จ (Success)</option>
                                <option value="warning">คำเตือน (Warning)</option>
                                <option value="danger">อันตราย/แจ้งเตือนด่วน (Danger)</option>
                              </select>
                              <input
                                type="text"
                                value={block.data.text || ''}
                                onChange={(e) => updateBlockData(block.id, 'text', e.target.value)}
                                placeholder="กรอกข้อความแจ้งเตือนที่ต้องการแสดงผล..."
                                className="flex-1 px-4 py-2 border border-slate-200 focus:border-indigo-500 rounded-xl text-sm outline-none"
                              />
                            </div>
                          )}

                          {block.type === 'accordion' && (
                            <div className="space-y-3">
                              {(block.data.items || []).map((item: any, i: number) => (
                                <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-indigo-600">
                                      คำถามข้อที่ {i + 1}
                                    </span>
                                    {(block.data.items || []).length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updated = [...block.data.items]
                                          updated.splice(i, 1)
                                          updateBlockData(block.id, 'items', updated)
                                        }}
                                        className="text-xs text-rose-500 hover:underline"
                                      >
                                        ลบข้อนี้
                                      </button>
                                    )}
                                  </div>
                                  <input
                                    type="text"
                                    placeholder="คำถาม FAQ..."
                                    value={item.question || ''}
                                    onChange={(e) => {
                                      const updated = [...block.data.items]
                                      updated[i] = { ...updated[i], question: e.target.value }
                                      updateBlockData(block.id, 'items', updated)
                                    }}
                                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                                  />
                                  <textarea
                                    rows={2}
                                    placeholder="คำตอบ..."
                                    value={item.answer || ''}
                                    onChange={(e) => {
                                      const updated = [...block.data.items]
                                      updated[i] = { ...updated[i], answer: e.target.value }
                                      updateBlockData(block.id, 'items', updated)
                                    }}
                                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                                  />
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...(block.data.items || []), { question: '', answer: '' }]
                                  updateBlockData(block.id, 'items', updated)
                                }}
                                className="px-3 py-1.5 border border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>เพิ่มข้อคำถาม FAQ</span>
                              </button>
                            </div>
                          )}

                          {block.type === 'collapsible' && (
                            <div className="space-y-3">
                              <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                  หัวข้อ/แถบปุ่มกด (Title)
                                </label>
                                <input
                                  type="text"
                                  value={block.data.title || ''}
                                  onChange={(e) => updateBlockData(block.id, 'title', e.target.value)}
                                  placeholder="เช่น อ่านเงื่อนไขเพิ่มเติมสำหรับการสมัครเรียน..."
                                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                  เนื้อหาภายในที่ต้องการซ่อน/แสดง (Content)
                                </label>
                                <CKEditorField
                                  value={block.data.content || ''}
                                  onChange={(html) => updateBlockData(block.id, 'content', html)}
                                  height={200}
                                  compact
                                />
                              </div>
                            </div>
                          )}

                          {block.type === 'button' && (
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1">
                                  ข้อความบนปุ่ม (Label)
                                </label>
                                <input
                                  type="text"
                                  value={block.data.label || ''}
                                  onChange={(e) => updateBlockData(block.id, 'label', e.target.value)}
                                  placeholder="เช่น อ่านรายละเอียดเพิ่มเติม"
                                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1">
                                  ลิงก์ปลายทาง (URL)
                                </label>
                                <input
                                  type="text"
                                  value={block.data.link || ''}
                                  onChange={(e) => updateBlockData(block.id, 'link', e.target.value)}
                                  placeholder="เช่น /news หรือ https://..."
                                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs outline-none font-mono"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1">
                                  ตำแหน่ง (Align)
                                </label>
                                <select
                                  value={block.data.align || 'center'}
                                  onChange={(e) => updateBlockData(block.id, 'align', e.target.value)}
                                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs outline-none"
                                >
                                  <option value="center">กึ่งกลาง</option>
                                  <option value="left">ชิดซ้าย</option>
                                  <option value="right">ชิดขวา</option>
                                </select>
                              </div>
                              <div className="flex items-center pt-4">
                                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={block.data.new_tab == 1}
                                    onChange={(e) => updateBlockData(block.id, 'new_tab', e.target.checked ? 1 : 0)}
                                    className="rounded text-indigo-600"
                                  />
                                  <span>เปิดแท็บใหม่</span>
                                </label>
                              </div>
                            </div>
                          )}

                          {block.type === 'pdf' && (
                            <div className="space-y-3">
                              <AdminUploadField
                                label="ไฟล์เอกสาร PDF"
                                value={block.data.path || ''}
                                onChange={(p) => updateBlockData(block.id, 'path', p)}
                                folder="media"
                                accept=".pdf,application/pdf"
                                previewImage={false}
                              />
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1">
                                  ชื่อเอกสาร PDF
                                </label>
                                <input
                                  type="text"
                                  value={block.data.title || ''}
                                  onChange={(e) => updateBlockData(block.id, 'title', e.target.value)}
                                  placeholder="ระบุชื่อเอกสาร..."
                                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs outline-none"
                                />
                              </div>
                            </div>
                          )}

                          {block.type === 'divider' && (
                            <div className="flex flex-wrap gap-3 items-center p-3 bg-slate-50 rounded-xl border border-slate-200">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-slate-500">รูปแบบ:</span>
                                <select
                                  value={block.data.style || 'solid'}
                                  onChange={(e) => updateBlockData(block.id, 'style', e.target.value)}
                                  className="px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                                >
                                  <option value="solid">เส้นทึบ (Solid)</option>
                                  <option value="dashed">เส้นประ (Dashed)</option>
                                  <option value="dotted">เส้นจุด (Dotted)</option>
                                </select>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-slate-500">สีเส้น:</span>
                                <select
                                  value={block.data.color || 'slate-200'}
                                  onChange={(e) => updateBlockData(block.id, 'color', e.target.value)}
                                  className="px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                                >
                                  <option value="slate-200">สีเทาอ่อน</option>
                                  <option value="indigo-500">สีคราม</option>
                                  <option value="emerald-500">สีเขียว</option>
                                  <option value="rose-500">สีแดง</option>
                                </select>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-slate-500">ระยะเว้น:</span>
                                <select
                                  value={block.data.spacing || 'my-6'}
                                  onChange={(e) => updateBlockData(block.id, 'spacing', e.target.value)}
                                  className="px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                                >
                                  <option value="my-3">แคบ</option>
                                  <option value="my-6">ปกติ</option>
                                  <option value="my-12">กว้าง</option>
                                </select>
                              </div>
                            </div>
                          )}

                          {block.type === 'home_sliders' && (
                            <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-xl text-xs text-indigo-700 font-semibold flex items-center gap-2">
                              <SlidersIcon className="w-4 h-4 text-indigo-600" />
                              <span>สไลเดอร์แบนเนอร์ภาพสไลด์หน้าแรก (ดึงข้อมูลอัตโนมัติจากหน้าจัดการสไลเดอร์)</span>
                            </div>
                          )}

                          {block.type === 'quick_access' && (
                            <div className="space-y-3">
                              {(block.data.items || []).map((item: any, i: number) => (
                                <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-indigo-600">
                                      ปุ่มทางลัดที่ {i + 1}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = [...block.data.items]
                                        updated.splice(i, 1)
                                        updateBlockData(block.id, 'items', updated)
                                      }}
                                      className="text-[10px] text-rose-500 hover:underline"
                                    >
                                      ลบปุ่มนี้
                                    </button>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <input
                                      type="text"
                                      placeholder="หัวข้อปุ่ม..."
                                      value={item.title || ''}
                                      onChange={(e) => {
                                        const updated = [...block.data.items]
                                        updated[i] = { ...updated[i], title: e.target.value }
                                        updateBlockData(block.id, 'items', updated)
                                      }}
                                      className="px-2.5 py-1 bg-white border border-slate-200 rounded text-xs"
                                    />
                                    <input
                                      type="text"
                                      placeholder="คำอธิบายย่อย..."
                                      value={item.subtitle || ''}
                                      onChange={(e) => {
                                        const updated = [...block.data.items]
                                        updated[i] = { ...updated[i], subtitle: e.target.value }
                                        updateBlockData(block.id, 'items', updated)
                                      }}
                                      className="px-2.5 py-1 bg-white border border-slate-200 rounded text-xs"
                                    />
                                    <input
                                      type="text"
                                      placeholder="URL ปลายทาง เช่น /curriculum"
                                      value={item.url || ''}
                                      onChange={(e) => {
                                        const updated = [...block.data.items]
                                        updated[i] = { ...updated[i], url: e.target.value }
                                        updateBlockData(block.id, 'items', updated)
                                      }}
                                      className="px-2.5 py-1 bg-white border border-slate-200 rounded text-xs font-mono"
                                    />
                                    <select
                                      value={item.icon || 'book-open'}
                                      onChange={(e) => {
                                        const updated = [...block.data.items]
                                        updated[i] = { ...updated[i], icon: e.target.value }
                                        updateBlockData(block.id, 'items', updated)
                                      }}
                                      className="px-2.5 py-1 bg-white border border-slate-200 rounded text-xs"
                                    >
                                      <option value="book-open">สมุดหนังสือ (book-open)</option>
                                      <option value="users">กลุ่มคน (users)</option>
                                      <option value="download">ดาวน์โหลด (download)</option>
                                      <option value="graduation-cap">หมวกวิชาการ (graduation-cap)</option>
                                      <option value="phone">โทรศัพท์ (phone)</option>
                                      <option value="mail">อีเมล (mail)</option>
                                    </select>
                                  </div>
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [
                                    ...(block.data.items || []),
                                    { title: 'ปุ่มใหม่', subtitle: 'คำอธิบาย', url: '#', icon: 'book-open' },
                                  ]
                                  updateBlockData(block.id, 'items', updated)
                                }}
                                className="px-3 py-1.5 border border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>เพิ่มปุ่มทางลัดด่วน (+)</span>
                              </button>
                            </div>
                          )}

                          {block.type === 'latest_news' && (
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 font-semibold flex items-center gap-2">
                              <Newspaper className="w-4 h-4 text-sky-600" />
                              <span>ดึงข่าวสารล่าสุด 6 รายการมาแสดงในรูปแบบ Grid อัตโนมัติ</span>
                            </div>
                          )}

                          {block.type === 'categorized_news' && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                  หัวข้อกล่องข่าว
                                </label>
                                <input
                                  type="text"
                                  value={block.data.title || ''}
                                  onChange={(e) => updateBlockData(block.id, 'title', e.target.value)}
                                  placeholder="ว่างไว้หากใช้ชื่อหมวดหมู่"
                                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                  เลือกหมวดหมู่ข่าว *
                                </label>
                                <select
                                  value={block.data.category_id || ''}
                                  onChange={(e) => updateBlockData(block.id, 'category_id', e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none"
                                >
                                  <option value="">-- เลือกหมวดหมู่ข่าว --</option>
                                  {newsCategories.map((c) => (
                                    <option key={c.id} value={String(c.id)}>
                                      {c.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                  จำนวนข่าวที่แสดง
                                </label>
                                <input
                                  type="number"
                                  min={1}
                                  max={20}
                                  value={block.data.limit || 6}
                                  onChange={(e) => updateBlockData(block.id, 'limit', Number(e.target.value) || 6)}
                                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none"
                                />
                              </div>
                            </div>
                          )}

                          {block.type === 'executives' && (
                            <div className="space-y-3">
                              <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-xl text-xs text-purple-700 font-semibold flex items-center gap-2">
                                <UsersIcon className="w-4 h-4 text-purple-600" />
                                <span>แสดงทำเนียบผู้บริหาร (ผู้อำนวยการและรองผู้อำนวยการ) อัตโนมัติ</span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-bold text-slate-700 mb-1">
                                    หัวข้อส่วนบริหาร
                                  </label>
                                  <input
                                    type="text"
                                    value={block.data.title !== undefined ? block.data.title : 'คณะผู้บริหารระดับสูง'}
                                    onChange={(e) => updateBlockData(block.id, 'title', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-bold text-slate-700 mb-1">
                                    คำอธิบายประกอบ
                                  </label>
                                  <input
                                    type="text"
                                    value={
                                      block.data.subtitle !== undefined
                                        ? block.data.subtitle
                                        : 'ผู้สนับสนุนดูแล ขับเคลื่อนนโยบายและการศึกษาที่มีคุณภาพของวิทยาลัย'
                                    }
                                    onChange={(e) => updateBlockData(block.id, 'subtitle', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none"
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {block.type === 'activity_album' && (
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                เลือกอัลบั้มภาพกิจกรรมที่ต้องการดึงมาแสดง
                              </label>
                              <select
                                value={block.data.gallery_id || ''}
                                onChange={(e) => updateBlockData(block.id, 'gallery_id', e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none"
                              >
                                <option value="">-- กรุณาเลือกอัลบั้มกิจกรรม --</option>
                                {galleries.map((gal) => (
                                  <option key={gal.id} value={String(gal.id)}>
                                    {gal.title}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar Layout (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Page Configuration Panel */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Settings className="w-4 h-4 text-indigo-600" />
              <span>ตั้งค่าโครงสร้างหน้าเว็บ</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                รหัสเชื่อมโยง URL Slug *
              </label>
              <input
                type="text"
                required
                value={slug}
                disabled={slug === 'home'}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="เช่น about-college"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-sm outline-none transition font-mono disabled:opacity-60"
              />
              <span className="text-[10px] text-slate-400 mt-1 block leading-normal">
                ลิงก์เว็บหลักจะเป็น: <code className="font-bold">about.php?slug={slug || '...'}</code> (หรือ <code className="font-bold">/{slug || '...'}</code>)
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                รูปแบบเลย์เอาต์หน้าเว็บ (Page Layout)
              </label>
              <select
                value={layout}
                onChange={(e) => setLayout(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-sm outline-none transition bg-white"
              >
                <option value="container">Container (จัดกึ่งกลางความกว้างพอดี)</option>
                <option value="full">Full Width (กว้างเต็มหน้าจอขอบชนขอบ)</option>
              </select>
            </div>
          </div>

          {/* Featured Image Panel */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                <span>รูปภาพหน้าปกเว็บ (Featured Cover)</span>
              </span>
            </h3>

            <AdminUploadField
              label=""
              value={featuredImage}
              onChange={(p) => setFeaturedImage(p)}
              folder="media"
            />
          </div>

          {/* SEO Configurations */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Search className="w-4 h-4 text-indigo-600" />
              <span>ตั้งค่าประสิทธิภาพในหน้าค้นหา (SEO)</span>
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  SEO Meta Title
                </label>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder="ใส่ข้อความที่จะแสดงบนหัวแท็บเบราว์เซอร์"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  SEO Meta Description
                </label>
                <textarea
                  rows={3}
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="เขียนรายละเอียดสรุปเนื้อหาย่อๆ เพื่อดึงดูดผู้ใช้งานบนหน้าแรกค้นหา (Google Search)"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs outline-none transition"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
