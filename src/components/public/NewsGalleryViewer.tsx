'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Images,
  Maximize2,
  LayoutGrid,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Download,
  X,
  ExternalLink,
} from 'lucide-react';
import { normalizeImageUrl } from '@/lib/url-helper';
import Link from 'next/link';

interface NewsGalleryViewerProps {
  title: string;
  subtitle?: string | null;
  images: string[];
  galleryLink?: {
    href: string;
    label: string;
  };
  initialLimit?: number;
}

export default function NewsGalleryViewer({
  title,
  subtitle,
  images,
  galleryLink,
  initialLimit = 8,
}: NewsGalleryViewerProps) {
  const [expanded, setExpanded] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalPhotos = images.length;
  if (totalPhotos === 0) return null;

  const displayLimit = expanded ? totalPhotos : initialLimit;
  const visibleImages = images.slice(0, displayLimit);
  const remainingCount = totalPhotos > initialLimit ? totalPhotos - initialLimit + 1 : 0;

  const openLightbox = (index: number) => {
    setActiveIndex(index);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = useCallback(() => {
    setActiveIndex(null);
    document.body.style.overflow = '';
  }, []);

  const prevImage = useCallback(
    (e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      setActiveIndex((current) => {
        if (current === null) return 0;
        return (current - 1 + totalPhotos) % totalPhotos;
      });
    },
    [totalPhotos]
  );

  const nextImage = useCallback(
    (e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      setActiveIndex((current) => {
        if (current === null) return 0;
        return (current + 1) % totalPhotos;
      });
    },
    [totalPhotos]
  );

  useEffect(() => {
    if (activeIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'ArrowRight') nextImage();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, closeLightbox, prevImage, nextImage]);

  const currentImgRaw = activeIndex !== null ? images[activeIndex] : null;
  const currentPreviewUrl = currentImgRaw
    ? normalizeImageUrl(currentImgRaw, 'preview')
    : '';
  const currentDownloadUrl = currentImgRaw
    ? normalizeImageUrl(currentImgRaw, 'large')
    : '';

  return (
    <div ref={containerRef} className="mt-10 border-t border-slate-100 pt-8 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Images className="w-5 h-5 text-orange-600" />
            <span>{title}</span>
            <span className="px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 text-xs font-bold border border-orange-100">
              {totalPhotos} รูป
            </span>
          </h3>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
          )}
        </div>

        {galleryLink && (
          <Link
            href={galleryLink.href}
            className="inline-flex items-center gap-1.5 text-xs text-orange-600 hover:text-orange-800 font-bold shrink-0 transition-colors group"
          >
            <span>{galleryLink.label}</span>
            <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}
      </div>

      {/* Photos Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {visibleImages.map((photoPath, index) => {
          const isOverlayItem =
            !expanded &&
            totalPhotos > initialLimit &&
            index === initialLimit - 1;

          const thumbUrl = normalizeImageUrl(photoPath, 'thumbnail');

          return (
            <div
              key={index}
              onClick={() => {
                if (isOverlayItem && !expanded) {
                  setExpanded(true);
                } else {
                  openLightbox(index);
                }
              }}
              className="aspect-square bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 shadow-xs relative group cursor-zoom-in transition-all duration-300 hover:shadow-md"
            >
              <img
                src={thumbUrl}
                alt={`ภาพกิจกรรมที่ ${index + 1}`}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />

              {isOverlayItem ? (
                <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-[1px] transition duration-200 flex flex-col items-center justify-center text-white p-2 text-center group-hover:bg-slate-950/75">
                  <span className="text-xl font-extrabold tracking-tight">
                    +{remainingCount}
                  </span>
                  <span className="text-[11px] uppercase font-bold tracking-wider text-slate-200 mt-0.5">
                    รูปภาพเพิ่มเติม
                  </span>
                </div>
              ) : (
                <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center text-white">
                  <span className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                    <Maximize2 className="w-5 h-5" />
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Expand / Collapse Button */}
      {totalPhotos > initialLimit && (
        <div className="flex justify-center pt-2">
          {!expanded ? (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-orange-600 font-bold rounded-xl text-xs transition duration-200 border border-slate-200/80 cursor-pointer shadow-2xs"
            >
              <LayoutGrid className="w-4 h-4" />
              <span>แสดงภาพกิจกรรมทั้งหมด (+{totalPhotos - initialLimit} รูป)</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setExpanded(false);
                containerRef.current?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition duration-200 border border-slate-200/80 cursor-pointer shadow-2xs"
            >
              <ChevronUp className="w-4 h-4" />
              <span>ย่อการแสดงภาพกิจกรรม</span>
            </button>
          )}
        </div>
      )}

      {/* Interactive Lightbox Overlay Modal */}
      {activeIndex !== null && (
        <div
          id="news-lightbox"
          className="fixed inset-0 bg-slate-950/95 z-[9999] flex items-center justify-center p-4 backdrop-blur-md select-none animate-in fade-in duration-200 cursor-zoom-out"
          onClick={closeLightbox}
        >
          {/* Top Bar: Counter & Controls */}
          <div
            className="absolute top-4 left-4 z-50 text-white text-xs font-bold bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            รูปภาพที่ {activeIndex + 1} / {totalPhotos}
          </div>

          <div
            className="absolute top-4 right-4 z-50 flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            {currentDownloadUrl && (
              <a
                href={currentDownloadUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 bg-black/60 hover:bg-black/90 text-white rounded-full transition border border-white/10 flex items-center justify-center cursor-pointer"
                title="ดาวน์โหลดรูปภาพ"
              >
                <Download className="w-4 h-4" />
              </a>
            )}
            <button
              type="button"
              onClick={closeLightbox}
              className="p-2.5 bg-black/60 hover:bg-rose-600 text-white rounded-full transition border border-white/10 flex items-center justify-center cursor-pointer"
              title="ปิด (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Prev Button */}
          {totalPhotos > 1 && (
            <button
              type="button"
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/60 hover:bg-black/90 text-white rounded-full transition border border-white/10 z-50 flex items-center justify-center cursor-pointer"
              title="ก่อนหน้า (ลูกศรซ้าย)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Main Active Image */}
          <div
            className="relative max-w-[90vw] max-h-[85vh] flex items-center justify-center cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={currentPreviewUrl}
              alt={`รูปภาพกิจกรรมที่ ${activeIndex + 1}`}
              className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain"
            />
          </div>

          {/* Next Button */}
          {totalPhotos > 1 && (
            <button
              type="button"
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/60 hover:bg-black/90 text-white rounded-full transition border border-white/10 z-50 flex items-center justify-center cursor-pointer"
              title="ถัดไป (ลูกศรขวา)"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
