'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { normalizeImageUrl, normalizeLinkUrl } from '@/lib/url-helper';

export interface CurriculumItem {
  id: number;
  name: string;
  level: string | null;
  code: string | null;
  description: string | null;
  qualification: string | null;
  duration: string | null;
  image_path: string | null;
  file_path: string | null;
  website_url: string | null;
  gallery_images: string | null;
  career_guidelines: string | null;
}

interface CurriculumListClientProps {
  curriculums: CurriculumItem[];
  settings: Record<string, string>;
  initialLevel?: string;
  initialSearch?: string;
}

export default function CurriculumListClient({
  curriculums,
  settings,
  initialLevel = '',
  initialSearch = '',
}: CurriculumListClientProps) {
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [activeFilter, setActiveFilter] = useState<string>(() => {
    if (initialLevel.includes('ปวช')) return 'pvc';
    if (initialLevel.includes('ปวส')) return 'pvs';
    if (initialLevel.includes('ปริญญาตรี')) return 'bachelor';
    if (initialLevel.includes('ระยะสั้น')) return 'short';
    return 'all';
  });

  const academicYear = settings.ita_year || '2567';
  const siteName = settings.site_name || 'วิทยาลัยการอาชีพเชียงราย';
  const pageTitle =
    settings.curriculum_page_title ||
    `สาขาวิชาที่เปิดสอนในหลักสูตร ${academicYear}`;
  const introText = settings.curriculum_intro_text || '';

  // Stats calculation
  const { countPvc, countPvs, totalCourses } = useMemo(() => {
    let pvc = 0;
    let pvs = 0;
    for (const c of curriculums) {
      const lvl = c.level || '';
      if (lvl.includes('ปวช')) pvc++;
      if (lvl.includes('ปวส')) pvs++;
    }
    return {
      countPvc: pvc,
      countPvs: pvs,
      totalCourses: curriculums.length,
    };
  }, [curriculums]);

  // Filtered curriculums
  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return curriculums.filter((c) => {
      const lvl = c.level || '';
      let matchLevel = true;
      if (activeFilter === 'pvc') {
        matchLevel = lvl.includes('ปวช');
      } else if (activeFilter === 'pvs') {
        matchLevel = lvl.includes('ปวส');
      } else if (activeFilter === 'bachelor') {
        matchLevel = lvl.includes('ปริญญาตรี') || lvl.includes('ป.ตรี');
      } else if (activeFilter === 'short') {
        matchLevel = lvl.includes('ระยะสั้น');
      }

      if (!matchLevel) return false;

      if (q) {
        const name = (c.name || '').toLowerCase();
        const code = (c.code || '').toLowerCase();
        const desc = (c.description || '').toLowerCase();
        const qual = (c.qualification || '').toLowerCase();
        const career = (c.career_guidelines || '').toLowerCase();
        const matchSearch =
          name.includes(q) ||
          code.includes(q) ||
          desc.includes(q) ||
          qual.includes(q) ||
          career.includes(q) ||
          lvl.toLowerCase().includes(q);
        if (!matchSearch) return false;
      }

      return true;
    });
  }, [curriculums, activeFilter, searchQuery]);

  return (
    <>
      {/* Detail/List Banner Hero (Matching legacy PHP curriculum.php line 349) */}
      <section className="relative bg-slate-900 py-16 text-white text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-950 via-slate-900 to-amber-950 z-0"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 z-0"></div>

        <div className="max-w-4xl mx-auto px-6 space-y-4 relative z-10">
          {/* Vocational Logo placeholder / school icon */}
          <div className="w-16 h-16 bg-amber-500 text-white rounded-3xl mx-auto flex items-center justify-center shadow-lg transform rotate-3">
            <i className="fa-solid fa-graduation-cap text-3xl transform -rotate-3 text-white"></i>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight drop-shadow-sm">
            {pageTitle}
          </h1>
          <p className="text-sm md:text-base text-white/90 font-medium">
            {siteName}
          </p>
        </div>
      </section>

      {/* Stats Grid (-mt-10) (Matching legacy PHP curriculum.php lines 366-407) */}
      <section className="max-w-7xl mx-auto px-6 -mt-10 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Box 1: ปวช. */}
          <div
            onClick={() =>
              setActiveFilter((prev) => (prev === 'pvc' ? 'all' : 'pvc'))
            }
            className={`bg-gradient-to-br from-cyan-400 to-blue-500 text-white rounded-3xl p-5 shadow-lg flex flex-col justify-between min-h-[140px] border border-cyan-300/20 relative overflow-hidden group hover:scale-[1.02] cursor-pointer transition-all duration-300 ${
              activeFilter === 'pvc'
                ? 'ring-4 ring-cyan-300 ring-offset-2 scale-[1.03] shadow-cyan-500/30'
                : ''
            }`}
          >
            <div className="absolute -right-6 -bottom-6 text-white/10 group-hover:scale-110 transition duration-300 pointer-events-none">
              <i className="fa-solid fa-graduation-cap text-9xl"></i>
            </div>
            <span className="text-xs font-semibold text-white/95 relative z-10">
              จำนวนสาขาที่เปิดสอนระดับ ปวช.
            </span>
            <div className="my-2 relative z-10">
              <span className="text-3xl font-black">{countPvc}</span>
              <span className="text-sm font-bold ml-1.5">สาขา</span>
            </div>
            <span className="text-[10px] bg-white/10 px-2.5 py-1 rounded-lg w-max relative z-10 font-medium backdrop-blur-xs">
              ระยะเวลาการศึกษา : 3 ปีการศึกษา
            </span>
          </div>

          {/* Box 2: ปวส. */}
          <div
            onClick={() =>
              setActiveFilter((prev) => (prev === 'pvs' ? 'all' : 'pvs'))
            }
            className={`bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-3xl p-5 shadow-lg flex flex-col justify-between min-h-[140px] border border-amber-300/20 relative overflow-hidden group hover:scale-[1.02] cursor-pointer transition-all duration-300 ${
              activeFilter === 'pvs'
                ? 'ring-4 ring-orange-400 ring-offset-2 scale-[1.03] shadow-orange-500/30'
                : ''
            }`}
          >
            <div className="absolute -right-6 -bottom-6 text-white/10 group-hover:scale-110 transition duration-300 pointer-events-none">
              <i className="fa-solid fa-award text-9xl"></i>
            </div>
            <span className="text-xs font-semibold text-white/95 relative z-10">
              จำนวนสาขาที่เปิดสอนระดับ ปวส.
            </span>
            <div className="my-2 relative z-10">
              <span className="text-3xl font-black">{countPvs}</span>
              <span className="text-sm font-bold ml-1.5">สาขา</span>
            </div>
            <span className="text-[10px] bg-white/10 px-2.5 py-1 rounded-lg w-max relative z-10 font-medium backdrop-blur-xs">
              ระยะเวลาการศึกษา : 2 ปีการศึกษา
            </span>
          </div>

          {/* Box 3: All */}
          <div
            onClick={() => setActiveFilter('all')}
            className={`bg-gradient-to-br from-[#063970] to-[#04284d] text-white rounded-3xl p-5 shadow-lg flex flex-col justify-between min-h-[140px] border border-blue-900/20 relative overflow-hidden group hover:scale-[1.02] cursor-pointer transition-all duration-300 ${
              activeFilter === 'all'
                ? 'ring-4 ring-blue-400 ring-offset-2 scale-[1.03] shadow-blue-900/30'
                : ''
            }`}
          >
            <div className="absolute -right-6 -bottom-6 text-white/10 group-hover:scale-110 transition duration-300 pointer-events-none">
              <i className="fa-solid fa-school text-9xl"></i>
            </div>
            <span className="text-xs font-semibold text-white/95 relative z-10">
              รวมสาขาที่เปิดสอนทั้งหมด
            </span>
            <div className="my-2 relative z-10">
              <span className="text-3xl font-black">{totalCourses}</span>
              <span className="text-sm font-bold ml-1.5">สาขา</span>
            </div>
            <span className="text-[10px] bg-white/10 px-2.5 py-1 rounded-lg w-max relative z-10 font-medium backdrop-blur-xs">
              ใน{siteName}
            </span>
          </div>
        </div>
      </section>

      {/* Intro Text Section (Matching legacy PHP curriculum.php lines 410-419) */}
      {introText && (
        <section className="max-w-4xl mx-auto px-6 mt-12">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-sm text-center">
            <p className="text-slate-600 text-sm md:text-base leading-relaxed whitespace-pre-line font-medium">
              {introText}
            </p>
          </div>
        </section>
      )}

      {/* Search Bar & Quick Filters Section (Matching legacy PHP lines 421-431) */}
      <section className="max-w-4xl mx-auto px-6 mt-10 mb-8 space-y-4">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="พิมพ์ชื่อสาขาวิชา หรือ ระดับชั้น ปวช., ปวส. เพื่อค้นหา..."
            className="w-full px-6 py-4 bg-white border-2 border-slate-200 focus:border-orange-500 rounded-2xl text-slate-800 placeholder-slate-400 outline-none transition shadow-sm text-sm pr-12"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                title="ล้างการค้นหา"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            )}
            <i className="fa-solid fa-magnifying-glass text-slate-400"></i>
          </div>
        </div>

        {/* Quick Level Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            ทุกระดับชั้น ({totalCourses})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('pvc')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'pvc'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            ระดับ ปวช. ({countPvc})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('pvs')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'pvs'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            ระดับ ปวส. ({countPvs})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('bachelor')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'bachelor'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            ระดับ ปริญญาตรี
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('short')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'short'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            หลักสูตรระยะสั้น
          </button>
        </div>
      </section>

      {/* Curriculum Directory Grid (Matching legacy PHP lines 434-531) */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        {filtered.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 max-w-lg mx-auto shadow-sm">
            <i className="fa-solid fa-book-open text-5xl mx-auto text-slate-300 mb-3"></i>
            <h3 className="font-bold text-slate-700 text-lg mb-1">
              ไม่พบข้อมูลหลักสูตรที่ค้นหา
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              ไม่มีหลักสูตรที่ตรงกับเงื่อนไขการค้นหาในขณะนี้
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveFilter('all');
              }}
              className="px-4 py-2 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-xl text-xs font-bold transition-colors"
            >
              แสดงหลักสูตรทั้งหมด
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((course) => {
              const name = course.name;
              const desc = course.description || '';
              const image = course.image_path
                ? normalizeImageUrl(course.image_path, 'preview')
                : '/placeholder-curriculum.jpg';

              // Determine level label from database
              const level = course.level || 'ปวช.-ปวส.';
              const levelLabel = `เปิดสอนในระดับ : ${level}`;

              // Level badge color
              let levelBadgeBg = 'bg-orange-600/90';
              if (level.includes('ป.ตรี') || level.includes('ปริญญาตรี')) {
                levelBadgeBg = 'bg-emerald-600/90';
              } else if (level.includes('ปวส.')) {
                levelBadgeBg = 'bg-amber-600/90';
              }

              // Use website_url if set, otherwise extract any external web link from description
              let webLink = course.website_url ? normalizeLinkUrl(course.website_url) : '';
              if (!webLink && desc) {
                const match = desc.match(/https?:\/\/[^\s\r\n]+/);
                if (match) {
                  webLink = normalizeLinkUrl(match[0]);
                }
              }

              // Subtitle helper - extract category like 'ประเภทวิชา...' or default
              let subtitle = 'สาขาวิชาชีพและเทคนิค';
              if (desc) {
                const catMatch = desc.match(/ประเภทวิชา[^\s\r\n,。.]+/);
                if (catMatch) {
                  subtitle = catMatch[0];
                } else if (course.code) {
                  subtitle = `รหัสหลักสูตร : ${course.code}`;
                }
              } else if (course.code) {
                subtitle = `รหัสหลักสูตร : ${course.code}`;
              }

              return (
                <div
                  key={course.id}
                  className="bg-white border border-slate-200/85 rounded-[32px] overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-xl hover:border-orange-300 transition-all duration-300 group"
                >
                  {/* Image Area (4:3 aspect ratio) */}
                  <Link
                    href={`/curriculum/${course.id}`}
                    className="aspect-[4/3] bg-slate-100 relative overflow-hidden block"
                  >
                    {course.image_path ? (
                      <img
                        src={image}
                        alt={name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50 p-6 text-center">
                        <i className="fa-solid fa-graduation-cap text-5xl mb-2 opacity-40"></i>
                        <span className="text-xs font-medium text-slate-400">
                          {siteName}
                        </span>
                      </div>
                    )}

                    {/* Dark Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent"></div>

                    {/* Top Level Badge */}
                    <span
                      className={`absolute top-4 left-4 px-3.5 py-1.5 ${levelBadgeBg} text-white rounded-full text-[11px] font-bold tracking-wide flex items-center gap-1.5 backdrop-blur-sm shadow-md`}
                    >
                      <i className="fa-solid fa-graduation-cap text-xs"></i>
                      <span>{levelLabel}</span>
                    </span>

                    {/* Code badge if present */}
                    {course.code && (
                      <span className="absolute top-4 right-4 px-2.5 py-1 bg-slate-900/80 text-white rounded-full text-[10px] font-mono font-bold backdrop-blur-sm shadow-md">
                        {course.code}
                      </span>
                    )}

                    {/* Centered bold Text on Image */}
                    <div className="absolute bottom-4 left-4 right-4 text-center">
                      <h3 className="font-extrabold text-white text-xl md:text-2xl tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                        {name}
                      </h3>
                    </div>
                  </Link>

                  {/* Details Area */}
                  <div className="p-6 flex-1 flex flex-col justify-between items-center text-center space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-1.5 text-xs text-orange-600 font-bold uppercase tracking-wider">
                        <i className="fa-solid fa-users text-xs"></i>
                        <span>{name}</span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-[260px] mx-auto line-clamp-2">
                        {subtitle}
                      </p>
                    </div>

                    {/* Buttons Row */}
                    <div className="flex flex-wrap justify-center gap-2 pt-2 w-full">
                      <Link
                        href={`/curriculum/${course.id}`}
                        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-full text-xs transition flex items-center gap-1.5 shadow-sm shadow-orange-600/20"
                      >
                        <i className="fa-solid fa-book-open text-xs"></i>
                        <span>ดูรายละเอียดสาขา</span>
                      </Link>
                      {webLink && (
                        <a
                          href={webLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-full text-xs transition flex items-center gap-1.5 shadow-sm shadow-amber-500/20"
                        >
                          <i className="fa-solid fa-paper-plane text-xs"></i>
                          <span>เว็บหลักของสาขา</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
