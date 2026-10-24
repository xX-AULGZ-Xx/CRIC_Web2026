'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { X } from 'lucide-react'
import { normalizeImageUrl } from '@/lib/url-helper'

declare global {
  interface Window {
    openGlobalClientLightbox?: (src: string) => void
    closeGlobalClientLightbox?: () => void
  }
}

export function GlobalLightbox() {
  const [src, setSrc] = useState<string | null>(null)

  const openLightbox = useCallback((rawSrc: string) => {
    if (!rawSrc) return
    const normalized = normalizeImageUrl(rawSrc, 'preview') || rawSrc
    setSrc(normalized)
  }, [])

  const closeLightbox = useCallback(() => {
    setSrc(null)
  }, [])

  useEffect(() => {
    window.openGlobalClientLightbox = openLightbox
    window.closeGlobalClientLightbox = closeLightbox

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return

      // Ignore clicks inside dedicated gallery/news lightboxes
      if (
        target.closest('#lightbox') ||
        target.closest('#admin-lightbox') ||
        target.closest('#global-client-lightbox')
      ) {
        return
      }

      // Check for data-lightbox-src attribute
      const triggerEl = target.closest('[data-lightbox-src]') as HTMLElement | null
      if (triggerEl) {
        const customSrc = triggerEl.getAttribute('data-lightbox-src')
        if (customSrc) {
          e.preventDefault()
          e.stopPropagation()
          openLightbox(customSrc)
          return
        }
      }

      // Check for prose img, figure img, zoomable-img
      const imgEl = target.closest(
        '.prose img, .prose-orange img, .prose-indigo img, figure img, .zoomable-img'
      ) as HTMLImageElement | null
      if (imgEl && imgEl.src) {
        e.preventDefault()
        e.stopPropagation()
        openLightbox(imgEl.src)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeLightbox()
      }
    }

    document.addEventListener('click', handleClick)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('click', handleClick)
      document.removeEventListener('keydown', handleKeyDown)
      delete window.openGlobalClientLightbox
      delete window.closeGlobalClientLightbox
    }
  }, [openLightbox, closeLightbox])

  if (!src) return null

  return (
    <div
      id="global-client-lightbox"
      className="fixed inset-0 bg-slate-950/90 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm cursor-zoom-out"
      onClick={closeLightbox}
    >
      <button
        type="button"
        onClick={closeLightbox}
        className="absolute top-4 right-4 text-white hover:text-slate-300 transition p-2"
        aria-label="Close lightbox"
      >
        <X className="w-8 h-8" />
      </button>
      <img
        id="global-client-lightbox-img"
        src={src}
        className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl cursor-default object-contain"
        alt="Lightbox View"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}

export default GlobalLightbox
