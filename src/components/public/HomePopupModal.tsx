'use client';

import React, { useEffect, useState } from 'react';
import { normalizeImageUrl, normalizeLinkUrl } from '@/lib/url-helper';

interface HomePopupModalProps {
  popupImage: string;
  popupLink?: string;
  siteName?: string;
}

export default function HomePopupModal({
  popupImage,
  popupLink,
  siteName = 'Announcement',
}: HomePopupModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    try {
      if (!sessionStorage.getItem('popupShown')) {
        const t1 = setTimeout(() => {
          setIsOpen(true);
          const t2 = setTimeout(() => setVisible(true), 50);
          return () => clearTimeout(t2);
        }, 500);
        return () => clearTimeout(t1);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const closePopup = () => {
    try {
      if (dontShowAgain) {
        sessionStorage.setItem('popupShown', 'true');
      }
    } catch {
      // Ignore storage errors
    }
    setVisible(false);
    setTimeout(() => {
      setIsOpen(false);
    }, 300);
  };

  if (!isOpen || !popupImage) return null;

  const imgSrc = normalizeImageUrl(popupImage, 'preview');
  const linkHref = popupLink ? normalizeLinkUrl(popupLink) : '';
  const isExternal = linkHref.startsWith('http://') || linkHref.startsWith('https://');

  return (
    <div
      id="announcement-popup"
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) closePopup();
      }}
    >
      <div
        id="popup-content"
        className={`relative max-w-3xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl transform transition-transform duration-300 border border-white/20 ${
          visible ? 'scale-100' : 'scale-95'
        }`}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={closePopup}
          aria-label="ปิดหน้าต่างประกาศ"
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 hover:bg-black/80 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all hover:scale-110 shadow-lg"
        >
          <i className="fa-solid fa-xmark text-xl"></i>
        </button>

        {/* Image / Link */}
        {linkHref && linkHref !== '#' ? (
          <a
            href={linkHref}
            target={isExternal ? '_blank' : undefined}
            rel={isExternal ? 'noopener noreferrer' : undefined}
            className="block group relative overflow-hidden"
          >
            <img
              src={imgSrc}
              alt={siteName}
              className="w-full h-auto max-h-[80vh] object-contain mx-auto group-hover:scale-[1.02] transition-transform duration-500"
            />
            <div className="absolute bottom-4 right-4 bg-orange-600/90 text-white text-xs font-bold px-4 py-2 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 shadow-lg">
              คลิกเพื่อดูรายละเอียด <i className="fa-solid fa-arrow-up-right-from-square"></i>
            </div>
          </a>
        ) : (
          <img
            src={imgSrc}
            alt={siteName}
            className="w-full h-auto max-h-[80vh] object-contain mx-auto"
          />
        )}

        {/* Bottom Bar */}
        <div className="bg-slate-50 px-6 py-3 flex justify-between items-center border-t border-slate-100">
          <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer hover:text-slate-700">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="rounded text-orange-600 focus:ring-orange-500"
            />
            ไม่ต้องแสดงอีกในเซสชั่นนี้
          </label>
          <button
            type="button"
            onClick={closePopup}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
