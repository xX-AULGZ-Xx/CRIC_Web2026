'use client';

import React, { useState } from 'react';
import { Link2, Check } from 'lucide-react';

const FacebookIcon = () => (
  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const LineIcon = () => (
  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
    <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.035 9.608.391.084.922.258 1.057.592.121.303.079.778.039 1.085l-.171 1.027c-.053.303-.242 1.186 1.039.647 1.281-.54 6.911-4.069 9.428-6.967 1.739-1.907 2.573-3.843 2.573-5.992z" />
  </svg>
);

const XIcon = () => (
  <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export default function NewsShareButtons({ title }: { title?: string }) {
  const [copied, setCopied] = useState(false);

  const getShareUrl = () => {
    if (typeof window === 'undefined') return '';
    return window.location.href;
  };

  const handleFacebookShare = () => {
    const url = getShareUrl();
    if (!url) return;
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      '_blank',
      'width=600,height=400'
    );
  };

  const handleLineShare = () => {
    const url = getShareUrl();
    if (!url) return;
    window.open(
      `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`,
      '_blank',
      'width=600,height=400'
    );
  };

  const handleXShare = () => {
    const url = getShareUrl();
    if (!url) return;
    window.open(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(
        url
      )}&text=${encodeURIComponent(title || '')}`,
      '_blank',
      'width=600,height=400'
    );
  };

  const handleCopyLink = () => {
    const url = getShareUrl();
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-1.5 ml-auto">
      <span className="text-xs text-slate-400 font-medium mr-1 select-none">แชร์ข่าวนี้:</span>
      
      {/* Facebook */}
      <button
        type="button"
        onClick={handleFacebookShare}
        className="w-8 h-8 rounded-full bg-[#1877F2] text-white flex items-center justify-center hover:opacity-90 transition-opacity shadow-xs cursor-pointer"
        title="แชร์ไปยัง Facebook"
      >
        <FacebookIcon />
      </button>

      {/* LINE */}
      <button
        type="button"
        onClick={handleLineShare}
        className="w-8 h-8 rounded-full bg-[#06C755] text-white flex items-center justify-center hover:opacity-90 transition-opacity shadow-xs cursor-pointer"
        title="แชร์ไปยัง LINE"
      >
        <LineIcon />
      </button>

      {/* X / Twitter */}
      <button
        type="button"
        onClick={handleXShare}
        className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center hover:opacity-90 transition-opacity shadow-xs cursor-pointer"
        title="แชร์ไปยัง X"
      >
        <XIcon />
      </button>

      {/* Copy Link */}
      <button
        type="button"
        onClick={handleCopyLink}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-xs cursor-pointer ${
          copied
            ? 'bg-emerald-600 text-white'
            : 'bg-orange-600 text-white hover:bg-orange-700'
        }`}
        title={copied ? 'คัดลอกลิงก์เรียบร้อยแล้ว!' : 'คัดลอกลิงก์'}
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}
