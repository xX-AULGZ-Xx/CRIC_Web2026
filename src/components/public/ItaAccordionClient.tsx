'use client';

import React, { useState } from 'react';
import { normalizeImageUrl, normalizeLinkUrl, normalizeHtmlContent } from '@/lib/url-helper';
import {
  Calendar,
  ChevronDown,
  FileText,
  ExternalLink,
  Info,
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
      const clean = line.replace(/^[-•*]\s*/, '').trim();
      return `<div>${idx++}) ${clean}</div>`;
    })
    .join('');
}

export default function ItaAccordionClient({
  itaTree,
  availableYears,
  initialYear,
  coverBanners = {},
  siteName = 'วิทยาลัยการอาชีพเชียงราย',
}: ItaAccordionClientProps) {
  const [selectedYear, setSelectedYear] = useState<string>(initialYear);

  const activeCoverBanner =
    coverBanners[selectedYear] || coverBanners['default'] || '';

  const activeMainTopics = itaTree.filter(
    (main) => !selectedYear || main.year === selectedYear
  );

  return (
    <>
      <style jsx global>{`
        .custom-editor-content ol,
        .prose ol {
          list-style-type: decimal !important;
          padding-left: 1.5rem !important;
          margin-top: 0.5rem !important;
          margin-bottom: 0.5rem !important;
        }
        .custom-editor-content ul,
        .prose ul {
          list-style-type: disc !important;
          padding-left: 1.5rem !important;
          margin-top: 0.5rem !important;
          margin-bottom: 0.5rem !important;
        }
        .custom-editor-content li,
        .prose li {
          margin-bottom: 0.25rem !important;
          display: list-item !important;
        }
      `}</style>

      {/* Banner Section (Matching Legacy PHP ita.php) */}
      <section className="w-full relative overflow-hidden border-b border-slate-200/50 bg-slate-950 flex justify-center">
        {activeCoverBanner ? (
          <>
            {/* Blurred background */}
            <div
              className="absolute inset-0 bg-cover bg-center filter blur-2xl opacity-50 scale-110 pointer-events-none"
              style={{
                backgroundImage: `url('${normalizeImageUrl(activeCoverBanner)}')`,
              }}
            ></div>
            {/* Centered Banner Image */}
            <div className="relative z-10 w-full max-w-[1400px] mx-auto shadow-2xl flex justify-center">
              <img
                src={normalizeImageUrl(activeCoverBanner)}
                className="w-full h-auto object-contain block"
                alt="ITA Banner"
              />
            </div>
          </>
        ) : (
          /* Fallback banner style */
          <div className="bg-slate-900 py-20 text-white text-center w-full">
            <h2 className="text-4xl font-extrabold tracking-tight">
              การประเมินคุณธรรมและความโปร่งใส (ITA)
            </h2>
            <p className="text-sm text-white/80 font-medium mt-2">{siteName}</p>
          </div>
        )}
      </section>

      {/* Year Selector Section (Matching Legacy PHP ita.php) */}
      <section className="max-w-7xl mx-auto px-6 mt-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4 flex-1">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-600" />
                <span>ปีงบประมาณการประเมิน ITA</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                เลือกปีงบประมาณที่ต้องการตรวจสอบข้อมูลการเปิดเผยข้อมูลสาธารณะ
              </p>
            </div>
          </div>
          <div className="relative w-full sm:w-64">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-orange-500 rounded-2xl text-sm font-bold text-slate-800 outline-none transition appearance-none cursor-pointer pr-10"
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
      </section>

      {/* Content Section (Matching Legacy PHP ita.php) */}
      <section className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        {activeMainTopics.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 max-w-lg mx-auto">
            <Info className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <span className="font-medium text-slate-500 block">
              ยังไม่มีข้อมูลการประเมิน ITA ในระบบ
            </span>
          </div>
        ) : (
          activeMainTopics.map((main) => (
            <div key={main.id} className="space-y-8">
              {/* Main Topic Header */}
              <div className="text-center space-y-2">
                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {main.name || main.title}
                </h2>
                <div className="w-24 h-1 bg-orange-600 mx-auto rounded-full"></div>
              </div>

              {main.sub_topics.map((sub) => {
                const subTitle = sub.name || sub.title || '';
                return (
                  <div key={sub.id} className="space-y-6">
                    {/* Sub Topic Code & Title */}
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 flex flex-col sm:flex-row sm:items-center items-start gap-2.5 mt-8">
                      <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-xl text-xs sm:text-sm font-extrabold shrink-0 border border-orange-100">
                        ตัวชี้วัด {sub.code}
                      </span>
                      <span className="leading-snug">{subTitle}</span>
                    </h3>

                    {sub.tables.map((table) => (
                      <div
                        key={table.id}
                        className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm p-6 space-y-4"
                      >
                        <h4 className="font-bold text-slate-800 text-base leading-snug flex items-center gap-2">
                          <span className="w-2.5 h-2.5 bg-orange-600 rounded-full inline-block"></span>
                          <span>{table.title}</span>
                        </h4>

                        {/* Desktop Table View (hidden on mobile) */}
                        <div className="hidden md:block overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-slate-250 text-slate-500 text-xs font-bold uppercase bg-slate-50/50">
                                <th
                                  className="py-3 px-4 text-center"
                                  style={{ width: '8%' }}
                                >
                                  ข้อ
                                </th>
                                <th
                                  className="py-3 px-4"
                                  style={{ width: '20%' }}
                                >
                                  ข้อมูล
                                </th>
                                <th
                                  className="py-3 px-4"
                                  style={{ width: '52%' }}
                                >
                                  องค์ประกอบด้านข้อมูล
                                </th>
                                <th
                                  className="py-3 px-4 text-center"
                                  style={{ width: '20%' }}
                                >
                                  การเผยแพร่ข้อมูล
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                              {table.items.length === 0 ? (
                                <tr>
                                  <td
                                    colSpan={4}
                                    className="py-6 text-center text-slate-400 italic"
                                  >
                                    ไม่มีข้อมูลสำหรับตารางนี้
                                  </td>
                                </tr>
                              ) : (
                                table.items.map((item) => (
                                  <tr
                                    key={item.id}
                                    className="hover:bg-slate-50/30 transition"
                                  >
                                    <td className="py-4 px-4 text-center font-bold text-slate-900 align-top">
                                      {item.o_number}
                                    </td>
                                    <td className="py-4 px-4 font-bold text-slate-800 align-top">
                                      {item.title}
                                    </td>
                                    <td className="py-4 px-4 text-slate-600 leading-relaxed text-xs align-top">
                                      {item.description && (
                                        <div
                                          className="prose prose-sm max-w-none text-slate-700 font-semibold leading-relaxed custom-editor-content"
                                          dangerouslySetInnerHTML={{
                                            __html: formatElementDetail(
                                              item.description
                                            ),
                                          }}
                                        />
                                      )}
                                    </td>
                                    <td className="py-4 px-4 text-center space-y-2 align-top">
                                      {item.links && item.links.length > 0 ? (
                                        item.links.map((link) => {
                                          if (link.link_type === 'text') {
                                            return (
                                              <div
                                                key={link.id}
                                                className="text-left bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-1 w-full custom-editor-content"
                                              >
                                                {link.label && (
                                                  <span className="text-[10px] font-bold text-orange-700 block">
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
                                              className="inline-flex items-center justify-center gap-1.5 w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs shadow-sm transition cursor-pointer"
                                            >
                                              {isFile ? (
                                                <FileText className="w-3.5 h-3.5 shrink-0" />
                                              ) : (
                                                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                                              )}
                                              <span>{label}</span>
                                            </a>
                                          );
                                        })
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

                        {/* Mobile Card View (shown only on mobile) */}
                        <div className="space-y-4 md:hidden">
                          {table.items.length === 0 ? (
                            <div className="text-center py-6 text-slate-400 italic text-sm">
                              ไม่มีข้อมูลสำหรับตารางนี้
                            </div>
                          ) : (
                            table.items.map((item) => (
                              <div
                                key={item.id}
                                className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl space-y-3"
                              >
                                {/* Header: Code & Title */}
                                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                                  <span className="px-2.5 py-1 bg-orange-600 text-white text-xs font-extrabold rounded-lg shrink-0">
                                    {item.o_number}
                                  </span>
                                  <span className="text-sm font-bold text-slate-800 text-right flex-1 leading-snug">
                                    {item.title}
                                  </span>
                                </div>

                                {/* Details */}
                                {item.description && (
                                  <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                                      องค์ประกอบด้านข้อมูล:
                                    </span>
                                    <div
                                      className="text-xs text-slate-600 space-y-1.5 leading-relaxed pl-1 custom-editor-content"
                                      dangerouslySetInnerHTML={{
                                        __html: formatElementDetail(
                                          item.description
                                        ),
                                      }}
                                    />
                                  </div>
                                )}

                                {/* Action / Links */}
                                <div className="pt-1">
                                  {item.links && item.links.length > 0 ? (
                                    <div className="flex flex-col gap-2">
                                      {item.links.map((link) => {
                                        if (link.link_type === 'text') {
                                          return (
                                            <div
                                              key={link.id}
                                              className="text-left bg-white border border-slate-200/80 rounded-xl p-3 space-y-1 w-full custom-editor-content"
                                            >
                                              {link.label && (
                                                <span className="text-[10px] font-bold text-orange-700 block">
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
                                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-orange-300 text-slate-700 hover:text-orange-600 font-bold rounded-xl text-xs shadow-xs transition w-full"
                                          >
                                            {isFile ? (
                                              <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                                            ) : (
                                              <ExternalLink className="w-4 h-4 text-orange-500 shrink-0" />
                                            )}
                                            <span className="truncate">
                                              {label}
                                            </span>
                                          </a>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <div className="text-center py-2 text-slate-400 italic text-xs bg-slate-100/40 rounded-xl border border-slate-100">
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
                );
              })}
            </div>
          ))
        )}
      </section>
    </>
  );
}
