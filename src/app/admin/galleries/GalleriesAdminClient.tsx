'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Camera,
  Plus,
  Pencil,
  Trash2,
  Cloud,
  Link2,
  Upload,
  Star,
  X,
  Loader2,
  Images,
} from 'lucide-react'
import { normalizeImageUrl } from '@/lib/url-helper'
import { swalConfirm, swalSuccess, swalError } from '@/lib/sweetalert'

interface GalleryPhoto {
  id: number
  gallery_id: number
  image_path: string
}

interface GalleryAlbum {
  id: number
  title: string
  description: string | null
  cover_image: string | null
  created_at: string | null
  gallery_images: GalleryPhoto[]
}

export function GalleriesAdminClient({
  initialAlbums,
}: {
  initialAlbums: GalleryAlbum[]
}) {
  const router = useRouter()
  const [albumModal, setAlbumModal] = useState(false)
  const [activeAlbumId, setActiveAlbumId] = useState<number | null>(null)
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<number[]>([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Immich modal
  const [immichModal, setImmichModal] = useState(false)
  const [immichAlbums, setImmichAlbums] = useState<any[]>([])
  const [loadingImmich, setLoadingImmich] = useState(false)

  // Shared Link modal
  const [linkModal, setLinkModal] = useState(false)
  const [linkForm, setLinkForm] = useState({
    title: '',
    description: '',
    shared_url: '',
  })

  const [form, setForm] = useState({
    id: 0,
    title: '',
    description: '',
    cover_image: '',
    image_paths: [] as string[],
  })

  const activeAlbum = initialAlbums.find((a) => a.id === activeAlbumId) || null

  const openCreate = () => {
    setForm({
      id: 0,
      title: '',
      description: '',
      cover_image: '',
      image_paths: [],
    })
    setAlbumModal(true)
  }

  const openEdit = (a: GalleryAlbum) => {
    setForm({
      id: a.id,
      title: a.title,
      description: a.description || '',
      cover_image: a.cover_image || '',
      image_paths: [],
    })
    setAlbumModal(true)
  }

  const handleSaveAlbum = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'galleries',
          action: 'save_album',
          data: form,
        }),
      })
      if (res.ok) {
        setAlbumModal(false)
        router.refresh()
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAlbum = async (id: number) => {
    const ok = await swalConfirm({
      title: 'ยืนยันการลบอัลบั้มภาพ?',
      text: 'อัลบั้มภาพนี้และรูปภาพทั้งหมดภายในจะถูกลบออกจากระบบอย่างถาวร',
      confirmButtonText: 'ลบอัลบั้ม',
    })
    if (!ok) return
    const res = await fetch('/api/admin/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        module: 'galleries',
        action: 'delete_album',
        data: { id },
      }),
    })
    if (res.ok) {
      if (activeAlbumId === id) setActiveAlbumId(null)
      router.refresh()
    }
  }

  const handleUploadToAlbum = async (
    galleryId: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('folder', 'galleries')
      for (let i = 0; i < files.length; i++) {
        fd.append('files', files[i])
      }
      const upRes = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const upJson = await upRes.json()
      if (!upRes.ok) throw new Error(upJson.error || 'Upload failed')
      const paths = (upJson.files || []).map((f: any) => f.path)

      await fetch('/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'galleries',
          action: 'add_images',
          data: { gallery_id: galleryId, image_paths: paths },
        }),
      })
      router.refresh()
    } catch (err: any) {
      swalError('อัปโหลดรูปภาพไม่สำเร็จ', err.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleBulkDeletePhotos = async () => {
    if (selectedPhotoIds.length === 0) return
    const ok = await swalConfirm({
      title: 'ยืนยันการลบรูปภาพ?',
      text: `ต้องการลบรูปภาพที่เลือกจำนวน ${selectedPhotoIds.length} รูป ใช่หรือไม่?`,
      confirmButtonText: 'ลบรูปภาพ',
    })
    if (!ok) return
    await fetch('/api/admin/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        module: 'galleries',
        action: 'bulk_delete_images',
        data: { ids: selectedPhotoIds },
      }),
    })
    setSelectedPhotoIds([])
    router.refresh()
  }

  const handleSetCover = async (galleryId: number, imagePath: string) => {
    await fetch('/api/admin/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        module: 'galleries',
        action: 'set_cover',
        data: { gallery_id: galleryId, cover_image: imagePath },
      }),
    })
    router.refresh()
  }

  const openImmichModal = async () => {
    setImmichModal(true)
    setLoadingImmich(true)
    try {
      const res = await fetch('/api/admin/cms?module=galleries&action=immich_albums')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'ไม่สามารถดึงข้อมูล Immich ได้')
      setImmichAlbums(Array.isArray(json.albums) ? json.albums : [])
    } catch (err: any) {
      swalError('ไม่สามารถดึงข้อมูล Immich ได้', err.message)
    } finally {
      setLoadingImmich(false)
    }
  }

  const handleImportImmich = async (album: any) => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'galleries',
          action: 'import_immich_album',
          data: {
            immich_album_id: album.id,
            title: album.albumName,
            description: album.description || '',
          },
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Import failed')
      await swalSuccess('นำเข้าอัลบั้มสำเร็จ', `นำเข้าอัลบั้ม "${album.albumName}" (${json.count} รูป) เรียบร้อยแล้ว`)
      setImmichModal(false)
      router.refresh()
    } catch (err: any) {
      swalError('นำเข้าไม่สำเร็จ', err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleImportSharedLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'galleries',
          action: 'import_shared_link',
          data: linkForm,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'นำเข้าไม่สำเร็จ')
      await swalSuccess('นำเข้ารูปภาพสำเร็จ', `นำเข้ารูปภาพสำเร็จ ${json.count} รูป`)
      setLinkModal(false)
      setLinkForm({ title: '', description: '', shared_url: '' })
      router.refresh()
    } catch (err: any) {
      swalError('นำเข้าไม่สำเร็จ', err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Camera className="w-6 h-6 text-indigo-600" />
            จัดการคลังภาพกิจกรรม ({initialAlbums.length} อัลบั้ม)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            สร้างอัลบั้มภาพกิจกรรม อัปโหลดรูปภาพหลายไฟล์ หรือซิงค์อัลบั้มจาก Immich / Google Photos / Google Drive
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={openImmichModal}
            className="inline-flex items-center px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl border border-indigo-200 cursor-pointer"
          >
            <Cloud className="w-4 h-4 mr-1.5" />
            ดึงอัลบั้มจาก Immich
          </button>
          <button
            onClick={() => setLinkModal(true)}
            className="inline-flex items-center px-3.5 py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold rounded-xl border border-sky-200 cursor-pointer"
          >
            <Link2 className="w-4 h-4 mr-1.5" />
            นำเข้าจากลิงก์แชร์ (Drive / Photos)
          </button>
          <button
            onClick={openCreate}
            className="inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            สร้างอัลบั้มใหม่
          </button>
        </div>
      </div>

      {/* Active Album Detail View */}
      {activeAlbum ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <button
                onClick={() => {
                  setActiveAlbumId(null)
                  setSelectedPhotoIds([])
                }}
                className="text-xs font-semibold text-indigo-600 hover:underline mb-1 cursor-pointer"
              >
                &larr; กลับไปหน้ารวมอัลบั้มทั้งหมด
              </button>
              <h2 className="text-lg font-bold text-slate-800">
                อัลบั้ม: {activeAlbum.title} ({activeAlbum.gallery_images.length} รูป)
              </h2>
              {activeAlbum.description && (
                <p className="text-xs text-slate-500">{activeAlbum.description}</p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {selectedPhotoIds.length > 0 && (
                <button
                  onClick={handleBulkDeletePhotos}
                  className="inline-flex items-center px-3.5 py-2 bg-red-600 text-white text-xs font-semibold rounded-xl cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  ลบรูปที่เลือก ({selectedPhotoIds.length})
                </button>
              )}

              <label className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl cursor-pointer">
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> กำลังอัปโหลด...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-1.5" /> อัปโหลดรูปเพิ่มในอัลบั้มนี้
                  </>
                )}
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleUploadToAlbum(activeAlbum.id, e)}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {activeAlbum.gallery_images.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              ยังไม่มีรูปภาพในอัลบั้มนี้ กดปุ่ม &ldquo;อัปโหลดรูปเพิ่มในอัลบั้มนี้&rdquo; ด้านบน
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {activeAlbum.gallery_images.map((photo) => {
                const isCover = activeAlbum.cover_image === photo.image_path
                const isChecked = selectedPhotoIds.includes(photo.id)
                return (
                  <div
                    key={photo.id}
                    className={`relative group aspect-square rounded-xl overflow-hidden border-2 transition-all bg-slate-100 ${
                      isCover
                        ? 'border-amber-500'
                        : isChecked
                        ? 'border-indigo-600'
                        : 'border-slate-200'
                    }`}
                  >
                    <img
                      src={normalizeImageUrl(photo.image_path, 'thumbnail')}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPhotoIds([...selectedPhotoIds, photo.id])
                        } else {
                          setSelectedPhotoIds(
                            selectedPhotoIds.filter((id) => id !== photo.id)
                          )
                        }
                      }}
                      className="absolute top-2 left-2 w-4 h-4 rounded cursor-pointer"
                    />
                    {isCover && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full">
                        ภาพปก
                      </span>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-slate-900/75 p-1.5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleSetCover(activeAlbum.id, photo.image_path)}
                        className="text-[10px] text-amber-300 hover:text-amber-200 font-semibold flex items-center gap-0.5 cursor-pointer"
                      >
                        <Star className="w-3 h-3" /> ตั้งเป็นปก
                      </button>
                      <button
                        onClick={async () => {
                          await fetch('/api/admin/cms', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              module: 'galleries',
                              action: 'delete_image',
                              data: { id: photo.id },
                            }),
                          })
                          router.refresh()
                        }}
                        className="text-red-400 hover:text-red-300 p-0.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        /* Albums Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {initialAlbums.map((album) => {
            const cover =
              album.cover_image || album.gallery_images[0]?.image_path || ''
            return (
              <div
                key={album.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-all"
              >
                <div
                  onClick={() => setActiveAlbumId(album.id)}
                  className="aspect-video bg-slate-100 relative overflow-hidden cursor-pointer"
                >
                  {cover ? (
                    <img
                      src={normalizeImageUrl(cover, 'thumbnail')}
                      alt={album.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                      <Images className="w-8 h-8 mb-1" />
                      <span className="text-xs">ยังไม่มีรูปภาพ</span>
                    </div>
                  )}
                  <span className="absolute bottom-2 right-2 px-2.5 py-1 bg-slate-900/75 text-white text-xs font-semibold rounded-lg">
                    {album.gallery_images.length} รูป
                  </span>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-bold text-slate-800 line-clamp-1">
                      {album.title}
                    </h3>
                    {album.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                        {album.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => setActiveAlbumId(album.id)}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      จัดการรูปภาพ ({album.gallery_images.length})
                    </button>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEdit(album)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 cursor-pointer"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAlbum(album.id)}
                        className="p-1.5 text-slate-500 hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create/Edit Album Modal */}
      {albumModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 w-full max-w-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800">
                {form.id ? 'แก้ไขข้อมูลอัลบั้ม' : 'สร้างอัลบั้มภาพกิจกรรมใหม่'}
              </h3>
              <button
                onClick={() => setAlbumModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveAlbum} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  ชื่ออัลบั้มกิจกรรม *
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  คำอธิบายอัลบั้ม
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAlbumModal(false)}
                  className="px-4 py-2 text-sm bg-slate-100 rounded-xl cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-xl cursor-pointer"
                >
                  {saving ? 'กำลังบันทึก...' : 'บันทึกอัลบั้ม'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Immich Import Modal */}
      {immichModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 w-full max-w-xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Cloud className="w-5 h-5 text-indigo-600" />
                เลือกอัลบั้มจาก Immich Server
              </h3>
              <button
                onClick={() => setImmichModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
              {loadingImmich ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  กำลังดึงรายการอัลบั้มจาก Immich...
                </div>
              ) : immichAlbums.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  ไม่พบอัลบั้มใน Immich หรือยังไม่ได้ตั้งค่า API Key ในหน้าตั้งค่าเว็บไซต์
                </div>
              ) : (
                immichAlbums.map((alb: any) => (
                  <div
                    key={alb.id}
                    className="py-3 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="font-semibold text-slate-800 text-sm">
                        {alb.albumName}
                      </div>
                      <div className="text-xs text-slate-400">
                        จำนวน {alb.assetCount || 0} รูป
                      </div>
                    </div>
                    <button
                      onClick={() => handleImportImmich(alb)}
                      disabled={saving}
                      className="px-3.5 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-xl cursor-pointer"
                    >
                      นำเข้าอัลบั้มนี้
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Shared Link Import Modal */}
      {linkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 w-full max-w-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800">
                นำเข้าอัลบั้มจากลิงก์แชร์ (Google Photos / Drive / URL รูปภาพ)
              </h3>
              <button
                onClick={() => setLinkModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleImportSharedLink} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  ชื่ออัลบั้มใหม่ *
                </label>
                <input
                  type="text"
                  required
                  value={linkForm.title}
                  onChange={(e) =>
                    setLinkForm({ ...linkForm, title: e.target.value })
                  }
                  placeholder="ระบุชื่ออัลบั้มกิจกรรม..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  ลิงก์อัลบั้มสาธารณะ หรือรายการ URL รูปภาพ (แยกบรรทัดได้) *
                </label>
                <textarea
                  rows={4}
                  required
                  value={linkForm.shared_url}
                  onChange={(e) =>
                    setLinkForm({ ...linkForm, shared_url: e.target.value })
                  }
                  placeholder="https://photos.app.goo.gl/... หรือ https://drive.google.com/..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setLinkModal(false)}
                  className="px-4 py-2 text-sm bg-slate-100 rounded-xl cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-xl cursor-pointer"
                >
                  {saving ? 'กำลังดึงรูปภาพ...' : 'เริ่มนำเข้ารูปภาพ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
