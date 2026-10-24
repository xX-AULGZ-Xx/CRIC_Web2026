import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getSettings, isMaintenanceActive } from '@/lib/settings';
import { getSession } from '@/lib/auth';
import { normalizeImageUrl } from '@/lib/url-helper';
import MaintenanceView from '@/components/public/MaintenanceView';
import {
  Calendar,
  Eye,
  ChevronRight,
  User,
  Search,
  Tag,
  X,
  Newspaper,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

function stripTagsAndEntities(html: string | null | undefined): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#039;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

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

function formatDateThaiShort(date: Date | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return `${d.getDate()} ${THAI_MONTHS_SHORT[d.getMonth()] || ''} ${
    d.getFullYear() + 543
  }`;
}

export default async function NewsListPage({
  searchParams,
}: {
  searchParams: Promise<{
    slug?: string;
    id?: string;
    category?: string;
    tag?: string;
    search?: string;
    q?: string;
    page?: string;
  }>;
}) {
  const sp = await searchParams;

  // Support legacy query parameter ?slug= or ?id=
  if (sp.slug || sp.id) {
    redirect(`/news/${encodeURIComponent(sp.slug || sp.id || '')}`);
  }

  const settings = await getSettings();
  const session = await getSession();

  if (!session && isMaintenanceActive(settings, ['news.php', 'news'])) {
    return <MaintenanceView settings={settings} />;
  }

  const categoryFilter = (sp.category || '').trim();
  const tagFilter = (sp.tag || '').trim();
  const searchQuery = (sp.search || sp.q || '').trim();
  const page = Math.max(1, parseInt(sp.page || '1', 10) || 1);
  const limit = 9;
  const skip = (page - 1) * limit;

  const categories = await prisma.news_categories.findMany({
    orderBy: { id: 'asc' },
  });

  let activeTagInfo: { name: string; slug: string } | null = null;
  if (tagFilter) {
    activeTagInfo = { name: tagFilter, slug: tagFilter };
  }

  const whereClause: any = {
    status: 'published',
  };

  if (categoryFilter) {
    // Allow matching by slug or numeric ID
    const catById = !isNaN(Number(categoryFilter))
      ? categories.find((c) => c.id === Number(categoryFilter))
      : null;
    const catBySlug = categories.find((c) => c.slug === categoryFilter);
    const matchedCat = catBySlug || catById;
    if (matchedCat) {
      whereClause.category_id = matchedCat.id;
    } else {
      whereClause.category_id = -1;
    }
  }

  if (tagFilter) {
    whereClause.news_tags = {
      some: {
        tag_name: tagFilter,
      },
    };
  }

  if (searchQuery) {
    whereClause.OR = [
      { title: { contains: searchQuery } },
      { content: { contains: searchQuery } },
    ];
  }

  const [totalNews, newsList] = await Promise.all([
    prisma.news.count({ where: whereClause }),
    prisma.news.findMany({
      where: whereClause,
      include: {
        news_categories: true,
        users: {
          select: { username: true },
        },
      },
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
    }),
  ]);

  const totalPages = Math.ceil(totalNews / limit);

  const buildPageHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (categoryFilter) params.set('category', categoryFilter);
    if (tagFilter) params.set('tag', tagFilter);
    if (searchQuery) params.set('search', searchQuery);
    params.set('page', String(targetPage));
    return `/news?${params.toString()}`;
  };

  return (
    <>
      {/* Page Header (Matching Legacy 1:1) */}
      <section className="bg-slate-900 py-10 sm:py-12 md:py-16 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-950 via-slate-900 to-amber-950 z-0 opacity-95"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-400/30 text-orange-300 text-xs font-bold mb-2 uppercase tracking-wider backdrop-blur-sm">
            <Newspaper className="w-3.5 h-3.5" /> News &amp; Updates
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
            คลังข่าวประชาสัมพันธ์และกิจกรรม
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-xl mx-auto px-2">
            ติดตามความเคลื่อนไหว ประกาศรับสมัคร และกิจกรรมนักศึกษาทั้งหมดของ{' '}
            {settings.site_name || 'สถานศึกษา'}
          </p>
        </div>
      </section>

      {/* Main Directory Body Layout (4 Cols: 1 Col Left Sidebar / 3 Cols News Grid) */}
      <section className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 py-4 sm:py-10 grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">
        {/* Left Sidebar Navigation Filters */}
        <aside className="space-y-4 sm:space-y-6">
          {/* Search Widget */}
          <div className="mx-4 sm:mx-0 bg-white border border-slate-200 sm:border-slate-200/80 p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-none sm:shadow-xs">
            <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
              <Search className="w-4 h-4 text-orange-600" /> ค้นหาข่าวสาร
            </h4>
            <form action="/news" method="GET" className="relative">
              {categoryFilter && (
                <input type="hidden" name="category" value={categoryFilter} />
              )}
              {tagFilter && <input type="hidden" name="tag" value={tagFilter} />}
              <input
                type="text"
                name="search"
                defaultValue={searchQuery}
                placeholder="พิมพ์คำค้นหา..."
                className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-orange-500 focus:bg-white transition"
              />
              <button
                type="submit"
                className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-orange-600 cursor-pointer"
                title="ค้นหา"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>
            {searchQuery && (
              <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500">
                <span className="truncate">ค้นหา: &quot;{searchQuery}&quot;</span>
                <Link
                  href={categoryFilter ? `/news?category=${encodeURIComponent(categoryFilter)}` : '/news'}
                  className="text-rose-500 hover:underline flex items-center gap-0.5 text-[11px]"
                >
                  <X className="w-3 h-3" /> ล้าง
                </Link>
              </div>
            )}
          </div>

          {/* Categories Widget */}
          <div className="mx-4 sm:mx-0 bg-white border border-slate-200 sm:border-slate-200/80 p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-none sm:shadow-xs">
            <h4 className="font-bold text-slate-900 text-sm mb-3">หมวดหมู่ข่าวสาร</h4>
            <div className="space-y-1.5 text-xs">
              <Link
                href={searchQuery ? `/news?search=${encodeURIComponent(searchQuery)}` : '/news'}
                className={`block px-3.5 py-2.5 rounded-xl transition font-medium ${
                  !categoryFilter
                    ? 'bg-orange-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                ข่าวสารทั้งหมด
              </Link>
              {categories.map((cat) => {
                const isSelected =
                  categoryFilter === cat.slug || categoryFilter === String(cat.id);
                const href = `/news?category=${encodeURIComponent(cat.slug)}${
                  searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''
                }`;
                return (
                  <Link
                    key={cat.id}
                    href={href}
                    className={`block px-3.5 py-2.5 rounded-xl transition font-medium ${
                      isSelected
                        ? 'bg-orange-600 text-white font-bold shadow-xs'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {cat.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Right Listing Section (3 Cols) */}
        <div className="lg:col-span-3 space-y-4 sm:space-y-6">
          {/* Search / Tag Active Filter Notification Banner */}
          {(searchQuery || activeTagInfo || categoryFilter) && (
            <div className="mx-4 sm:mx-0 p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl text-xs font-semibold text-slate-700 flex items-center justify-between gap-2 shadow-none sm:shadow-xs">
              <div className="flex items-center gap-2 truncate">
                <Search className="w-4 h-4 text-orange-600 shrink-0" />
                <span className="truncate">
                  {searchQuery && `ผลการค้นหา: "${searchQuery}" `}
                  {activeTagInfo && `แท็ก: #${activeTagInfo.name} `}
                  {categoryFilter && `หมวดหมู่: ${categories.find(c => c.slug === categoryFilter || String(c.id) === categoryFilter)?.name || categoryFilter}`}
                </span>
              </div>
              <Link
                href="/news"
                className="text-xs font-bold text-rose-500 hover:underline shrink-0"
              >
                รีเซ็ต
              </Link>
            </div>
          )}

          {/* News Cards Grid */}
          {newsList.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-0 sm:gap-6 divide-y sm:divide-y-0 divide-slate-100">
                {newsList.map((news) => {
                  const plainExcerpt = stripTagsAndEntities(news.content);
                  const newsHref = `/news/${encodeURIComponent(
                    news.slug || String(news.id)
                  )}`;
                  const isAnnouncement =
                    news.news_categories?.slug === 'announcement';

                  return (
                    <article
                      key={news.id}
                      className="bg-white rounded-none sm:rounded-3xl overflow-hidden shadow-none sm:shadow-xs border-0 sm:border border-slate-200/70 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col group pb-4 sm:pb-0"
                    >
                      <Link
                        href={newsHref}
                        className="relative aspect-video overflow-hidden bg-slate-100 block"
                      >
                        {news.cover_image ? (
                          <img
                            src={normalizeImageUrl(news.cover_image, 'preview')}
                            alt={news.title}
                            loading="lazy"
                            style={{
                              objectPosition: `center ${news.cover_position || '50%'}`,
                            }}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50">
                            <Newspaper className="w-10 h-10 opacity-30" />
                          </div>
                        )}
                        <div className="absolute top-3 left-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold shadow-md backdrop-blur-md ${
                              isAnnouncement
                                ? 'bg-amber-500 text-white'
                                : 'bg-orange-600 text-white'
                            }`}
                          >
                            {news.news_categories?.name || 'ข่าวทั่วไป'}
                          </span>
                        </div>
                      </Link>

                      <div className="p-4 sm:p-5 flex-1 flex flex-col">
                        <div className="flex items-center gap-3 text-xs text-slate-400 mb-2 font-medium">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {formatDateThaiShort(news.created_at)}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1.5">
                            <Eye className="w-3.5 h-3.5 text-slate-400" />
                            {(news.views || 0).toLocaleString()} เข้าชม
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 mb-2 line-clamp-2 min-h-[3rem] group-hover:text-orange-600 transition-colors leading-snug break-words">
                          <Link href={newsHref}>{news.title}</Link>
                        </h3>
                        <div className="flex-1 mb-4">
                          <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed break-words [word-break:break-word]">
                            {plainExcerpt}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            {news.users?.username || 'Admin'}
                          </span>
                          <Link
                            href={newsHref}
                            className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-800 group-hover:translate-x-1 transition-transform"
                          >
                            <span>รายละเอียด</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-10 flex justify-center">
                  <nav className="inline-flex rounded-2xl shadow-sm bg-white border border-slate-200 p-1.5 gap-1">
                    {page > 1 && (
                      <Link
                        href={buildPageHref(page - 1)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-orange-600 transition-colors"
                        title="หน้าก่อนหน้า"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </Link>
                    )}

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (pNum) => (
                        <Link
                          key={pNum}
                          href={buildPageHref(pNum)}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                            pNum === page
                              ? 'bg-orange-600 text-white shadow-xs'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-orange-600'
                          }`}
                        >
                          {pNum}
                        </Link>
                      )
                    )}

                    {page < totalPages && (
                      <Link
                        href={buildPageHref(page + 1)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-orange-600 transition-colors"
                        title="หน้าถัดไป"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}
                  </nav>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-none sm:rounded-3xl p-8 sm:p-16 text-center border-0 sm:border border-slate-200/80 shadow-none sm:shadow-xs max-w-lg mx-auto my-4 sm:my-8">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-4 text-3xl">
                <Newspaper className="w-8 h-8 opacity-40 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">
                ไม่พบข้อมูลข่าวสาร
              </h3>
              <p className="text-slate-500 text-xs mb-6">
                ไม่มีข่าวสารที่ตรงกับเงื่อนไขการค้นหา หรือยังไม่มีการเผยแพร่ข่าวในหมวดหมู่นี้
              </p>
              <Link
                href="/news"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-orange-50 text-orange-600 font-bold text-xs hover:bg-orange-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> ดูข่าวสารทั้งหมด
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
