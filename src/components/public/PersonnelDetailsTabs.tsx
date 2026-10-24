'use client';

import React, { useState } from 'react';
import { normalizeHtmlContent } from '@/lib/url-helper';

interface PersonnelDetailsTabsProps {
  details: string | null | undefined;
  mode?: 'compact' | 'full';
}

export function splitPersonnelDetails(rawDetails: string | null | undefined): {
  tab1: string;
  tab2: string;
} {
  const defaultTab1 = 'ไม่มีข้อมูลรายละเอียดบทบาทหน้าที่';
  const defaultTab2 = 'ข้อมูลบทบาทหน้าที่การทำงานทั่วไปในฝ่ายงาน';

  if (!rawDetails || !rawDetails.trim()) {
    return { tab1: defaultTab1, tab2: defaultTab2 };
  }
  const text = rawDetails.trim();
  if (text.includes('---')) {
    const idx = text.indexOf('---');
    const part1 = text.slice(0, idx).trim();
    const part2 = text.slice(idx + 3).trim();
    return {
      tab1: part1 || defaultTab1,
      tab2: part2 || defaultTab2,
    };
  }
  if (text.includes('ลักษณะงานที่ปฏิบัติ')) {
    const idx = text.indexOf('ลักษณะงานที่ปฏิบัติ');
    const part1 = text.slice(0, idx).trim();
    const part2 = text.slice(idx).trim();
    return {
      tab1: part1 || defaultTab1,
      tab2: part2 || defaultTab2,
    };
  }
  return { tab1: text || defaultTab1, tab2: defaultTab2 };
}

function hasHtmlTags(str: string): boolean {
  return /<[a-z][\s\S]*>/i.test(str);
}

export default function PersonnelDetailsTabs({
  details,
}: PersonnelDetailsTabsProps) {
  const [activeTab, setActiveTab] = useState<'tab1' | 'tab2'>('tab1');
  const { tab1, tab2 } = splitPersonnelDetails(details);

  return (
    <div className="w-full">
      {/* Pill Tab Buttons */}
      <div className="flex p-1 bg-slate-100 rounded-2xl w-full sm:w-fit gap-1 mb-4 items-center">
        <button
          type="button"
          onClick={() => setActiveTab('tab1')}
          className={`flex-1 sm:flex-none h-10 flex items-center justify-center px-5 rounded-xl text-xs transition duration-200 cursor-pointer ${
            activeTab === 'tab1'
              ? 'bg-orange-600 text-white font-bold shadow-md shadow-orange-600/10'
              : 'font-semibold text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          อำนาจหน้าที่และความรับผิดชอบ
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('tab2')}
          className={`flex-1 sm:flex-none h-10 flex items-center justify-center px-5 rounded-xl text-xs transition duration-200 cursor-pointer ${
            activeTab === 'tab2'
              ? 'bg-orange-600 text-white font-bold shadow-md shadow-orange-600/10'
              : 'font-semibold text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          ลักษณะงานที่ปฏิบัติ
        </button>
      </div>

      {/* Tab Content Box */}
      <div className="p-6 border border-slate-200 rounded-2xl bg-white text-xs md:text-sm text-slate-700 leading-relaxed shadow-xs min-h-[140px]">
        {activeTab === 'tab1' ? (
          hasHtmlTags(tab1) ? (
            <div
              className="prose prose-sm max-w-none text-slate-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: normalizeHtmlContent(tab1) }}
            />
          ) : (
            <div className="whitespace-pre-line">{tab1}</div>
          )
        ) : hasHtmlTags(tab2) ? (
          <div
            className="prose prose-sm max-w-none text-slate-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: normalizeHtmlContent(tab2) }}
          />
        ) : (
          <div className="whitespace-pre-line">{tab2}</div>
        )}
      </div>
    </div>
  );
}
