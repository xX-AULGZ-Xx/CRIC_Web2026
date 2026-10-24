'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { normalizeImageUrl } from '@/lib/url-helper';

export interface GalleryPhotoItem {
  id: number;
  image_path: string;
  caption: string | null;
}

interface GalleryAlbumViewerClientProps {
  albumTitle: string;
  images: GalleryPhotoItem[];
}

const INITIAL_BATCH = 36;
const BATCH_INCREMENT = 24;

// Single Photo Card with Skeleton & Fade-in
function PhotoThumbnailCard({
  img,
  index,
  albumTitle,
  onClick,
}: {
  img: GalleryPhotoItem;
  index: number;
  albumTitle: string;
  onClick: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const thumbSrc = normalizeImageUrl(img.image_path, 'thumbnail');

  return (
    <div
      onClick={onClick}
      className="group relative h-64 rounded-2xl overflow-hidden bg-slate-100 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-slate-200/80"
    >
      {/* Skeleton Shimmer */}
      {!loaded && !error && (
        <div className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-pulse flex items-center justify-center">
          <i className="fa-regular fa-image text-slate-300 text-3xl"></i>
        </div>
      )}

      {/* Error Fallback */}
      {error ? (
        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100 p-4 text-center">
          <i className="fa-solid fa-triangle-exclamation text-2xl mb-1 text-amber-500"></i>
          <span className="text-xs">ไม่สามารถแสดงภาพได้</span>
        </div>
      ) : (
        <img
          src={thumbSrc}
          alt={img.caption || albumTitle}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`w-full h-full object-cover group-hover:scale-108 transition-all duration-500 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4">
        <div className="flex items-center justify-between">
          <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs text-[11px] font-mono text-white font-bold">
            #{index + 1}
          </span>
          <div className="w-9 h-9 rounded-full bg-orange-600 text-white flex items-center justify-center shadow-lg transform -translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            <i className="fa-solid fa-expand text-xs"></i>
          </div>
        </div>
        {img.caption && (
          <p className="text-white text-xs font-medium line-clamp-2 leading-relaxed bg-black/40 p-2 rounded-lg backdrop-blur-xs">
            {img.caption}
          </p>
        )}
      </div>
    </div>
  );
}

export default function GalleryAlbumViewerClient({
  albumTitle,
  images,
}: GalleryAlbumViewerClientProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(INITIAL_BATCH);
  const [lightboxLoading, setLightboxLoading] = useState(true);

  // Touch Swipe for Mobile Lightbox
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  // Sentinel ref for infinite scroll
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Automatic Infinite Scroll
  useEffect(() => {
    if (visibleCount >= images.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + BATCH_INCREMENT, images.length));
        }
      },
      { rootMargin: '400px' }
    );

    const el = sentinelRef.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, [visibleCount, images.length]);

  const closeLightbox = useCallback(() => {
    setActiveIndex(null);
    document.body.style.overflow = '';
  }, []);

  const openLightbox = (index: number) => {
    setLightboxLoading(true);
    setActiveIndex(index);
    document.body.style.overflow = 'hidden';
  };

  const changeSlide = useCallback(
    (step: number) => {
      if (activeIndex === null || images.length === 0) return;
      setLightboxLoading(true);
      const next = (activeIndex + step + images.length) % images.length;
      setActiveIndex(next);
    },
    [activeIndex, images.length]
  );

  // Preload adjacent images in lightbox
  useEffect(() => {
    if (activeIndex === null || images.length === 0) return;

    // Next image preload
    const nextIdx = (activeIndex + 1) % images.length;
    const nextImg = new Image();
    nextImg.src = normalizeImageUrl(images[nextIdx].image_path, 'preview');

    // Prev image preload
    const prevIdx = (activeIndex - 1 + images.length) % images.length;
    const prevImg = new Image();
    prevImg.src = normalizeImageUrl(images[prevIdx].image_path, 'preview');
  }, [activeIndex, images]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeIndex === null) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') changeSlide(-1);
      if (e.key === 'ArrowRight') changeSlide(1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, closeLightbox, changeSlide]);

  // Touch swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };
  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        changeSlide(1); // Swipe left -> Next
      } else {
        changeSlide(-1); // Swipe right -> Prev
      }
    }
  };

  if (images.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-sm max-w-lg mx-auto my-8">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-6 text-4xl">
          <i className="fa-regular fa-images"></i>
        </div>
        <h3 className="text-xl font-bold text-slate-700 mb-2">
          ยังไม่มีรูปภาพในอัลบั้มนี้
        </h3>
        <p className="text-slate-500 text-sm">
          ผู้ดูแลระบบกำลังดำเนินการอัปโหลดรูปภาพกิจกรรม
        </p>
      </div>
    );
  }

  const visibleImages = images.slice(0, visibleCount);
  const currentImage = activeIndex !== null ? images[activeIndex] : null;
  const progressPercent = Math.min(100, Math.round((visibleCount / images.length) * 100));

  return (
    <>
      {/* Photos Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {visibleImages.map((img, index) => (
          <PhotoThumbnailCard
            key={img.id}
            img={img}
            index={index}
            albumTitle={albumTitle}
            onClick={() => openLightbox(index)}
          />
        ))}
      </div>

      {/* Sentinel Element for Auto Scroll */}
      <div ref={sentinelRef} className="h-6 w-full" />

      {/* Progressive Load Bar & Manual Buttons (If more images exist) */}
      {visibleCount < images.length && (
        <div className="mt-12 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm max-w-xl mx-auto text-center space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-1">
            <span>แสดงรูปภาพ</span>
            <span>
              {visibleCount} / {images.length} รูป ({progressPercent}%)
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-orange-500 to-amber-500 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() =>
                setVisibleCount((prev) => Math.min(prev + BATCH_INCREMENT, images.length))
              }
              className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <i className="fa-solid fa-arrow-down"></i> โหลดรูปภาพเพิ่ม (+{Math.min(BATCH_INCREMENT, images.length - visibleCount)})
            </button>
            <button
              type="button"
              onClick={() => setVisibleCount(images.length)}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all cursor-pointer"
            >
              แสดงทั้งหมด ({images.length} รูป)
            </button>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {activeIndex !== null && currentImage && (
        <div
          id="lightbox"
          className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center transition-opacity duration-300 select-none"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeLightbox();
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Top Controls Bar */}
          <div className="absolute top-4 left-4 right-4 sm:top-6 sm:left-6 sm:right-6 flex items-center justify-between z-50 pointer-events-none">
            {/* Counter */}
            <div className="px-3.5 py-1.5 rounded-full bg-black/60 border border-white/10 text-white text-xs sm:text-sm font-mono font-bold backdrop-blur-md pointer-events-auto">
              {activeIndex + 1} / {images.length}
            </div>

            {/* Right Action Buttons */}
            <div className="flex items-center gap-2 pointer-events-auto">
              {/* Open Original / Download Button */}
              <a
                href={normalizeImageUrl(currentImage.image_path, 'large')}
                target="_blank"
                rel="noreferrer"
                download
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm transition-colors backdrop-blur-md"
                title="เปิดภาพขนาดเต็ม / ดาวน์โหลด"
              >
                <i className="fa-solid fa-arrow-up-right-from-square"></i>
              </a>

              {/* Close Button */}
              <button
                type="button"
                onClick={closeLightbox}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/10 hover:bg-rose-600 text-white flex items-center justify-center text-lg transition-colors backdrop-blur-md cursor-pointer"
                title="ปิด (Esc)"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>

          {/* Prev Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              changeSlide(-1);
            }}
            className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 w-11 h-11 md:w-14 md:h-14 rounded-full bg-black/50 hover:bg-orange-600 text-white flex items-center justify-center text-lg md:text-xl transition-all z-50 backdrop-blur-xs cursor-pointer border border-white/10"
            title="ภาพก่อนหน้า (ลูกศรซ้าย)"
          >
            <i className="fa-solid fa-chevron-left"></i>
          </button>

          {/* Main Image Container */}
          <div className="max-w-6xl max-h-[85vh] px-4 md:px-20 flex flex-col items-center justify-center relative">
            {/* Spinner while loading preview image */}
            {lightboxLoading && (
              <div className="absolute inset-0 flex items-center justify-center text-white/80">
                <i className="fa-solid fa-spinner fa-spin text-4xl text-orange-400"></i>
              </div>
            )}

            <img
              key={currentImage.id}
              src={normalizeImageUrl(currentImage.image_path, 'preview')}
              alt={currentImage.caption || albumTitle}
              decoding="async"
              onLoad={() => setLightboxLoading(false)}
              className={`max-h-[75vh] max-w-full object-contain rounded-xl shadow-2xl transition-all duration-300 ${
                lightboxLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
              }`}
            />

            {currentImage.caption && (
              <p className="text-white text-center mt-3 text-xs sm:text-sm font-medium bg-slate-900/80 px-5 py-2 rounded-full backdrop-blur-sm max-w-xl line-clamp-2">
                {currentImage.caption}
              </p>
            )}
          </div>

          {/* Next Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              changeSlide(1);
            }}
            className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 w-11 h-11 md:w-14 md:h-14 rounded-full bg-black/50 hover:bg-orange-600 text-white flex items-center justify-center text-lg md:text-xl transition-all z-50 backdrop-blur-xs cursor-pointer border border-white/10"
            title="ภาพถัดไป (ลูกศรขวา)"
          >
            <i className="fa-solid fa-chevron-right"></i>
          </button>
        </div>
      )}
    </>
  );
}
