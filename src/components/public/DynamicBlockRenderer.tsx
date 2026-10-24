import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import prisma from '@/lib/prisma';
import { getSettings } from '@/lib/settings';
import {
  formatSlideImageUrl,
  normalizeHtmlContent,
  normalizeImageUrl,
  normalizeLinkUrl,
} from '@/lib/url-helper';
import HomeSliderClient, { SliderItem } from './HomeSliderClient';
import {
  Calendar,
  Eye,
  ArrowRight,
  ChevronRight,
  FolderOpen,
  Image as ImageIcon,
  Newspaper,
  GraduationCap,
  Users,
  Scale,
  Megaphone,
  BookOpen,
  Briefcase,
  Award,
  FileText,
  Globe,
  Star,
  User,
  ZoomIn,
} from 'lucide-react';

interface DynamicBlockRendererProps {
  content: string;
}

const QUICK_ACCESS_COLORS: Record<
  string,
  { bg: string; text: string; hoverBg: string; hoverText: string }
> = {
  indigo: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-600',
    hoverBg: 'group-hover:bg-indigo-600',
    hoverText: 'group-hover:text-indigo-600',
  },
  emerald: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    hoverBg: 'group-hover:bg-emerald-600',
    hoverText: 'group-hover:text-emerald-600',
  },
  amber: {
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    hoverBg: 'group-hover:bg-amber-500',
    hoverText: 'group-hover:text-amber-600',
  },
  rose: {
    bg: 'bg-rose-50',
    text: 'text-rose-600',
    hoverBg: 'group-hover:bg-rose-600',
    hoverText: 'group-hover:text-rose-600',
  },
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    hoverBg: 'group-hover:bg-blue-600',
    hoverText: 'group-hover:text-blue-600',
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    hoverBg: 'group-hover:bg-purple-600',
    hoverText: 'group-hover:text-purple-600',
  },
  cyan: {
    bg: 'bg-cyan-50',
    text: 'text-cyan-600',
    hoverBg: 'group-hover:bg-cyan-600',
    hoverText: 'group-hover:text-cyan-600',
  },
  orange: {
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    hoverBg: 'group-hover:bg-orange-600',
    hoverText: 'group-hover:text-orange-600',
  },
  teal: {
    bg: 'bg-teal-50',
    text: 'text-teal-600',
    hoverBg: 'group-hover:bg-teal-600',
    hoverText: 'group-hover:text-teal-600',
  },
  pink: {
    bg: 'bg-pink-50',
    text: 'text-pink-600',
    hoverBg: 'group-hover:bg-pink-600',
    hoverText: 'group-hover:text-pink-600',
  },
  slate: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    hoverBg: 'group-hover:bg-slate-800',
    hoverText: 'group-hover:text-slate-800',
  },
};

const DEFAULT_QUICK_ACCESS = [
  {
    icon: 'fa-graduation-cap',
    title: 'หลักสูตรที่เปิดสอน',
    subtitle: 'ระดับ ปวช. / ปวส. / ทวิภาคี',
    url: '/curriculum',
    color: 'orange',
  },
  {
    icon: 'fa-users',
    title: 'ทำเนียบบุคลากร',
    subtitle: 'คณะผู้บริหาร ครู และเจ้าหน้าที่',
    url: '/personnel',
    color: 'emerald',
  },
  {
    icon: 'fa-scale-balanced',
    title: 'ข้อมูลคุณธรรม ITA',
    subtitle: 'การประเมินคุณธรรมและความโปร่งใส',
    url: '/ita',
    color: 'amber',
  },
  {
    icon: 'fa-bullhorn',
    title: 'ช่องทางร้องเรียน',
    subtitle: 'แจ้งเบาะแสการทุจริตและประพฤติมิชอบ',
    url: '/complaints',
    color: 'rose',
  },
];

function renderQuickAccessIcon(iconName: string) {
  const name = iconName.replace(/^fa-(solid\s+|regular\s+)?/, '').toLowerCase();
  switch (name) {
    case 'graduation-cap':
      return <GraduationCap className="w-7 h-7" />;
    case 'users':
    case 'user-group':
      return <Users className="w-7 h-7" />;
    case 'scale-balanced':
    case 'scale':
      return <Scale className="w-7 h-7" />;
    case 'bullhorn':
    case 'megaphone':
      return <Megaphone className="w-7 h-7" />;
    case 'book':
    case 'book-open':
      return <BookOpen className="w-7 h-7" />;
    case 'briefcase':
      return <Briefcase className="w-7 h-7" />;
    case 'images':
    case 'image':
      return <ImageIcon className="w-7 h-7" />;
    case 'award':
      return <Award className="w-7 h-7" />;
    case 'file':
    case 'file-text':
      return <FileText className="w-7 h-7" />;
    case 'calendar':
      return <Calendar className="w-7 h-7" />;
    case 'globe':
      return <Globe className="w-7 h-7" />;
    default:
      return <Star className="w-7 h-7" />;
  }
}

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

function formatThaiShortDate(date: Date | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const day = d.getDate();
  const month = THAI_MONTHS_SHORT[d.getMonth()] || '';
  const year = d.getFullYear() + 543;
  return `${day} ${month} ${year}`;
}

async function renderHomeSlidersBlock(siteName: string) {
  const rows = await prisma.sliders.findMany({
    where: { is_active: true },
    orderBy: { order_num: 'asc' },
  });

  const sliders: SliderItem[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    subtitle: r.subtitle,
    image_path: r.image_path,
    link: r.link,
    fit_width: r.fit_width,
  }));

  return <HomeSliderClient sliders={sliders} siteName={siteName} />;
}

function renderQuickAccessBlock(encodedJson?: string) {
  let items = DEFAULT_QUICK_ACCESS;
  if (encodedJson) {
    try {
      const decoded = JSON.parse(decodeURIComponent(encodedJson));
      if (Array.isArray(decoded) && decoded.length > 0) {
        items = decoded;
      }
    } catch {
      // Fallback to default
    }
  }

  const count = items.length;
  let gridCols = 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
  if (count === 1) gridCols = 'grid-cols-1 max-w-md mx-auto';
  else if (count === 2) gridCols = 'grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto';
  else if (count === 3) gridCols = 'grid-cols-1 md:grid-cols-3';
  else if (count >= 5) gridCols = 'grid-cols-1 md:grid-cols-3 lg:grid-cols-5';

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 md:-mt-16 z-30 relative">
      <div className={`grid ${gridCols} gap-4 md:gap-6`}>
        {items.map((item, idx) => {
          const colorKey = item.color || 'orange';
          const c = QUICK_ACCESS_COLORS[colorKey] || QUICK_ACCESS_COLORS.orange;
          const icon = item.icon || 'fa-star';
          const title = item.title || 'เมนูทางลัด';
          const subtitle = item.subtitle || '';
          const url = normalizeLinkUrl(item.url || '#');
          const isExternal = url.startsWith('http://') || url.startsWith('https://');

          return (
            <a
              key={idx}
              href={url}
              target={isExternal ? '_blank' : undefined}
              rel={isExternal ? 'noopener noreferrer' : undefined}
              className="group bg-white p-6 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 hover:-translate-y-1 transition-all duration-300 flex items-center gap-4"
            >
              <div
                className={`w-14 h-14 rounded-2xl ${c.bg} ${c.text} flex items-center justify-center text-2xl ${c.hoverBg} group-hover:text-white transition-colors shrink-0 shadow-inner`}
              >
                {renderQuickAccessIcon(icon)}
              </div>
              <div className="min-w-0">
                <h3
                  className={`font-bold text-slate-800 ${c.hoverText} transition-colors truncate`}
                >
                  {title}
                </h3>
                {subtitle && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{subtitle}</p>
                )}
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}

async function renderLatestNewsBlock() {
  const latestNews = await prisma.news.findMany({
    where: { status: 'published' },
    include: { news_categories: true },
    orderBy: { created_at: 'desc' },
    take: 3,
  });

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100/70 text-orange-800 text-xs font-bold mb-3 uppercase tracking-wider">
            <Newspaper className="w-3.5 h-3.5" />
            <span>News &amp; Updates</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight">
            ประชาสัมพันธ์ &amp; กิจกรรม
          </h2>
        </div>
        <Link
          href="/news"
          className="inline-flex items-center gap-2 text-orange-700 font-semibold hover:text-orange-900 group bg-orange-100/70 hover:bg-orange-100 px-5 py-2.5 rounded-xl transition-colors self-start md:self-auto"
        >
          <span>ดูข่าวสารทั้งหมด</span>
          <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {latestNews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {latestNews.map((news, index) => {
            const plainExcerpt = stripTagsAndEntities(news.content);
            const posClass =
              news.cover_position === 'top'
                ? 'object-top'
                : news.cover_position === 'bottom'
                ? 'object-bottom'
                : 'object-center';
            const newsHref = `/news/${encodeURIComponent(news.slug || String(news.id))}`;
            const isAnnouncement = news.news_categories?.slug === 'announcement';

            return (
              <article
                key={news.id}
                className="bg-white rounded-3xl overflow-hidden shadow-lg shadow-slate-200/50 border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group"
              >
                <div className="relative aspect-video overflow-hidden bg-slate-100">
                  {news.cover_image ? (
                    <Image
                      src={normalizeImageUrl(news.cover_image, 'thumbnail')}
                      alt={news.title}
                      fill
                      priority={index === 0}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 400px"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      style={{ objectPosition: `center ${news.cover_position || '50%'}` }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50">
                      <ImageIcon className="w-12 h-12 opacity-40 text-slate-400" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold shadow-md backdrop-blur-md ${
                        isAnnouncement
                          ? 'bg-amber-500/90 text-white'
                          : 'bg-orange-600/90 text-white'
                      }`}
                    >
                      {news.news_categories?.name || 'ข่าวทั่วไป'}
                    </span>
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center gap-3 text-xs text-slate-600 mb-3 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {formatThaiShortDate(news.created_at)}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      {(news.views || 0).toLocaleString()} เข้าชม
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2 line-clamp-2 min-h-[3.5rem] group-hover:text-orange-600 transition-colors leading-snug break-words">
                    <Link href={newsHref}>{news.title}</Link>
                  </h3>
                  <div className="flex-1 mb-4">
                    <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed break-words [word-break:break-word]">
                      {plainExcerpt}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
                    <Link
                      href={newsHref}
                      aria-label={`อ่านเพิ่มเติม: ${news.title}`}
                      className="inline-flex items-center gap-1 text-sm font-bold text-orange-700 hover:text-orange-900 group/link"
                    >
                      <span>อ่านเพิ่มเติม</span>
                      <ChevronRight className="w-4 h-4 transform group-hover/link:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-4 text-2xl">
            <FolderOpen className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-700">ยังไม่มีข้อมูลข่าวสาร</h3>
          <p className="text-slate-500 text-sm mt-1">
            ระบบกำลังรอการอัปเดตข้อมูลข่าวประชาสัมพันธ์ใหม่
          </p>
        </div>
      )}
    </section>
  );
}

async function renderExecutivesBlock(customTitleRaw?: string, customSubRaw?: string) {
  let execTitle = 'ทำเนียบผู้บริหาร';
  let execSubtitle = 'คณะผู้บริหารสถานศึกษา มุ่งมั่นพัฒนาคุณภาพการศึกษาสู่อนาคต';
  try {
    if (customTitleRaw) execTitle = decodeURIComponent(customTitleRaw);
    if (customSubRaw) execSubtitle = decodeURIComponent(customSubRaw);
  } catch {
    // Fallback
  }

  const rawExecs = await prisma.personnel.findMany({
    where: {
      is_active: true,
      OR: [
        { is_executive: true },
        { position: { contains: 'ผู้อำนวยการ' } },
        { position: { contains: 'รองผู้อำนวยการ' } },
        { personnel_categories: { name: { contains: 'ผู้บริหาร' } } },
      ],
    },
    include: {
      personnel_categories: {
        include: {
          personnel_categories: true, // Parent category
        },
      },
    },
    orderBy: [{ order_num: 'asc' }, { id: 'asc' }],
    take: 5,
  });

  if (rawExecs.length === 0) return null;

  const formattedExecs = rawExecs.map((person) => {
    let pos = person.position || '';
    const cat = person.personnel_categories;
    const mainDeptName = cat
      ? cat.parent_id && cat.personnel_categories
        ? cat.personnel_categories.name
        : cat.name
      : '';

    const isDirector = person.order_num === 1 || (pos.includes('ผู้อำนวยการ') && !pos.includes('รอง'));
    if (!isDirector) {
      const isActingDeputy = !pos.includes('รองผู้อำนวยการ');
      if (isActingDeputy) {
        pos = 'ครู ทำหน้าที่รองผู้อำนวยการ';
      }
      if (mainDeptName && !pos.includes(mainDeptName)) {
        if (mainDeptName.includes('ฝ่าย') || mainDeptName.includes('แผนก')) {
          pos = `${pos} ${mainDeptName}`.trim();
        }
      }
    }

    return {
      ...person,
      formattedPosition: pos,
    };
  });

  let directors = formattedExecs.filter((p) => p.order_num === 1);
  let deputies = formattedExecs.filter((p) => p.order_num !== 1);
  if (directors.length === 0 && formattedExecs.length > 0) {
    directors = [formattedExecs[0]];
    deputies = formattedExecs.slice(1);
  }

  return (
    <section className="bg-slate-900 py-20 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 -mr-40 -mt-40 w-96 h-96 rounded-full bg-orange-600/20 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -ml-40 -mb-40 w-96 h-96 rounded-full bg-amber-600/20 blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-orange-300 text-xs font-bold mb-3 uppercase tracking-wider backdrop-blur-sm border border-white/10">
            <Users className="w-3.5 h-3.5" />
            <span>Executive Directory</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
            {execTitle}
          </h2>
          <p className="text-slate-400">{execSubtitle}</p>
        </div>

        {/* Tier 1: Directors */}
        {directors.length > 0 && (
          <div className="flex flex-wrap justify-center gap-8 mb-10">
            {directors.map((person) => (
              <div
                key={person.id}
                className="w-full sm:w-72 md:w-80 bg-gradient-to-b from-orange-950/40 to-slate-800/80 backdrop-blur-md rounded-3xl p-6 border-2 border-orange-500/30 text-center group hover:border-orange-400 transition-all duration-300 flex flex-col items-center shadow-2xl shadow-orange-950/20 transform md:-translate-y-2"
              >
                <div className="relative w-36 h-36 mb-5 rounded-full p-1.5 bg-gradient-to-tr from-amber-400 via-orange-500 to-amber-500 shadow-xl">
                  <div className="w-full h-full rounded-full overflow-hidden bg-slate-800 relative">
                    {person.image_path ? (
                      <Image
                        src={normalizeImageUrl(person.image_path, 'thumbnail')}
                        alt={person.name}
                        fill
                        sizes="144px"
                        className="object-cover object-top group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500">
                        <User className="w-16 h-16" />
                      </div>
                    )}
                  </div>
                </div>
                <span className="px-3 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-[10px] font-bold tracking-wider uppercase mb-2">
                  ผู้บริหารสูงสุด
                </span>
                <h3 className="text-xl font-bold text-white mb-1 group-hover:text-amber-300 transition-colors">
                  {person.name}
                </h3>
                <p className="text-orange-200 text-sm font-medium mb-4">
                  {person.formattedPosition}
                </p>
                <div className="mt-auto pt-4 border-t border-white/10 w-full flex justify-center">
                  <Link
                    href={`/personnel/${person.id}`}
                    className="inline-flex items-center gap-1.5 text-xs text-amber-300 hover:text-white transition-colors font-semibold bg-white/5 hover:bg-white/10 px-4 py-1.5 rounded-full"
                  >
                    <span>ดูประวัติและหน้าที่</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tier 2: Deputies */}
        {deputies.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 justify-center">
            {deputies.map((person) => (
              <div
                key={person.id}
                className="bg-slate-800/50 backdrop-blur-md rounded-3xl p-6 border border-white/10 text-center group hover:bg-slate-800 transition-all duration-300 flex flex-col items-center"
              >
                <div className="relative w-28 h-28 mb-4 rounded-full p-1 bg-gradient-to-tr from-orange-500 to-amber-500">
                  <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 relative">
                    {person.image_path ? (
                      <Image
                        src={normalizeImageUrl(person.image_path, 'thumbnail')}
                        alt={person.name}
                        fill
                        sizes="112px"
                        className="object-cover object-top group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600">
                        <User className="w-12 h-12" />
                      </div>
                    )}
                  </div>
                </div>
                <h3 className="text-base font-bold text-white mb-1 group-hover:text-orange-300 transition-colors">
                  {person.name}
                </h3>
                <p className="text-orange-300 text-xs font-medium mb-4">
                  {person.formattedPosition}
                </p>
                <div className="mt-auto pt-3 border-t border-white/10 w-full">
                  <Link
                    href={`/personnel/${person.id}`}
                    className="inline-flex items-center text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    <span>ดูรายละเอียดโปรไฟล์</span>
                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <Link
            href="/personnel"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-all border border-white/10"
          >
            <span>ดูทำเนียบบุคลากรทั้งหมด</span>
            <Users className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}

async function renderActivityAlbumBlock(albumIdStr: string) {
  const albumId = parseInt(albumIdStr, 10);
  if (isNaN(albumId)) return null;

  const album = await prisma.galleries.findFirst({
    where: { id: albumId },
    include: {
      gallery_images: {
        orderBy: { id: 'asc' },
        take: 4,
      },
    },
  });

  if (!album) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="bg-gradient-to-br from-slate-50 to-orange-50/40 rounded-[2.5rem] p-8 md:p-12 border border-orange-100/60 shadow-lg shadow-orange-100/20">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold mb-3 uppercase tracking-wider">
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Activity Gallery</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
              {album.title}
            </h2>
            {album.description && (
              <p className="text-slate-500 text-sm mt-2 max-w-2xl">
                {album.description}
              </p>
            )}
          </div>
          <Link
            href={`/gallery?album=${album.id}`}
            className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-md shadow-orange-600/20 self-start md:self-auto shrink-0 group"
          >
            <span>ดูรูปภาพทั้งหมดในอัลบั้ม</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {album.gallery_images.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {album.gallery_images.map((img) => {
              const thumbSrc = normalizeImageUrl(img.image_path, 'thumbnail');
              const fullSrc = normalizeImageUrl(img.image_path, 'preview');
              return (
                <div
                  key={img.id}
                  data-lightbox-src={fullSrc}
                  data-lightbox-caption={album.title}
                  className="group relative h-60 rounded-2xl overflow-hidden bg-slate-200 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer"
                >
                  <img
                    src={thumbSrc}
                    alt={album.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <div className="text-white text-xs font-medium truncate w-full flex items-center justify-between">
                      <span className="truncate">{album.title}</span>
                      <ZoomIn className="w-4 h-4 shrink-0 ml-2" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 text-slate-400">
            ยังไม่มีรูปภาพในอัลบั้มนี้
          </div>
        )}
      </div>
    </section>
  );
}

async function renderCategorizedNewsBlock(
  catIdRaw: string,
  limitRaw: string,
  titleRaw: string
) {
  let limit = parseInt(limitRaw, 10);
  if (isNaN(limit) || limit < 1 || limit > 12) limit = 3;

  let blockTitle = 'ข่าวสารล่าสุด';
  try {
    if (titleRaw) blockTitle = decodeURIComponent(titleRaw);
  } catch {
    // Fallback
  }

  const isAll = catIdRaw === 'all';
  const catIdNum = isAll ? null : parseInt(catIdRaw, 10);

  const newsItems = await prisma.news.findMany({
    where: {
      status: 'published',
      ...(catIdNum && !isNaN(catIdNum) ? { category_id: catIdNum } : {}),
    },
    include: { news_categories: true },
    orderBy: { created_at: 'desc' },
    take: limit,
  });

  let viewAllUrl = '/news';
  if (catIdNum && !isNaN(catIdNum)) {
    const catRecord = await prisma.news_categories.findUnique({
      where: { id: catIdNum },
      select: { slug: true },
    });
    if (catRecord?.slug) {
      viewAllUrl = `/news?category=${encodeURIComponent(catRecord.slug)}`;
    }
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100/70 text-orange-800 text-xs font-bold mb-3 uppercase tracking-wider">
            <Megaphone className="w-3.5 h-3.5" />
            <span>News Category</span>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            {blockTitle}
          </h2>
        </div>
        <Link
          href={viewAllUrl}
          className="inline-flex items-center gap-2 text-orange-700 font-semibold hover:text-orange-900 group bg-orange-100/70 hover:bg-orange-100 px-5 py-2.5 rounded-xl transition-colors self-start md:self-auto"
        >
          <span>ดูทั้งหมด</span>
          <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {newsItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {newsItems.map((news) => {
            const plainExcerpt = stripTagsAndEntities(news.content);
            const posClass =
              news.cover_position === 'top'
                ? 'object-top'
                : news.cover_position === 'bottom'
                ? 'object-bottom'
                : 'object-center';
            const newsHref = `/news/${encodeURIComponent(news.slug || String(news.id))}`;

            return (
              <article
                key={news.id}
                className="bg-white rounded-3xl overflow-hidden shadow-lg shadow-slate-200/50 border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group"
              >
                <div className="relative aspect-video overflow-hidden bg-slate-100">
                  {news.cover_image ? (
                    <Image
                      src={normalizeImageUrl(news.cover_image, 'thumbnail')}
                      alt={news.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 400px"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      style={{ objectPosition: `center ${news.cover_position || '50%'}` }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50">
                      <ImageIcon className="w-12 h-12 opacity-40 text-slate-400" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-full text-xs font-bold shadow-md backdrop-blur-md bg-orange-600/90 text-white">
                      {news.news_categories?.name || 'ข่าวทั่วไป'}
                    </span>
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center gap-3 text-xs text-slate-600 mb-3 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {formatThaiShortDate(news.created_at)}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      {(news.views || 0).toLocaleString()} เข้าชม
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2 line-clamp-2 min-h-[3.5rem] group-hover:text-orange-600 transition-colors leading-snug break-words">
                    <Link href={newsHref}>{news.title}</Link>
                  </h3>
                  <div className="flex-1 mb-4">
                    <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed break-words [word-break:break-word]">
                      {plainExcerpt}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
                    <Link
                      href={newsHref}
                      aria-label={`อ่านเพิ่มเติม: ${news.title}`}
                      className="inline-flex items-center gap-1 text-sm font-bold text-orange-700 hover:text-orange-900 group/link"
                    >
                      <span>อ่านเพิ่มเติม</span>
                      <ChevronRight className="w-4 h-4 transform group-hover/link:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-10 text-center border border-slate-100 text-slate-400">
          ยังไม่มีข้อมูลข่าวในหมวดหมู่นี้
        </div>
      )}
    </section>
  );
}

export default async function DynamicBlockRenderer({
  content,
}: DynamicBlockRendererProps) {
  const settings = await getSettings();
  const siteName = settings.site_name || 'วิทยาลัยการอาชีพศีขรภูมิ';

  const blockRegex =
    /<!--\s*block:(home_sliders|quick_access(?::.*?)?|latest_news|executives(?::.*?:.*?)?|activity_album:\d+|categorized_news:(?:\d+|all):\d+:.*?)\s*-->/g;

  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyCounter = 0;

  while ((match = blockRegex.exec(content)) !== null) {
    const beforeHtml = content.slice(lastIndex, match.index);
    if (beforeHtml.trim()) {
      elements.push(
        <div
          key={`html-${keyCounter++}`}
          dangerouslySetInnerHTML={{ __html: normalizeHtmlContent(beforeHtml) }}
        />
      );
    }

    const token = match[1].trim();
    if (token === 'home_sliders') {
      elements.push(
        <React.Fragment key={`block-${keyCounter++}`}>
          {await renderHomeSlidersBlock(siteName)}
        </React.Fragment>
      );
    } else if (token.startsWith('quick_access')) {
      const encodedJson = token.includes(':')
        ? token.slice('quick_access:'.length)
        : undefined;
      elements.push(
        <React.Fragment key={`block-${keyCounter++}`}>
          {renderQuickAccessBlock(encodedJson)}
        </React.Fragment>
      );
    } else if (token === 'latest_news') {
      elements.push(
        <React.Fragment key={`block-${keyCounter++}`}>
          {await renderLatestNewsBlock()}
        </React.Fragment>
      );
    } else if (token.startsWith('executives')) {
      const parts = token.split(':');
      const customTitle = parts[1];
      const customSub = parts.slice(2).join(':');
      elements.push(
        <React.Fragment key={`block-${keyCounter++}`}>
          {await renderExecutivesBlock(customTitle, customSub)}
        </React.Fragment>
      );
    } else if (token.startsWith('activity_album:')) {
      const albumIdStr = token.slice('activity_album:'.length);
      elements.push(
        <React.Fragment key={`block-${keyCounter++}`}>
          {await renderActivityAlbumBlock(albumIdStr)}
        </React.Fragment>
      );
    } else if (token.startsWith('categorized_news:')) {
      const rest = token.slice('categorized_news:'.length);
      const firstColon = rest.indexOf(':');
      const secondColon = rest.indexOf(':', firstColon + 1);
      if (firstColon !== -1 && secondColon !== -1) {
        const catId = rest.slice(0, firstColon);
        const limit = rest.slice(firstColon + 1, secondColon);
        const title = rest.slice(secondColon + 1);
        elements.push(
          <React.Fragment key={`block-${keyCounter++}`}>
            {await renderCategorizedNewsBlock(catId, limit, title)}
          </React.Fragment>
        );
      }
    }

    lastIndex = blockRegex.lastIndex;
  }

  const remainingHtml = content.slice(lastIndex);
  if (remainingHtml.trim()) {
    elements.push(
      <div
        key={`html-${keyCounter++}`}
        dangerouslySetInnerHTML={{ __html: normalizeHtmlContent(remainingHtml) }}
      />
    );
  }

  return <div className="w-full">{elements}</div>;
}
