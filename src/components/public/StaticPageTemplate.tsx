import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Home,
  ChevronRight,
  Clock,
  FileQuestion,
  Building2,
} from 'lucide-react';
import prisma from '@/lib/prisma';
import { getSettings, isMaintenanceActive } from '@/lib/settings';
import { getSession } from '@/lib/auth';
import { normalizeImageUrl } from '@/lib/url-helper';
import MaintenanceView from './MaintenanceView';
import DynamicBlockRenderer from './DynamicBlockRenderer';

interface StaticPageTemplateProps {
  slug: string;
  allowFallbackNotFoundCard?: boolean;
}

function formatDateEnLong(date: Date | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('th-TH', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export default async function StaticPageTemplate({
  slug,
  allowFallbackNotFoundCard = false,
}: StaticPageTemplateProps) {
  const decodedSlug = decodeURIComponent(slug).trim() || 'about';
  const settings = await getSettings();
  const session = await getSession();

  if (
    !session &&
    isMaintenanceActive(settings, [
      `about.php?slug=${decodedSlug}`,
      decodedSlug,
      'about.php',
      'about',
    ])
  ) {
    return <MaintenanceView settings={settings} />;
  }

  const pageData = await prisma.static_pages.findUnique({
    where: { slug: decodedSlug },
  });

  if (!pageData && !allowFallbackNotFoundCard) {
    notFound();
  }

  const isHomePage = decodedSlug === 'home';
  const layout = pageData?.layout || 'container';

  if (!pageData) {
    return (
      <>
        <section className="relative bg-slate-900 py-12 md:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-950/90 via-slate-900 to-amber-950/90 z-0"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
              ไม่พบหน้าที่ต้องการ
            </h1>
          </div>
        </section>
        <section className="max-w-5xl mx-auto px-0 sm:px-6 lg:px-8 py-0 sm:py-12 -mt-0 sm:-mt-8 relative z-20">
          <div className="bg-white rounded-none sm:rounded-3xl p-6 sm:p-16 text-center border-0 sm:border border-slate-100 shadow-none sm:shadow-xl max-w-lg mx-auto my-4 sm:my-8">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mx-auto mb-6">
              <FileQuestion className="w-8 h-8 sm:w-10 sm:h-10 text-rose-500" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">
              ไม่พบข้อมูลหน้าเว็บนี้
            </h2>
            <p className="text-slate-500 text-sm mb-8">
              หน้าที่คุณกำลังค้นหาอาจถูกลบ เปลี่ยนชื่อ หรือยังไม่ได้ถูกสร้างขึ้นในระบบ
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-orange-600 text-white font-bold text-sm hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20"
            >
              <Home className="w-4 h-4" />
              <span>กลับสู่หน้าแรก</span>
            </Link>
          </div>
        </section>
      </>
    );
  }

  // Home page rendered directly with DynamicBlockRenderer
  if (isHomePage) {
    return (
      <div className="w-full min-h-[60vh]">
        <DynamicBlockRenderer content={pageData.content || ''} />
      </div>
    );
  }

  return (
    <>
      {/* Page Header */}
      <section className="relative bg-slate-900 py-10 sm:py-16 md:py-24 overflow-hidden">
        {pageData.featured_image ? (
          <>
            <div className="absolute inset-0 z-0">
              <img
                src={normalizeImageUrl(pageData.featured_image, 'preview')}
                alt={pageData.title}
                className="w-full h-full object-cover opacity-20"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-slate-900/60 z-0"></div>
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-orange-950/90 via-slate-900 to-amber-950/90 z-0"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 z-0"></div>
          </>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-400/30 text-orange-300 text-xs font-bold mb-3 sm:mb-4 uppercase tracking-wider backdrop-blur-sm">
            <Building2 className="w-3.5 h-3.5" />
            <span>ข้อมูลทั่วไป / Organization</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-3 sm:mb-4">
            {pageData.title}
          </h1>

          {pageData.subtitle && (
            <p className="text-sm sm:text-lg text-orange-200 max-w-2xl mx-auto font-light mb-3 sm:mb-4">
              {pageData.subtitle}
            </p>
          )}

          {/* Breadcrumb */}
          <nav className="flex justify-center mt-4 sm:mt-6" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-2 bg-white/5 backdrop-blur-md px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/10 text-xs">
              <li className="inline-flex items-center">
                <Link
                  href="/"
                  className="text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>หน้าแรก</span>
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 mx-1 sm:mx-1.5" />
                  <span className="text-orange-300 font-medium">
                    {pageData.title}
                  </span>
                </div>
              </li>
            </ol>
          </nav>
        </div>
      </section>

      {/* Main Content Area */}
      {layout === 'full' ? (
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
          <div className="prose prose-slate prose-orange max-w-none text-slate-700 leading-relaxed [word-break:break-word]">
            <DynamicBlockRenderer content={pageData.content || ''} />
          </div>

          <div className="mt-8 sm:mt-12 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>อัปเดตข้อมูลล่าสุดเมื่อ: {formatDateEnLong(pageData.updated_at)}</span>
            </span>
          </div>
        </section>
      ) : (
        /* Mobile: flat borderless edge-to-edge container (no card). Desktop: elevated rounded card */
        <section className="max-w-5xl mx-auto px-0 sm:px-6 lg:px-8 py-0 sm:py-12 -mt-0 sm:-mt-8 relative z-20">
          <div className="w-full bg-white border-0 sm:border border-slate-100 sm:border-slate-200/60 rounded-none sm:rounded-3xl p-4 sm:p-8 md:p-12 shadow-none sm:shadow-xl sm:shadow-slate-200/50">
            <div className="prose prose-slate prose-orange max-w-none text-slate-700 leading-relaxed space-y-4 [word-break:break-word]">
              <DynamicBlockRenderer content={pageData.content || ''} />
            </div>

            <div className="mt-8 sm:mt-12 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>อัปเดตข้อมูลล่าสุดเมื่อ: {formatDateEnLong(pageData.updated_at)}</span>
              </span>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
