import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getSettings, isMaintenanceActive } from '@/lib/settings';
import { getSession } from '@/lib/auth';
import { normalizeImageUrl } from '@/lib/url-helper';
import MaintenanceView from '@/components/public/MaintenanceView';
import GalleryAlbumViewerClient from '@/components/public/GalleryAlbumViewerClient';

export const dynamic = 'force-dynamic';

const THAI_MONTHS_SHORT = [
  'ม.ค.',
  'ก.พ.',
  'มี.ค.',
  'เม.ย.',
  'พ.ค.',
  'มิ.ย.',
  'ก.ค.',
  'ส.ค.',
  'ก.ย.',
  'ต.ค.',
  'พ.ย.',
  'ธ.ค.',
];

function formatDateEnShort(date: Date | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return `${d.getDate()} ${THAI_MONTHS_SHORT[d.getMonth()] || ''} ${
    d.getFullYear() + 543
  }`;
}

export async function renderSingleAlbumView(albumId: number) {
  const album = await prisma.galleries.findFirst({
    where: { id: albumId },
    include: {
      gallery_images: {
        orderBy: { id: 'asc' },
      },
    },
  });

  if (!album) {
    notFound();
  }

  return (
    <>
      {/* Album Header */}
      <section className="relative bg-slate-900 py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-950/90 via-slate-900 to-amber-950/90 z-0"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 z-0"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Link
            href="/gallery"
            className="inline-flex items-center gap-2 text-orange-300 hover:text-white text-sm font-bold mb-6 transition-colors bg-white/5 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10"
          >
            <i className="fa-solid fa-arrow-left"></i> ย้อนกลับไปหน้ารวมอัลบั้ม
          </Link>

          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span className="px-3 py-1 rounded-full bg-orange-500/20 border border-orange-400/30 text-orange-300 text-xs font-bold uppercase tracking-wider">
              <i className="fa-regular fa-calendar mr-1"></i>{' '}
              {formatDateEnShort(album.created_at)}
            </span>
            <span className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-bold">
              <i className="fa-regular fa-images mr-1"></i>{' '}
              {album.gallery_images.length} รูปภาพ
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4 leading-tight">
            {album.title}
          </h1>
          {album.description && (
            <p className="text-slate-300 max-w-3xl text-base md:text-lg font-light leading-relaxed">
              {album.description}
            </p>
          )}
        </div>
      </section>

      {/* Photos Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 -mt-8 relative z-20">
        <GalleryAlbumViewerClient
          albumTitle={album.title}
          images={album.gallery_images.map((g) => ({
            id: g.id,
            image_path: g.image_path,
            caption: null,
          }))}
        />
      </section>
    </>
  );
}

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ album?: string; id?: string }>;
}) {
  const settings = await getSettings();
  const session = await getSession();
  const sp = await searchParams;

  if (!session && isMaintenanceActive(settings, ['gallery.php', 'gallery'])) {
    return <MaintenanceView settings={settings} />;
  }

  const albumParam = sp.album || sp.id;
  if (albumParam && /^\d+$/.test(albumParam)) {
    return renderSingleAlbumView(parseInt(albumParam, 10));
  }

  const albums = await prisma.galleries.findMany({
    include: {
      gallery_images: {
        orderBy: { id: 'asc' },
        take: 1,
      },
      _count: {
        select: { gallery_images: true },
      },
    },
    orderBy: { created_at: 'desc' },
  });

  return (
    <>
      {/* Page Header */}
      <section className="relative bg-slate-900 py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-950/80 via-slate-900 to-amber-950/80 z-0"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 z-0"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-400/30 text-orange-300 text-xs font-bold mb-4 uppercase tracking-wider backdrop-blur-sm">
            <i className="fa-solid fa-camera-retro"></i> Activity Gallery
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
            อัลบั้มภาพกิจกรรม
          </h1>
          <p className="text-slate-300 max-w-2xl mx-auto text-base md:text-lg font-light">
            ประมวลภาพบรรยากาศกิจกรรม โครงการ และการเรียนการสอนของ{' '}
            {settings.site_name || 'สถานศึกษา'}
          </p>
        </div>
      </section>

      {/* Albums Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 -mt-8 relative z-20">
        {albums.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {albums.map((alb) => {
              const rawCover =
                alb.cover_image || alb.gallery_images[0]?.image_path || '';
              const coverThumb = rawCover
                ? normalizeImageUrl(rawCover, 'thumbnail')
                : '';
              const imgCount = alb._count.gallery_images;

              return (
                <Link
                  key={alb.id}
                  href={`/gallery?album=${alb.id}`}
                  className="bg-white rounded-3xl overflow-hidden shadow-lg shadow-slate-200/40 border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group"
                >
                  <div className="relative h-60 overflow-hidden bg-slate-100">
                    {coverThumb ? (
                      <img
                        src={coverThumb}
                        alt={alb.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50">
                        <i className="fa-regular fa-images text-5xl"></i>
                      </div>
                    )}
                    <div className="absolute top-4 right-4">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-900/80 text-white backdrop-blur-md flex items-center gap-1.5 shadow-md">
                        <i className="fa-regular fa-image"></i> {imgCount} รูป
                      </span>
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="text-xs text-slate-400 mb-2 font-medium flex items-center gap-1.5">
                      <i className="fa-regular fa-calendar"></i>{' '}
                      {formatDateEnShort(alb.created_at)}
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-orange-600 transition-colors line-clamp-2">
                      {alb.title}
                    </h3>
                    {alb.description && (
                      <p className="text-slate-500 text-sm line-clamp-2 mb-4 flex-1">
                        {alb.description}
                      </p>
                    )}
                    <div className="pt-4 border-t border-slate-50 flex items-center justify-between mt-auto text-sm font-bold text-orange-600">
                      <span>เปิดดูอัลบั้ม</span>
                      <i className="fa-solid fa-arrow-right transform group-hover:translate-x-1 transition-transform"></i>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-sm max-w-lg mx-auto my-8">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-6 text-4xl">
              <i className="fa-regular fa-images"></i>
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">
              ยังไม่มีอัลบั้มภาพกิจกรรม
            </h3>
            <p className="text-slate-500 text-sm">
              ระบบกำลังรอการอัปเดตภาพกิจกรรมใหม่จากผู้ดูแลระบบ
            </p>
          </div>
        )}
      </section>
    </>
  );
}
