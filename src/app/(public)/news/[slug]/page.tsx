import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getSettings, getThemeClasses } from '@/lib/settings'
import {
  ArrowLeft,
  Calendar,
  User,
  Eye,
  Tag,
  Share2,
  Images,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const slug = decodeURIComponent(params.slug)
  const idNum = parseInt(slug, 10)

  const news = await prisma.news.findFirst({
    where: {
      status: 'published',
      OR: [
        { slug: slug },
        ...(isNaN(idNum) ? [] : [{ id: idNum }]),
      ],
    },
  })

  if (!news) {
    return { title: 'ไม่พบข่าวประชาสัมพันธ์' }
  }

  const coverUrl = news.cover_image
    ? news.cover_image.startsWith('http')
      ? news.cover_image
      : `/${news.cover_image.replace(/^\//, '')}`
    : undefined

  return {
    title: news.meta_title || news.title,
    description:
      news.meta_description ||
      news.title,
    openGraph: {
      title: news.title,
      description: news.meta_description || undefined,
      images: coverUrl ? [{ url: coverUrl }] : [],
    },
  }
}

export default async function NewsDetailPage(props: Props) {
  const params = await props.params
  const slug = decodeURIComponent(params.slug)
  const idNum = parseInt(slug, 10)

  const news = await prisma.news.findFirst({
    where: {
      status: 'published',
      OR: [
        { slug: slug },
        ...(isNaN(idNum) ? [] : [{ id: idNum }]),
      ],
    },
    include: {
      news_categories: true,
      users: { select: { username: true } },
      news_tags: true,
      galleries: {
        include: {
          gallery_images: true,
        },
      },
    },
  })

  if (!news) {
    notFound()
  }

  // Increment views silently
  try {
    await prisma.news.update({
      where: { id: news.id },
      data: { views: { increment: 1 } },
    })
  } catch (e) {
    console.error('Failed to update news views:', e)
  }

  const settings = await getSettings()
  const theme = getThemeClasses(settings.theme_color)

  const formatImagePath = (path: string) => {
    if (path.startsWith('http://') || path.startsWith('https://')) return path
    return path.startsWith('/') ? path : `/${path}`
  }

  const formatDate = (date: Date | null) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('th-TH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Additional images
  let additionalImgs: string[] = []
  if (news.galleries?.gallery_images?.length) {
    additionalImgs = news.galleries.gallery_images.map((g) => g.image_path)
  } else if (news.additional_images) {
    additionalImgs = news.additional_images
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full">
      {/* Back button */}
      <Link
        href="/news"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-800 transition font-semibold mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>ย้อนกลับไปข่าวประชาสัมพันธ์ทั้งหมด</span>
      </Link>

      {/* Header Info */}
      <div className="space-y-4">
        <span
          className={`inline-block px-3 py-1 ${theme.accentBg} ${theme.primaryText} text-xs font-bold rounded-full`}
        >
          {news.news_categories?.name || 'ทั่วไป'}
        </span>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
          {news.title}
        </h1>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-b border-slate-100 pb-4 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDate(news.created_at)}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>{news.users?.username || 'ผู้ดูแลระบบ'}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              <span>{Number((news.views || 0) + 1).toLocaleString()} เข้าชม</span>
            </span>
          </div>
        </div>
      </div>

      {/* Cover Image */}
      {news.cover_image && (
        <div className="relative aspect-video w-full rounded-3xl overflow-hidden my-8 shadow-sm border border-slate-200">
          <Image
            src={formatImagePath(news.cover_image)}
            alt={news.title}
            fill
            priority
            className="object-cover"
            style={{
              objectPosition: `center ${news.cover_position || '50%'}`,
            }}
            sizes="(max-width: 896px) 100vw, 896px"
          />
        </div>
      )}

      {/* Content Body */}
      <div
        className="prose prose-slate max-w-none py-4 text-slate-800 leading-relaxed text-sm sm:text-base prose-img:rounded-2xl prose-img:shadow-sm"
        dangerouslySetInnerHTML={{ __html: news.content || '' }}
      />

      {/* Additional Photos / Gallery */}
      {additionalImgs.length > 0 && (
        <div className="mt-12 pt-8 border-t border-slate-200">
          <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2 mb-4">
            <Images className="w-5 h-5 text-orange-600" />
            <span>รูปภาพประกอบกิจกรรมเพิ่มเติม ({additionalImgs.length} รูป)</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {additionalImgs.map((img, i) => (
              <div
                key={i}
                className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-xs hover:shadow-md transition group"
              >
                <Image
                  src={formatImagePath(img)}
                  alt={`Photo ${i + 1}`}
                  fill
                  className="object-cover group-hover:scale-105 transition duration-300"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {news.news_tags.length > 0 && (
        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <Tag className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-400 font-medium">แท็ก:</span>
          {news.news_tags.map((t) => (
            <span
              key={`${t.news_id}-${t.tag_name}`}
              className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold"
            >
              #{t.tag_name}
            </span>
          ))}
        </div>
      )}
    </article>
  )
}
