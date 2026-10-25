'use client';

import React, { useState, useMemo } from 'react';
import {
  FileText,
  FileSpreadsheet,
  FileArchive,
  FileImage,
  FileCode,
  File as FileIcon,
  Presentation,
  FolderOpen,
  Folder,
  Search,
  X,
  Calendar,
  Download,
  RotateCcw,
} from 'lucide-react';
import { normalizeImageUrl, normalizeLinkUrl } from '@/lib/url-helper';

export interface DownloadCategoryItem {
  id: number;
  name: string;
  slug: string;
}

export interface DownloadFileItem {
  id: number;
  category_id: number | null;
  category_name: string;
  category_slug: string;
  title: string;
  description: string | null;
  file_path: string;
  file_type: string | null;
  file_size: string | null;
  downloads_count: number;
  created_at_formatted: string;
}

interface DownloadsClientProps {
  categories: DownloadCategoryItem[];
  files: DownloadFileItem[];
  initialCategorySlug?: string;
  initialSearch?: string;
}

function getFileIconInfo(extRaw: string | null | undefined, filePath: string) {
  let ext = (extRaw || '').toLowerCase().trim();
  if (!ext && filePath) {
    const clean = filePath.split('?')[0];
    const parts = clean.split('.');
    if (parts.length > 1) ext = parts[parts.length - 1].toLowerCase();
  }

  switch (ext) {
    case 'pdf':
      return {
        icon: FileText,
        color: 'text-rose-500',
        bg: 'bg-rose-50',
        border: 'border-rose-200',
        extLabel: 'PDF',
      };
    case 'doc':
    case 'docx':
      return {
        icon: FileText,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        extLabel: ext.toUpperCase(),
      };
    case 'xls':
    case 'xlsx':
      return {
        icon: FileSpreadsheet,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        extLabel: ext.toUpperCase(),
      };
    case 'ppt':
    case 'pptx':
      return {
        icon: Presentation,
        color: 'text-amber-500',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        extLabel: ext.toUpperCase(),
      };
    case 'zip':
    case 'rar':
    case '7z':
      return {
        icon: FileArchive,
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        extLabel: ext.toUpperCase(),
      };
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'webp':
      return {
        icon: FileImage,
        color: 'text-purple-600',
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        extLabel: ext.toUpperCase(),
      };
    default:
      return {
        icon: FileIcon,
        color: 'text-slate-600',
        bg: 'bg-slate-100',
        border: 'border-slate-200',
        extLabel: ext ? ext.toUpperCase() : 'FILE',
      };
  }
}

export default function DownloadsClient({
  categories,
  files,
  initialCategorySlug = '',
  initialSearch = '',
}: DownloadsClientProps) {
  const [selectedCat, setSelectedCat] = useState<string>(initialCategorySlug);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [counts, setCounts] = useState<Record<number, number>>(() => {
    const map: Record<number, number> = {};
    for (const f of files) {
      map[f.id] = f.downloads_count;
    }
    return map;
  });

  const filteredFiles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return files.filter((f) => {
      if (
        selectedCat &&
        f.category_slug !== selectedCat &&
        String(f.category_id) !== selectedCat
      ) {
        return false;
      }
      if (!q) return true;
      const hay = `${f.title} ${f.description || ''} ${f.category_name}`.toLowerCase();
      return hay.includes(q);
    });
  }, [files, selectedCat, searchQuery]);

  const groupedByCategory = useMemo(() => {
    const map = new Map<string, DownloadFileItem[]>();
    for (const f of filteredFiles) {
      const catName = f.category_name || 'เอกสารทั่วไป';
      if (!map.has(catName)) map.set(catName, []);
      map.get(catName)!.push(f);
    }
    return Array.from(map.entries());
  }, [filteredFiles]);

  const activeCategories = useMemo(() => {
    const catIdSet = new Set(files.map((f) => f.category_id));
    return categories.filter((c) => catIdSet.has(c.id));
  }, [categories, files]);

  const handleTrackDownload = async (id: number) => {
    setCounts((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    try {
      await fetch(`/api/downloads/${id}/track`, { method: 'POST' });
    } catch {
      // Ignore error
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 py-0 sm:py-12 -mt-0 sm:-mt-8 relative z-20">
      {/* Filter & Search Bar */}
      <div className="mx-4 sm:mx-0 my-4 sm:my-0 bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 shadow-none sm:shadow-xl sm:shadow-slate-200/50 border border-slate-200 sm:border-slate-100 mb-6 sm:mb-10 flex flex-col md:flex-row gap-3 sm:gap-4 justify-between items-center">
        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-center md:justify-start">
          <button
            type="button"
            onClick={() => setSelectedCat('')}
            className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              !selectedCat
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
            }`}
          >
            ทั้งหมด
          </button>
          {activeCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCat(cat.slug)}
              className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                selectedCat === cat.slug
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="w-full md:w-80 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อเอกสาร หรือ แบบฟอร์ม..."
            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
          />
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Downloads Display */}
      {groupedByCategory.length > 0 ? (
        <div className="space-y-6 sm:space-y-10">
          {groupedByCategory.map(([catName, catFiles]) => (
            <div
              key={catName}
              className="bg-white rounded-none sm:rounded-3xl shadow-none sm:shadow-lg sm:shadow-slate-200/40 border-0 sm:border border-slate-100 overflow-hidden"
            >
              {/* Category Header */}
              <div className="bg-slate-50/80 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-sm">
                    <FolderOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-800">
                    {catName}
                  </h2>
                </div>
                <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-slate-200/70 text-slate-600 text-xs font-bold">
                  {catFiles.length} รายการ
                </span>
              </div>

              {/* Files List */}
              <div className="divide-y divide-slate-100">
                {catFiles.map((file) => {
                  const iconInfo = getFileIconInfo(
                    file.file_type,
                    file.file_path
                  );
                  const IconComp = iconInfo.icon;
                  const downloadUrl =
                    file.file_path.startsWith('http://') ||
                    file.file_path.startsWith('https://')
                      ? normalizeLinkUrl(file.file_path)
                      : normalizeImageUrl(file.file_path);

                  return (
                    <div
                      key={file.id}
                      className="p-4 sm:p-5 sm:p-6 hover:bg-orange-50/20 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 group"
                    >
                      <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                        <div
                          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl ${iconInfo.bg} ${iconInfo.color} border ${iconInfo.border} flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform`}
                        >
                          <IconComp className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm sm:text-base font-bold text-slate-800 group-hover:text-orange-600 transition-colors leading-snug break-words">
                            {file.title}
                          </h3>
                          {file.description && (
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                              {file.description}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 sm:mt-2.5 text-[10px] sm:text-[11px] text-slate-400 font-medium">
                            <span className="px-1.5 sm:px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono font-bold">
                              {iconInfo.extLabel}
                            </span>
                            {file.file_size && (
                              <>
                                <span>•</span>
                                <span>ขนาด: {file.file_size}</span>
                              </>
                            )}
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />{' '}
                              {file.created_at_formatted}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-orange-500 font-semibold">
                              <Download className="w-3 h-3" />{' '}
                              {(counts[file.id] ?? file.downloads_count).toLocaleString()}{' '}
                              ครั้ง
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-end mt-1 sm:mt-0">
                        <a
                          href={downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => handleTrackDownload(file.id)}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-orange-50 hover:bg-orange-600 text-orange-600 hover:text-white text-xs font-bold transition-all shadow-2xs hover:shadow-md hover:shadow-orange-600/20"
                        >
                          <Download className="w-3.5 h-3.5" /> ดาวน์โหลด
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-none sm:rounded-3xl p-8 sm:p-16 text-center border-0 sm:border border-slate-100 shadow-none sm:shadow-sm max-w-lg mx-auto my-4 sm:my-8">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-6">
            <Folder className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-slate-700 mb-2">
            ไม่พบเอกสารดาวน์โหลด
          </h3>
          <p className="text-slate-500 text-sm mb-6">
            ไม่มีเอกสารที่ตรงกับเงื่อนไขการค้นหา หรือยังไม่มีการอัปโหลดไฟล์ในหมวดหมู่นี้
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCat('');
              setSearchQuery('');
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-50 text-orange-600 font-bold text-sm hover:bg-orange-100 transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> ดูเอกสารทั้งหมด
          </button>
        </div>
      )}
    </section>
  );
}
