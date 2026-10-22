'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react'

export interface GalleryPhoto {
  id: number
  image_path: string
}

export function GalleryViewer({ photos }: { photos: GalleryPhoto[] }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const formatImagePath = (path: string) => {
    if (path.startsWith('http://') || path.startsWith('https://')) return path
    return path.startsWith('/') ? path : `/${path}`
  }

  const prevImage = () => {
    if (selectedIndex === null) return
    setSelectedIndex((selectedIndex - 1 + photos.length) % photos.length)
  }

  const nextImage = () => {
    if (selectedIndex === null) return
    setSelectedIndex((selectedIndex + 1) % photos.length)
  }

  return (
    <>
      {/* Grid of Images */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
        {photos.map((item, idx) => (
          <div
            key={item.id}
            onClick={() => setSelectedIndex(idx)}
            className="aspect-square bg-slate-100 rounded-2xl overflow-hidden border border-slate-200/80 shadow-2xs hover:shadow-md transition relative group cursor-pointer"
          >
            <Image
              src={formatImagePath(item.image_path)}
              alt={`Photo ${idx + 1}`}
              fill
              className="object-cover group-hover:scale-105 transition duration-300"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
            <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
              <Maximize2 className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      {/* Fullscreen Lightbox Modal */}
      {selectedIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <button
            onClick={() => setSelectedIndex(null)}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition z-50"
            aria-label="Close Preview"
          >
            <X className="w-8 h-8" />
          </button>

          {/* Left Arrow */}
          <button
            onClick={prevImage}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition z-50"
            aria-label="Previous Image"
          >
            <ChevronLeft className="w-10 h-10" />
          </button>

          {/* Main Image */}
          <div className="relative max-w-5xl max-h-[85vh] w-full h-full flex items-center justify-center">
            <Image
              src={formatImagePath(photos[selectedIndex].image_path)}
              alt={`Photo ${selectedIndex + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>

          {/* Right Arrow */}
          <button
            onClick={nextImage}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition z-50"
            aria-label="Next Image"
          >
            <ChevronRight className="w-10 h-10" />
          </button>

          {/* Image Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-black/50 text-white text-xs font-bold rounded-full">
            {selectedIndex + 1} / {photos.length}
          </div>
        </div>
      )}
    </>
  )
}
