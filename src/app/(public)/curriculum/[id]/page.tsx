import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getSettings, getThemeClasses } from '@/lib/settings'
import {
  ArrowLeft,
  GraduationCap,
  Download,
  ExternalLink,
  Briefcase,
  CheckCircle2,
  Clock,
  Images,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{
    id: string
  }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const id = parseInt(params.id, 10)
  if (isNaN(id)) return { title: 'ไม่พบหลักสูตร' }

  const curr = await prisma.curriculums.findUnique({ where: { id } })
  if (!curr) return { title: 'ไม่พบหลักสูตร' }

  return {
    title: `สาขาวิชา${curr.name} (${curr.level})`,
    description: curr.description?.replace(/<[^>]*>/g, '').slice(0, 150) || undefined,
  }
}

export default async function CurriculumDetailPage(props: Props) {
  const params = await props.params
  const id = parseInt(params.id, 10)
  if (isNaN(id)) notFound()

  const curr = await prisma.curriculums.findUnique({
    where: { id },
  })

  if (!curr) notFound()

  const settings = await getSettings()
  const theme = getThemeClasses(settings.theme_color)

  const formatImagePath = (path: string | null) => {
    if (!path) return '/assets/images/default-curriculum.jpg'
    if (path.startsWith('http://') || path.startsWith('https://')) return path
    return path.startsWith('/') ? path : `/${path}`
  }

  let galleryImgs: string[] = []
  if (curr.gallery_images) {
    try {
      const parsed = JSON.parse(curr.gallery_images)
      if (Array.isArray(parsed)) galleryImgs = parsed
    } catch {
      galleryImgs = curr.gallery_images.split(',').map((s) => s.trim()).filter(Boolean)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full">
      <Link
        href="/curriculum"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-800 transition font-semibold mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>ย้อนกลับไปสาขาวิชาทั้งหมด</span>
      </Link>

      <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs">
        {/* Cover */}
        <div className="relative aspect-video sm:aspect-21/9 w-full bg-slate-900">
          <Image
            src={formatImagePath(curr.image_path)}
            alt={curr.name}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 1024px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-6 sm:p-10">
            <div className="text-white space-y-2">
              <span className={`inline-block px-3 py-1 ${theme.primaryBg} text-white rounded-full text-xs font-bold`}>
                ระดับ {curr.level || 'ปวช.-ปวส.'}
              </span>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                สาขาวิชา{curr.name}
              </h1>
              {curr.code && (
                <p className="text-xs sm:text-sm text-slate-300 font-mono">
                  รหัสสาขา: {curr.code}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Info Body */}
        <div className="p-6 sm:p-10 space-y-8">
          {/* Action buttons (Download file / External link) */}
          <div className="flex flex-wrap items-center gap-3 pb-6 border-b border-slate-100">
            {curr.file_path && (
              <a
                href={curr.file_path.startsWith('/') ? curr.file_path : `/${curr.file_path}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 px-5 py-2.5 ${theme.primaryBg} text-white font-bold rounded-2xl text-xs sm:text-sm shadow-sm hover:opacity-95 transition`}
              >
                <Download className="w-4 h-4" />
                <span>ดาวน์โหลดเอกสารหลักสูตร</span>
              </a>
            )}
            {curr.website_url && (
              <a
                href={curr.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold rounded-2xl text-xs sm:text-sm transition"
              >
                <ExternalLink className="w-4 h-4" />
                <span>เว็บไซต์แผนกวิชา</span>
              </a>
            )}
          </div>

          {/* Description */}
          {curr.description && (
            <div className="space-y-3">
              <h2 className="text-lg font-extrabold text-slate-900">รายละเอียดสาขาวิชา</h2>
              <div
                className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-sm sm:text-base"
                dangerouslySetInnerHTML={{ __html: curr.description }}
              />
            </div>
          )}

          {/* Qualification */}
          {curr.qualification && (
            <div className="space-y-3 pt-6 border-t border-slate-100">
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>คุณสมบัติของผู้สมัครเข้าศึกษา</span>
              </h2>
              <div
                className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-sm sm:text-base"
                dangerouslySetInnerHTML={{ __html: curr.qualification }}
              />
            </div>
          )}

          {/* Career guidelines */}
          {curr.career_guidelines && (
            <div className="space-y-3 pt-6 border-t border-slate-100">
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-orange-600" />
                <span>แนวทางการประกอบอาชีพ / โอกาสในการทำงาน</span>
              </h2>
              <div
                className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-sm sm:text-base"
                dangerouslySetInnerHTML={{ __html: curr.career_guidelines }}
              />
            </div>
          )}

          {/* Gallery images */}
          {galleryImgs.length > 0 && (
            <div className="space-y-4 pt-6 border-t border-slate-100">
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Images className="w-5 h-5 text-orange-600" />
                <span>ภาพบรรยากาศการเรียนการสอน ({galleryImgs.length} รูป)</span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {galleryImgs.map((img, i) => (
                  <div
                    key={i}
                    className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 border border-slate-200"
                  >
                    <Image
                      src={formatImagePath(img)}
                      alt={`Activity ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
