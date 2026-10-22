import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { ArrowLeft, Calendar, Images } from 'lucide-react'
import { GalleryViewer } from '@/components/gallery/GalleryViewer'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{
    id: string
  }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const id = parseInt(params.id, 10)
  if (isNaN(id)) return { title: 'ไม่พบอัลบั้มภาพ' }

  const album = await prisma.galleries.findUnique({ where: { id } })
  if (!album) return { title: 'ไม่พบอัลบั้มภาพ' }

  return {
    title: album.title,
    description: album.description || undefined,
  }
}

export default async function AlbumDetailPage(props: Props) {
  const params = await props.params
  const id = parseInt(params.id, 10)
  if (isNaN(id)) notFound()

  const album = await prisma.galleries.findUnique({
    where: { id },
    include: {
      gallery_images: {
        orderBy: { id: 'desc' },
      },
    },
  })

  if (!album) notFound()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full">
      {/* Back button */}
      <Link
        href="/gallery"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-800 transition font-semibold mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>ย้อนกลับไปคลังภาพกิจกรรม</span>
      </Link>

      {/* Header */}
      <div className="mb-8 space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {album.title}
        </h1>
        {album.description && (
          <p className="text-sm text-slate-500 leading-relaxed max-w-3xl">
            {album.description}
          </p>
        )}
        <div className="flex items-center gap-4 text-xs text-slate-400 pt-2">
          {album.created_at && (
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{new Date(album.created_at).toLocaleDateString('th-TH')}</span>
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Images className="w-3.5 h-3.5" />
            <span>ทั้งหมด {album.gallery_images.length} รูป</span>
          </span>
        </div>
      </div>

      {/* Gallery Viewer */}
      <GalleryViewer photos={album.gallery_images} />
    </div>
  )
}
