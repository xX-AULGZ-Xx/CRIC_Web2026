import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import prisma from '@/lib/prisma'
import { getSettings, getThemeClasses } from '@/lib/settings'
import { Images, Calendar, ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function GalleryPage() {
  const [settings, albums] = await Promise.all([
    getSettings(),
    prisma.galleries.findMany({
      include: {
        _count: {
          select: { gallery_images: true },
        },
        gallery_images: {
          take: 1,
          orderBy: { id: 'desc' },
        },
      },
      orderBy: { created_at: 'desc' },
    }),
  ])

  const theme = getThemeClasses(settings.theme_color)

  const formatImagePath = (path: string | null) => {
    if (!path) return '/assets/images/default-curriculum.jpg'
    if (path.startsWith('http://') || path.startsWith('https://')) return path
    return path.startsWith('/') ? path : `/${path}`
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <Images className="w-8 h-8 text-orange-600" />
          <span>คลังภาพกิจกรรม</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1.5">
          ประมวลภาพกิจกรรม บรรยากาศการเรียนการสอน และโครงการต่างๆ ของวิทยาลัย
        </p>
      </div>

      {/* Albums Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {albums.map((album) => {
          const cover =
            album.cover_image || album.gallery_images[0]?.image_path || null
          const imgCount = album._count.gallery_images

          return (
            <article
              key={album.id}
              className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
            >
              <div className="aspect-video bg-slate-100 relative overflow-hidden">
                <Image
                  src={formatImagePath(cover)}
                  alt={album.title}
                  fill
                  className="object-cover group-hover:scale-105 transition duration-500"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <span className="absolute bottom-3 right-3 px-3 py-1 bg-black/60 backdrop-blur-md text-white rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md">
                  <Images className="w-3.5 h-3.5" />
                  <span>{imgCount} รูป</span>
                </span>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base sm:text-lg leading-snug line-clamp-2 group-hover:text-orange-600 transition">
                    <Link href={`/gallery/${album.id}`}>{album.title}</Link>
                  </h3>
                  {album.description && (
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                      {album.description}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {album.created_at
                        ? new Date(album.created_at).toLocaleDateString('th-TH')
                        : ''}
                    </span>
                  </span>
                  <Link
                    href={`/gallery/${album.id}`}
                    className={`${theme.primaryText} hover:underline flex items-center gap-1 font-bold`}
                  >
                    <span>เปิดดูอัลบั้ม</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
