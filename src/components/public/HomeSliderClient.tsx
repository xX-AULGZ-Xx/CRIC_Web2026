'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import { normalizeImageUrl, normalizeLinkUrl, formatSlideImageUrl } from '@/lib/url-helper'

export interface SliderItem {
  id: number
  image_path: string
  title?: string | null
  subtitle?: string | null
  link?: string | null
  order_num?: number | null
  is_active?: boolean | null
  fit_width?: boolean | number | null
}

export function HomeSliderClient({
  sliders,
  siteName,
}: {
  sliders: SliderItem[];
  siteName?: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const nextSlide = useCallback(() => {
    if (!sliders || sliders.length <= 1) return
    setCurrentIndex((prev) => (prev + 1) % sliders.length)
  }, [sliders])

  const prevSlide = useCallback(() => {
    if (!sliders || sliders.length <= 1) return
    setCurrentIndex((prev) => (prev - 1 + sliders.length) % sliders.length)
  }, [sliders])

  useEffect(() => {
    if (!sliders || sliders.length <= 1) return
    const interval = setInterval(nextSlide, 6000)
    return () => clearInterval(interval)
  }, [sliders, nextSlide])

  if (!sliders || sliders.length === 0) return null

  return (
    <div className="w-full">
      {/* Mobile Slider (Dynamic height, zero crop) */}
      <section className="block md:hidden relative overflow-hidden bg-white">
        <div className="relative w-full aspect-[1640/720] bg-slate-100 overflow-hidden" id="slider-container-mobile">
          {sliders.map((slide, index) => {
            const slideUrl = formatSlideImageUrl(slide.image_path)
            const linkHref = slide.link ? normalizeLinkUrl(slide.link) : ''
            const isActive = index === currentIndex
            const isNear = Math.abs(index - currentIndex) <= 1 || (currentIndex === 0 && index === sliders.length - 1) || (currentIndex === sliders.length - 1 && index === 0)

            return (
              <div
                key={slide.id}
                className={`w-full h-full transition-opacity duration-500 ease-in-out slide-item-mobile ${
                  isActive
                    ? 'relative opacity-100 z-10'
                    : 'absolute inset-0 opacity-0 z-0 pointer-events-none'
                }`}
              >
                {isNear && (
                  <Image
                    src={slideUrl}
                    alt={slide.title || 'Banner Image'}
                    width={1640}
                    height={720}
                    priority={index === 0}
                    sizes="(max-width: 768px) 100vw, 800px"
                    className="w-full h-auto block"
                  />
                )}

                {/* Text Info Overlay content */}
                {(slide.title || slide.subtitle || linkHref) && (
                  <div className="absolute inset-0 flex items-end justify-start px-4 pb-10">
                    <div className="max-w-2xl space-y-2 text-white transform translate-y-4 transition duration-500">
                      {slide.title && (
                        <h2 className="text-xl font-extrabold tracking-tight leading-tight drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
                          {slide.title}
                        </h2>
                      )}
                      {slide.subtitle && (
                        <p className="text-xs text-slate-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-medium">
                          {slide.subtitle}
                        </p>
                      )}
                      {linkHref && linkHref !== '#' && (
                        <div className="pt-1">
                          <Link
                            href={linkHref}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-100 shadow-lg transition duration-150 text-xs"
                          >
                            <span>อ่านต่อข้อมูลกิจกรรม</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Slider Navigation arrows */}
        {sliders.length > 1 && (
          <>
            <button
              type="button"
              onClick={prevSlide}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md rounded-full flex items-center justify-center transition border border-white/15"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={nextSlide}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md rounded-full flex items-center justify-center transition border border-white/15"
              aria-label="Next slide"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </section>

      {/* Desktop Slider (Original layout, fixed 600px height with cover/fit_width options) */}
      <section className="hidden md:block relative h-[600px] overflow-hidden bg-slate-950">
        <div className="relative w-full h-full" id="slider-container-desktop">
          {sliders.map((slide, index) => {
            const isFitWidth = Boolean(slide.fit_width)
            const slideUrl = formatSlideImageUrl(slide.image_path)
            const linkHref = slide.link ? normalizeLinkUrl(slide.link) : ''
            const isActive = index === currentIndex
            const isNear = Math.abs(index - currentIndex) <= 1 || (currentIndex === 0 && index === sliders.length - 1) || (currentIndex === sliders.length - 1 && index === 0)

            return (
              <div
                key={slide.id}
                className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out slide-item-desktop ${
                  isActive
                    ? 'opacity-100 z-10'
                    : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                {isNear && (
                  isFitWidth ? (
                    <>
                      {/* Blurred Background Layer */}
                      <Image
                        src={slideUrl}
                        alt=""
                        fill
                        priority={index === 0}
                        sizes="100vw"
                        className="object-cover blur-2xl opacity-50 scale-105"
                      />
                      {/* Centered Main Image Layer (Fit H) */}
                      <Image
                        src={slideUrl}
                        alt={slide.title || 'Banner Image'}
                        fill
                        priority={index === 0}
                        sizes="100vw"
                        className="object-contain"
                      />
                    </>
                  ) : (
                    /* Full Cover Background */
                    <Image
                      src={slideUrl}
                      alt={slide.title || 'Banner Image'}
                      fill
                      priority={index === 0}
                      sizes="100vw"
                      className="object-cover"
                    />
                  )
                )}

                {/* Text Info Overlay content */}
                {(slide.title || slide.subtitle || linkHref) && (
                  <div className="absolute inset-0 flex items-end justify-start max-w-7xl mx-auto px-6 pb-28">
                    <div className="max-w-2xl space-y-4 text-white transform translate-y-4 transition duration-500">
                      {slide.title && (
                        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
                          {slide.title}
                        </h2>
                      )}
                      {slide.subtitle && (
                        <p className="text-sm md:text-lg text-slate-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-medium">
                          {slide.subtitle}
                        </p>
                      )}
                      {linkHref && linkHref !== '#' && (
                        <div className="pt-2">
                          <Link
                            href={linkHref}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-900 font-bold rounded-2xl hover:bg-slate-100 shadow-lg transition duration-150 text-sm"
                          >
                            <span>อ่านต่อข้อมูลกิจกรรม</span>
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Slider Navigation arrows */}
        {sliders.length > 1 && (
          <>
            <button
              type="button"
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md rounded-full flex items-center justify-center transition border border-white/15"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md rounded-full flex items-center justify-center transition border border-white/15"
              aria-label="Next slide"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </section>
    </div>
  )
}

export default HomeSliderClient
