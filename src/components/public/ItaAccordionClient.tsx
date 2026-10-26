'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  normalizeImageUrl,
  normalizeLinkUrl,
  normalizeHtmlContent,
} from '@/lib/url-helper';
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  FileText,
  ExternalLink,
  Info,
  Search,
  X,
  ArrowUp,
  Award,
  Layers,
} from 'lucide-react';

export interface ItaLinkItem {
  id: number;
  label: string | null;
  url: string | null;
  link_type: 'url' | 'file' | 'text' | string | null;
}

export interface ItaRowItem {
  id: number;
  o_number: string | null;
  title: string;
  description: string | null;
  links: ItaLinkItem[];
}

export interface ItaTableItem {
  id: number;
  title: string;
  items: ItaRowItem[];
}

export interface ItaSubTopicItem {
  id: number;
  code: string;
  name: string;
  title?: string;
  tables: ItaTableItem[];
}

export interface ItaMainTopicItem {
  id: number;
  year: string;
  title: string;
  name?: string;
  description: string | null;
  sub_topics: ItaSubTopicItem[];
}

interface ItaAccordionClientProps {
  itaTree: ItaMainTopicItem[];
  availableYears: string[];
  initialYear: string;
  coverBanners?: Record<string, string>;
  coverBadges?: Record<string, string>;
  siteName?: string;
}

function formatElementDetail(raw: string | null | undefined): string {
  if (!raw) return '';
  if (/<[a-z][\s\S]*>/i.test(raw)) {
    return normalizeHtmlContent(raw);
  }
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let idx = 1;
  return lines
    .map((line) => {
      // Strip any existing prefixes (e.g. "1)", "1.", "(1)", "1.1)", "-", "•", "*")
      const clean = line.replace(/^(\(?\d+(\.\d+)*[\)\.]|[-•*])\s*/, '').trim();
      return `<div>${idx++}) ${clean}</div>`;
    })
    .join('');
}

export default function ItaAccordionClient({
  itaTree,
  availableYears,
  initialYear,
  coverBanners = {},
  coverBadges = {},
  siteName = 'วิทยาลัยการอาชีพเชียงราย',
}: ItaAccordionClientProps) {
  const [selectedYear, setSelectedYear] = useState<string>(initialYear);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSubCode, setActiveSubCode] = useState<string>('all');
  const [collapsedSubs, setCollapsedSubs] = useState<Record<number, boolean>>({});
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const activeCoverBanner =
    coverBanners[selectedYear] || coverBanners['default'] || '';
  const activeCoverBadge = coverBadges[selectedYear] || '';

  const activeMainTopics = useMemo(() => {
    return itaTree.filter((main) => !selectedYear || main.year === selectedYear);
  }, [itaTree, selectedYear]);

  // Extract all sub topic codes for filter chips
  const allSubTopics = useMemo(() => {
    const list: { id: number; code: string; name: string }[] = [];
    activeMainTopics.forEach((m) => {
      m.sub_topics.forEach((s) => {
        list.push({ id: s.id, code: s.code, name: s.name });
      });
    });
    return list;
  }, [activeMainTopics]);

  // Filtered tree based on search query and activeSubCode
  const filteredMainTopics = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return activeMainTopics
      .map((main) => {
        const matchingSubTopics = main.sub_topics
          .filter((sub) => {
            if (activeSubCode !== 'all' && sub.code !== activeSubCode) {
              return false;
            }
            return true;
          })
          .map((sub) => {
            if (!query) return sub;

            const matchingTables = sub.tables
              .map((table) => {
                const matchingItems = table.items.filter((item) => {
                  const oMatch = item.o_number?.toLowerCase().includes(query);
                  const titleMatch = item.title.toLowerCase().includes(query);
                  const descMatch = item.description?.toLowerCase().includes(query);
                  const linkMatch = item.links.some(
                    (l) =>
                      l.label?.toLowerCase().includes(query) ||
                      l.url?.toLowerCase().includes(query)
                  );
                  return oMatch || titleMatch || descMatch || linkMatch;
                });

                return {
                  ...table,
                  items: matchingItems,
                };
              })
              .filter((table) => table.items.length > 0);

            return {
              ...sub,
              tables: matchingTables,
            };
          })
          .filter((sub) => (query ? sub.tables.length > 0 : true));

        return {
          ...main,
          sub_topics: matchingSubTopics,
        };
      })
      .filter((main) => (query ? main.sub_topics.length > 0 : true));
  }, [activeMainTopics, searchQuery, activeSubCode]);

  const toggleSub = (subId: number) => {
    setCollapsedSubs((prev) => ({
      ...prev,
      [subId]: !prev[subId],
    }));
  };

  const expandAll = () => setCollapsedSubs({});
  const collapseAll = () => {
    const allIds: Record<number, boolean> = {};
    activeMainTopics.forEach((m) => {
      m.sub_topics.forEach((s) => {
        allIds[s.id] = true;
      });
    });
    setCollapsedSubs(allIds);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <style jsx global>{`
        .custom-editor-content ol,
        .prose ol {
          list-style-type: decimal !important;
          padding-left: 1.25rem !important;
          margin-top: 0.35rem !important;
          margin-bottom: 0.35rem !important;
        }
        .custom-editor-content ul,
        .prose ul {
          list-style-type: disc !important;
          padding-left: 1.25rem !important;
          margin-top: 0.35rem !important;
          margin-bottom: 0.35rem !important;
        }
        .custom-editor-content li,
        .prose li {
          margin-bottom: 0.2rem !important;
          display: list-item !important;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Banner Section */}
      <section className="w-full relative overflow-hidden border-b border-slate-200/50 bg-slate-950 flex justify-center">
        {activeCoverBanner ? (
          <>
            {/* Blurred background */}
            <div
              className="absolute inset-0 bg-cover bg-center filter blur-2xl opacity-40 scale-110 pointer-events-none"
              style={{
                backgroundImage: `url('${normalizeImageUrl(activeCoverBanner)}')`,
              }}
            />
            {/* Centered Banner Image */}
            <div className="relative z-10 w-full max-w-7xl mx-auto shadow-2xl flex justify-center">
              <img
                src={normalizeImageUrl(activeCoverBanner)}
                className="w-full h-auto object-contain block max-h-[220px] sm:max-h-[360px] md:max-h-[440px]"
                alt="ITA Banner"
              />
            </div>
          </>
        ) : (
          /* Fallback banner style */
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 py-12 sm:py-20 text-white text-center w-full px-4">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              การประเมินคุณธรรมและความโปร่งใส (ITA)
            </h2>
            <p className="text-xs sm:text-sm text-white/80 font-medium mt-2">{siteName}</p>
          </div>
        )}
      </section>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6">
        {/* Year Selector & Badges Section */}
        <section className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-7 shadow-xs">
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shrink-0 shadow-xs">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                  ปีงบประมาณการประเมิน ITA
                </h2>
                <p className="text-xs text-slate-500 truncate">
                  ตรวจสอบการเปิดเผยข้อมูลสาธารณะ (OIT) ประจำปี
                </p>
              </div>
            </div>

            <div className="relative w-full md:w-64 shrink-0">
              <select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  setActiveSubCode('all');
                }}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-orange-500 focus:bg-white rounded-xl text-sm font-bold text-slate-800 outline-none transition appearance-none cursor-pointer pr-10 shadow-xs"
              >
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    ปีงบประมาณ พ.ศ. {y}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Search Box & Quick Controls */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาข้อ เช่น O1, โครงสร้าง, งบประมาณ..."
                className="w-full pl-9 pr-9 py-2 sm:py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-500 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 justify-end text-xs shrink-0">
              <button
                type="button"
                onClick={expandAll}
                className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition text-xs cursor-pointer"
              >
                ขยายทั้งหมด
              </button>
              <button
                type="button"
                onClick={collapseAll}
                className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition text-xs cursor-pointer"
              >
                ยุบทั้งหมด
              </button>
            </div>
          </div>

          {/* Quick Sub-Topic Chips (Horizontal Scroll on Mobile/Desktop) */}
          {allSubTopics.length > 0 && (
            <div className="mt-3.5 pt-3.5 border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              <button
                type="button"
                onClick={() => setActiveSubCode('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 whitespace-nowrap transition cursor-pointer ${
                  activeSubCode === 'all'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                ทั้งหมด
              </button>
              {allSubTopics.map((sub) => {
                const shortName = sub.name.split('(')[0].trim();
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setActiveSubCode(sub.code)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
                      activeSubCode === sub.code
                        ? 'bg-orange-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    <span>ตัวชี้วัด {sub.code}</span>
                    <span className="hidden md:inline font-normal text-[11px] opacity-85 max-w-[200px] truncate">
                      {shortName}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Content Section */}
        <section className="space-y-6 sm:space-y-8">
          {filteredMainTopics.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center text-slate-400 max-w-lg mx-auto">
              <Info className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-slate-300 mb-3" />
              <span className="font-bold text-slate-700 block text-sm sm:text-base">
                {searchQuery
                  ? `ไม่พบข้อมูลที่ตรงกับ "${searchQuery}"`
                  : 'ยังไม่มีข้อมูลการประเมิน ITA ในระบบ'}
              </span>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="mt-3 px-4 py-1.5 bg-orange-50 text-orange-600 font-bold text-xs rounded-xl hover:bg-orange-100 transition"
                >
                  ล้างคำค้นหา
                </button>
              )}
            </div>
          ) : (
            filteredMainTopics.map((main) => (
              <div key={main.id} className="space-y-6 sm:space-y-8">
                {/* Main Topic Header */}
                <div className="text-center space-y-2 pt-2 px-2">
                  <h2 className="text-lg sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug break-words">
                    {main.name || main.title}
                  </h2>
                  <div className="w-16 sm:w-24 h-1 bg-gradient-to-r from-orange-500 to-amber-500 mx-auto rounded-full"></div>
                </div>

                {main.sub_topics.map((sub) => {
                  const subTitle = sub.name || sub.title || '';
                  const isCollapsed = Boolean(collapsedSubs[sub.id]);
                  const totalItems = sub.tables.reduce((acc, t) => acc + t.items.length, 0);

                  return (
                    <div
                      key={sub.id}
                      className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-xs overflow-hidden transition-all w-full max-w-full"
                    >
                      {/* Sub Topic Header (Click to collapse/expand) */}
                      <button
                        type="button"
                        onClick={() => toggleSub(sub.id)}
                        className="w-full px-3 sm:px-6 py-3.5 sm:py-4 bg-slate-50/70 hover:bg-slate-100/70 border-b border-slate-200/80 flex items-center justify-between gap-2.5 sm:gap-3 text-left transition cursor-pointer overflow-hidden"
                      >
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                          <span className="px-2.5 py-1 bg-orange-600 text-white rounded-xl text-xs sm:text-sm font-extrabold shrink-0 shadow-xs whitespace-nowrap">
                            ตัวชี้วัด {sub.code}
                          </span>
                          <h3 className="font-bold text-slate-800 text-xs sm:text-base leading-snug break-words flex-1">
                            {subTitle}
                          </h3>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] font-bold text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                            {totalItems} ข้อ
                          </span>
                          <div className="w-7 h-7 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500">
                            {isCollapsed ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronUp className="w-4 h-4" />
                            )}
                          </div>
                        </div>
                      </button>

                      {/* Sub Topic Content */}
                      {!isCollapsed && (
                        <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
                          {sub.tables.map((table) => (
                            <div key={table.id} className="space-y-3">
                              {table.title && (
                                <h4 className="font-bold text-slate-800 text-sm sm:text-base leading-snug flex items-center gap-2 px-1">
                                  <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-orange-600 rounded-full inline-block"></span>
                                  <span>{table.title}</span>
                                </h4>
                              )}

                              {/* Desktop Table View (Tablet & PC) */}
                              <div className="hidden lg:block overflow-x-auto border border-slate-200 rounded-2xl">
                                <table className="w-full text-left border-collapse">
                                  <thead>
                                    <tr className="border-b border-slate-200 text-slate-600 text-xs font-bold uppercase bg-slate-50">
                                      <th className="py-3 px-4 text-center" style={{ width: '8%' }}>
                                        ข้อ
                                      </th>
                                      <th className="py-3 px-4" style={{ width: '22%' }}>
                                        ข้อมูล
                                      </th>
                                      <th className="py-3 px-4" style={{ width: '48%' }}>
                                        องค์ประกอบด้านข้อมูล
                                      </th>
                                      <th className="py-3 px-4 text-center" style={{ width: '22%' }}>
                                        การเผยแพร่ข้อมูล
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 text-sm">
                                    {table.items.length === 0 ? (
                                      <tr>
                                        <td
                                          colSpan={4}
                                          className="py-6 text-center text-slate-400 italic text-xs"
                                        >
                                          ไม่มีข้อมูลสำหรับตารางนี้
                                        </td>
                                      </tr>
                                    ) : (
                                      table.items.map((item) => (
                                        <tr
                                          key={item.id}
                                          className="hover:bg-slate-50/50 transition"
                                        >
                                          <td className="py-4 px-4 text-center font-black text-slate-900 align-top">
                                            <span className="px-2.5 py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg text-xs font-black inline-block">
                                              {item.o_number}
                                            </span>
                                          </td>
                                          <td className="py-4 px-4 font-bold text-slate-800 align-top text-xs sm:text-sm">
                                            {item.title}
                                          </td>
                                          <td className="py-4 px-4 text-slate-600 leading-relaxed text-xs align-top">
                                            {item.description && (
                                              <div
                                                className="prose prose-sm max-w-none text-slate-700 leading-relaxed custom-editor-content font-medium"
                                                dangerouslySetInnerHTML={{
                                                  __html: formatElementDetail(
                                                    item.description
                                                  ),
                                                }}
                                              />
                                            )}
                                          </td>
                                          <td className="py-4 px-4 text-center align-top">
                                            {item.links && item.links.length > 0 ? (
                                              <div className="flex flex-col gap-2 max-w-[240px] mx-auto">
                                                {item.links.map((link) => {
                                                  if (link.link_type === 'text') {
                                                    return (
                                                      <div
                                                        key={link.id}
                                                        className="text-left bg-amber-50/50 border border-amber-200/80 rounded-xl p-3 space-y-1 w-full"
                                                      >
                                                        {link.label && (
                                                          <span className="text-[11px] font-bold text-amber-900 block">
                                                            {link.label}
                                                          </span>
                                                        )}
                                                        <div
                                                          className="text-xs text-slate-700 leading-relaxed font-medium prose prose-sm max-w-none"
                                                          dangerouslySetInnerHTML={{
                                                            __html: normalizeHtmlContent(
                                                              link.url || ''
                                                            ),
                                                          }}
                                                        />
                                                      </div>
                                                    );
                                                  }

                                                  const rawUrl = link.url || '';
                                                  const cleanUrl =
                                                    link.link_type === 'file'
                                                      ? normalizeImageUrl(rawUrl)
                                                      : normalizeLinkUrl(rawUrl);
                                                  const label =
                                                    link.label ||
                                                    (link.link_type === 'file'
                                                      ? 'ดาวน์โหลดเอกสาร'
                                                      : 'ลิงก์ข้อมูล');
                                                  const isFile =
                                                    link.link_type === 'file';

                                                  return (
                                                    <a
                                                      key={link.id}
                                                      href={cleanUrl}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className={`inline-flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-xl text-xs font-bold shadow-xs transition cursor-pointer ${
                                                        isFile
                                                          ? 'bg-rose-600 hover:bg-rose-700 text-white'
                                                          : 'bg-orange-600 hover:bg-orange-700 text-white'
                                                      }`}
                                                    >
                                                      {isFile ? (
                                                        <FileText className="w-3.5 h-3.5 shrink-0" />
                                                      ) : (
                                                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                                                      )}
                                                      <span className="truncate">{label}</span>
                                                    </a>
                                                  );
                                                })}
                                              </div>
                                            ) : (
                                              <span className="text-slate-400 italic text-xs">
                                                -
                                              </span>
                                            )}
                                          </td>
                                        </tr>
                                      ))
                                    )}
                                  </tbody>
                                </table>
                              </div>

                              {/* Mobile Card View (optimized for Mobile & Tablets under lg) */}
                              <div className="space-y-3 lg:hidden">
                                {table.items.length === 0 ? (
                                  <div className="text-center py-6 text-slate-400 italic text-xs bg-slate-50 rounded-2xl border border-slate-100">
                                    ไม่มีข้อมูลสำหรับตารางนี้
                                  </div>
                                ) : (
                                  table.items.map((item) => (
                                    <div
                                      key={item.id}
                                      className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-3 shadow-xs hover:border-orange-300 transition"
                                    >
                                      {/* Header: Code Badge + Title */}
                                      <div className="flex items-start gap-2.5 pb-2.5 border-b border-slate-200/70">
                                        <span className="px-2.5 py-1 bg-gradient-to-r from-orange-600 to-amber-600 text-white text-xs font-black rounded-lg shrink-0 shadow-xs">
                                          {item.o_number}
                                        </span>
                                        <h5 className="text-xs sm:text-sm font-bold text-slate-800 leading-snug flex-1 text-left">
                                          {item.title}
                                        </h5>
                                      </div>

                                      {/* Details (องค์ประกอบด้านข้อมูล) */}
                                      {item.description && (
                                        <div className="bg-white p-3 rounded-xl border border-slate-200/60 space-y-1.5 shadow-2xs">
                                          <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wide flex items-center gap-1">
                                            <Layers className="w-3 h-3" />
                                            <span>องค์ประกอบด้านข้อมูล:</span>
                                          </span>
                                          <div
                                            className="text-xs text-slate-700 space-y-1.5 leading-relaxed custom-editor-content font-medium"
                                            dangerouslySetInnerHTML={{
                                              __html: formatElementDetail(
                                                item.description
                                              ),
                                            }}
                                          />
                                        </div>
                                      )}

                                      {/* Action / Links Buttons */}
                                      <div className="pt-0.5 space-y-2">
                                        {item.links && item.links.length > 0 ? (
                                          <div className="flex flex-col gap-2">
                                            {item.links.map((link) => {
                                              if (link.link_type === 'text') {
                                                return (
                                                  <div
                                                    key={link.id}
                                                    className="text-left bg-amber-50/50 border border-amber-200/80 rounded-xl p-3 space-y-1 w-full"
                                                  >
                                                    {link.label && (
                                                      <span className="text-[10px] font-bold text-amber-900 block">
                                                        {link.label}
                                                      </span>
                                                    )}
                                                    <div
                                                      className="text-xs text-slate-700 leading-relaxed font-medium prose prose-sm max-w-none"
                                                      dangerouslySetInnerHTML={{
                                                        __html: normalizeHtmlContent(
                                                          link.url || ''
                                                        ),
                                                      }}
                                                    />
                                                  </div>
                                                );
                                              }

                                              const rawUrl = link.url || '';
                                              const cleanUrl =
                                                link.link_type === 'file'
                                                  ? normalizeImageUrl(rawUrl)
                                                  : normalizeLinkUrl(rawUrl);
                                              const label =
                                                link.label ||
                                                (link.link_type === 'file'
                                                  ? 'ดาวน์โหลดเอกสาร'
                                                  : 'ลิงก์ข้อมูล');
                                              const isFile =
                                                link.link_type === 'file';

                                              return (
                                                <a
                                                  key={link.id}
                                                  href={cleanUrl}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className={`inline-flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition shadow-xs w-full min-h-[42px] active:scale-[0.99] cursor-pointer ${
                                                    isFile
                                                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200'
                                                      : 'bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-200'
                                                  }`}
                                                >
                                                  <div className="flex items-center gap-2 min-w-0">
                                                    {isFile ? (
                                                      <FileText className="w-4 h-4 text-rose-600 shrink-0" />
                                                    ) : (
                                                      <ExternalLink className="w-4 h-4 text-orange-600 shrink-0" />
                                                    )}
                                                    <span className="truncate text-left">
                                                      {label}
                                                    </span>
                                                  </div>
                                                  <span className="text-[10px] uppercase font-bold opacity-80 shrink-0 bg-white border border-slate-200 px-2 py-0.5 rounded-md shadow-2xs">
                                                    {isFile ? 'PDF/FILE' : 'เปิดดู'}
                                                  </span>
                                                </a>
                                              );
                                            })}
                                          </div>
                                        ) : (
                                          <div className="text-center py-2 text-slate-400 italic text-xs bg-slate-100/50 rounded-xl border border-dashed border-slate-200">
                                            ยังไม่มีการเผยแพร่ข้อมูล
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </section>
      </div>

      {/* Floating Back to Top Button on Mobile */}
      {showBackToTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 w-11 h-11 bg-orange-600 hover:bg-orange-700 text-white rounded-full shadow-lg flex items-center justify-center transition active:scale-95 cursor-pointer"
          aria-label="เลื่อนขึ้นบนสุด"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </>
  );
}
