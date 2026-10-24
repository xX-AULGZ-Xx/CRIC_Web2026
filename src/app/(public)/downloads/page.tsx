import React from 'react';
import prisma from '@/lib/prisma';
import { getSettings, isMaintenanceActive } from '@/lib/settings';
import { getSession } from '@/lib/auth';
import MaintenanceView from '@/components/public/MaintenanceView';
import DownloadsClient, {
  DownloadCategoryItem,
  DownloadFileItem,
} from '@/components/public/DownloadsClient';

export const dynamic = 'force-dynamic';

const THAI_MONTHS_SHORT = [
  'ม.ค.',
  'ก.พ.',
  'มี.ค.',
  'เม.ย.',
  'พ.ค.',
  'มิ.ย.',
  'ก.ค.',
  'ส.ค.',
  'ก.ย.',
  'ต.ค.',
  'พ.ย.',
  'ธ.ค.',
];

function formatDateEnShort(date: Date | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return `${d.getDate()} ${THAI_MONTHS_SHORT[d.getMonth()] || ''} ${
    d.getFullYear() + 543
  }`;
}

function formatBytes(bytes: number | null | undefined): string | null {
  if (!bytes || bytes <= 0) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default async function DownloadsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string }>;
}) {
  const settings = await getSettings();
  const session = await getSession();
  const sp = await searchParams;

  if (!session && isMaintenanceActive(settings, ['download.php', 'downloads'])) {
    return <MaintenanceView settings={settings} />;
  }

  const [rawCategories, rawFiles] = await Promise.all([
    prisma.download_categories.findMany({
      orderBy: [{ order_num: 'asc' }, { id: 'asc' }],
    }),
    prisma.downloads.findMany({
      include: {
        download_categories: true,
      },
      orderBy: { created_at: 'desc' },
    }),
  ]);

  const categories: DownloadCategoryItem[] = rawCategories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: String(c.id),
  }));

  const files: DownloadFileItem[] = rawFiles.map((f) => ({
    id: f.id,
    category_id: f.category_id,
    category_name: f.download_categories?.name || 'เอกสารทั่วไป',
    category_slug: String(f.category_id),
    title: f.title,
    description: null,
    file_path: f.file_path,
    file_type: f.file_type,
    file_size: formatBytes(f.file_size),
    downloads_count: f.downloads_count || 0,
    created_at_formatted: formatDateEnShort(f.created_at),
  }));

  return (
    <>
      {/* Page Header */}
      <section className="relative bg-slate-900 py-10 sm:py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-950 via-slate-900 to-amber-950 z-0"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 z-0"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-400/30 text-orange-300 text-xs font-bold mb-3 sm:mb-4 uppercase tracking-wider backdrop-blur-sm">
            <i className="fa-solid fa-cloud-arrow-down"></i> Document Center
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-3 sm:mb-4">
            ศูนย์ดาวน์โหลดเอกสาร
          </h1>
          <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base md:text-lg font-light px-2">
            รวบรวมแบบฟอร์ม คู่มือ ระเบียบการ และเอกสารราชการสำหรับนักเรียน นักศึกษา และบุคลากร
          </p>
        </div>
      </section>

      <DownloadsClient
        categories={categories}
        files={files}
        initialCategorySlug={sp.category || ''}
        initialSearch={sp.search || ''}
      />
    </>
  );
}
