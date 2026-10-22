'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'

export interface SliderItem {
  id: number
  title: string | null
  subtitle: string | null
  image_path: string
  link: string | null
  fit_width: boolean | null
}

export function HomeSlider({ sliders }: { sliders: SliderItem[] }) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (sliders.length <= 1) return
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % sliders.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [sliders.length])

  if (!sliders.length) return null

  const prevSlide = () => {
    setCurrent((prev) => (prev - 1 + sliders.length) % sliders.length)
  }

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % sliders.length)
  }

  const formatImagePath = (path: string) => {
    if (path.startsWith('http://') || path.startsWith('https://')) return path
    return path.startsWith('/') ? path : `/${path}`
  }

  return (
    <section className="relative overflow-hidden bg-slate-950 w-full">
      {/* Desktop & Mobile Responsive Slider */}
      <div className="relative w-full h-[360px] sm:h-[480px] md:h-[600px]">
        {sliders.map((slide, idx) => {
          const isActive = idx === current
          const imgUrl = formatImagePath(slide.image_path)

          return (
            <div
              key={slide.id}
              className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              {/* Blurred background if fit_width */}
              {slide.fit_width && (
                <div
                  className="absolute inset-0 bg-cover bg-center blur-2xl opacity-40 scale-105"
                  style={{ backgroundImage: `url(${imgUrl})` }}
                />
              )}

              {/* Main Image */}
              <div className="relative w-full h-full">
                <Image
                  src={imgUrl}
                  alt={slide.title || 'Slide'}
                  fill
                  priority={idx === 0}
                  className={`object-center ${slide.fit_width ? 'object-contain' : 'object-cover'}`}
                  sizes="100vw"
                />
              </div>

              {/* Gradient Overlay & Text */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent flex items-end">
                <div className="max-w-7xl mx-auto px-6 pb-12 sm:pb-16 w-full">
                  <div className="max-w-2xl space-y-2.5 text-white">
                    <h2 className="text-xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight drop-shadow-md">
                      {slide.title}
                    </h2>
                    {slide.subtitle && (
                      <p className="text-xs sm:text-base text-slate-200 drop-shadow-sm font-medium line-clamp-2">
                        {slide.subtitle}
                      </p>
                    )}
                    {slide.link && (
                      <div className="pt-2">
                        <Link
                          href={slide.link}
                          className="inline-flex items-center gap-1.5 px-4 py-2 sm:px-5 sm:py-2.5 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-100 shadow-lg transition duration-150 text-xs sm:text-sm"
                        >
                          <span>อ่านต่อข้อมูลกิจกรรม</span>
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {/* Controls */}
        {sliders.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-black/30 hover:bg-black/50 text-white backdrop-blur-md rounded-full flex items-center justify-center transition border border-white/20"
              aria-label="Previous Slide"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-black/30 hover:bg-black/50 text-white backdrop-blur-md rounded-full flex items-center justify-center transition border border-white/20"
              aria-label="Next Slide"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            {/* Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
              {sliders.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === current ? 'w-8 bg-white' : 'w-2 bg-white/50 hover:bg-white/75'
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
