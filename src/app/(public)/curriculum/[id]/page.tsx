import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Home,
  ChevronRight,
  GraduationCap,
  Award,
  BookOpen,
  UserCheck,
  Clock,
  FileDown,
  FileText,
  Globe,
  ExternalLink,
  Briefcase,
  CheckCircle2,
  Images,
  ZoomIn,
  Users,
  User,
  Phone,
  Mail,
  ClipboardList,
  Headphones,
  ArrowLeft,
} from 'lucide-react';
import prisma from '@/lib/prisma';
import { getSettings, isMaintenanceActive } from '@/lib/settings';
import { getSession } from '@/lib/auth';
import {
  normalizeHtmlContent,
  normalizeImageUrl,
  normalizeLinkUrl,
} from '@/lib/url-helper';
import MaintenanceView from '@/components/public/MaintenanceView';
import { LEVEL_CONFIG } from '../page';

export const dynamic = 'force-dynamic';

function hasHtmlTags(str: string): boolean {
  return /<[a-z][\s\S]*>/i.test(str);
}

function parseContactInfo(info?: string | null): { email: string; phone: string } {
  if (!info) return { email: '', phone: '' };
  let email = '';
  let phone = '';
  let str = info.trim();

  const emailMatch = str.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    email = emailMatch[0];
    str = str.replace(email, '');
  }

  const phoneMatch = str.match(/[0-9]{2,4}-?[0-9]{3,4}-?[0-9]{3,4}/);
  if (phoneMatch) {
    phone = phoneMatch[0];
  } else {
    const rawMatch = str.match(/[0-9\s-]{9,15}/);
    if (rawMatch) {
      phone = rawMatch[0].trim();
    } else {
      const cleaned = str.replace(/[,;/]/g, '').trim();
      if (cleaned) phone = cleaned;
    }
  }

  return { email: email.trim(), phone: phone.trim() };
}

function getLevelIcon(level?: string | null) {
  const lvl = level || '';
  if (lvl.includes('ปวส')) return Award;
  if (lvl.includes('ปริญญาตรี')) return Award;
  if (lvl.includes('ระยะสั้น')) return BookOpen;
  return GraduationCap;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const currId = parseInt(id, 10);
  if (isNaN(currId) || currId <= 0) return { title: 'สาขาวิชา' };

  const settings = await getSettings();
  const curr = await prisma.curriculums.findUnique({
    where: { id: currId },
    select: { name: true, description: true, image_path: true, level: true },
  });

  const siteName = settings.site_name || 'วิทยาลัยการอาชีพเชียงราย';
  const name = curr?.name || 'รายละเอียดสาขาวิชา';
  const desc =
    curr?.description?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160) ||
    `ข้อมูลและรายละเอียดหลักสูตรสาขาวิชา ${name} (${curr?.level || 'ปวช./ปวส.'}) ของ ${siteName}`;
  const canonicalUrl = `https://www.cric.ac.th/curriculum/${currId}`;
  const ogImg = curr?.image_path
    ? normalizeImageUrl(curr.image_path)
    : 'https://www.cric.ac.th/uploads/file_6a27706c88d814.68152088.webp';

  return {
    title: `สาขาวิชา ${name} (${curr?.level || 'หลักสูตรวิชาชีพ'})`,
    description: desc,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `สาขาวิชา ${name} - ${siteName}`,
      description: desc,
      url: canonicalUrl,
      images: [
        {
          url: ogImg,
          width: 1200,
          height: 630,
          alt: name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `สาขาวิชา ${name} - ${siteName}`,
      description: desc,
      images: [ogImg],
    },
  };
}

export default async function CurriculumDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const currId = parseInt(id, 10);
  if (isNaN(currId) || currId <= 0) {
    notFound();
  }

  const settings = await getSettings();
  const session = await getSession();

  if (!session && isMaintenanceActive(settings, ['curriculum.php', 'curriculum'])) {
    return <MaintenanceView settings={settings} />;
  }

  const curr = await prisma.curriculums.findUnique({
    where: { id: currId },
  });

  if (!curr) {
    notFound();
  }

  const relatedPersonnel = await prisma.personnel.findMany({
    where: {
      curriculum_id: curr.id,
      is_active: true,
    },
    orderBy: [{ order_num: 'asc' }, { id: 'asc' }],
  });

  let galleryImages: string[] = [];
  if (curr.gallery_images) {
    try {
      const parsed = JSON.parse(curr.gallery_images);
      if (Array.isArray(parsed)) {
        galleryImages = parsed.filter(Boolean);
      }
    } catch {
      galleryImages = curr.gallery_images
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }

  const levelKey = curr.level || 'ปวช.';
  const cfg = LEVEL_CONFIG[levelKey] || LEVEL_CONFIG['ปวช.'] || {
    title: curr.level || 'หลักสูตร',
    subtitle: '',
    badge_bg: 'bg-orange-600',
    badge_text: 'text-white',
    icon: 'fa-graduation-cap',
    gradient: 'from-orange-600 to-amber-600',
  };

  const LevelIcon = getLevelIcon(curr.level);

  const careerLines = (curr.career_guidelines || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const courseSchema = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: curr.name,
    description:
      curr.description?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() ||
      `หลักสูตรสาขาวิชา ${curr.name} วิทยาลัยการอาชีพเชียงราย`,
    provider: {
      '@type': 'EducationalOrganization',
      name: 'วิทยาลัยการอาชีพเชียงราย',
      sameAs: 'https://www.cric.ac.th',
    },
    educationalCredentialAwarded: curr.level || 'ประกาศนียบัตรวิชาชีพ',
    occupationalCredentialAwarded: curr.career_guidelines || 'ผู้ประกอบการ / ช่างวิชาชีพ',
    url: `https://www.cric.ac.th/curriculum/${curr.id}`,
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'หน้าแรก',
        item: 'https://www.cric.ac.th',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'สาขาวิชาที่เปิดสอน',
        item: 'https://www.cric.ac.th/curriculum',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: curr.name,
        item: `https://www.cric.ac.th/curriculum/${curr.id}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {/* Breadcrumb Bar */}
      <div className="bg-white border-b border-slate-100 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 text-xs text-slate-500 overflow-x-auto whitespace-nowrap">
          <Link
            href="/"
            className="hover:text-orange-600 transition-colors flex items-center gap-1.5"
          >
            <Home className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-600" />
            <span>หน้าแรก</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <Link
            href="/curriculum"
            className="hover:text-orange-600 transition-colors"
          >
            หลักสูตรที่เปิดสอน
          </Link>
          {curr.level && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              <Link
                href={`/curriculum?level=${encodeURIComponent(curr.level)}`}
                className="hover:text-orange-600 transition-colors"
              >
                {curr.level}
              </Link>
            </>
          )}
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <span className="text-slate-800 font-medium truncate max-w-xs md:max-w-md">
            {curr.name}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 py-4 sm:py-12">
        {/* Hero Cover Card */}
        <div className="bg-white rounded-none sm:rounded-3xl shadow-none sm:shadow-xl sm:shadow-slate-200/50 border-0 sm:border border-slate-100 overflow-hidden mb-6 sm:mb-12">
          <div className="relative h-64 sm:h-80 md:h-96 bg-slate-900 overflow-hidden">
            {curr.image_path ? (
              <img
                src={normalizeImageUrl(curr.image_path, 'preview')}
                alt={curr.name}
                className="w-full h-full object-cover opacity-60"
              />
            ) : (
              <div
                className={`w-full h-full bg-gradient-to-br ${cfg.gradient} opacity-80 flex items-center justify-center`}
              >
                <LevelIcon className="w-28 h-28 text-white/20" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/50 to-transparent"></div>

            <div className="absolute bottom-0 inset-x-0 p-6 sm:p-10 md:p-12 text-white">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold shadow-lg ${cfg.badge_bg} ${cfg.badge_text}`}
                >
                  <LevelIcon className="w-3.5 h-3.5" />
                  <span>{curr.level || 'หลักสูตร'}</span>
                </span>
                {curr.code && (
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-white/20 text-white backdrop-blur-md border border-white/20">
                    รหัสหลักสูตร: {curr.code}
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
                {curr.name}
              </h1>
            </div>
          </div>

          {/* Quick Info Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 bg-slate-50/50 border-t border-slate-100">
            <div className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">
                  คุณสมบัติผู้สมัคร
                </p>
                <p className="text-sm font-bold text-slate-700 mt-0.5">
                  {curr.qualification || 'ตามเกณฑ์ที่สถานศึกษากำหนด'}
                </p>
              </div>
            </div>

            <div className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">
                  ระยะเวลาศึกษา
                </p>
                <p className="text-sm font-bold text-slate-700 mt-0.5">
                  {curr.duration || 'ตามโครงสร้างหลักสูตร'}
                </p>
              </div>
            </div>

            <div className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400 font-bold uppercase">
                  เอกสารหลักสูตร
                </p>
                {curr.file_path ? (
                  <a
                    href={normalizeImageUrl(curr.file_path)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600 hover:text-emerald-700 mt-0.5 truncate"
                  >
                    <span>ดาวน์โหลด PDF</span>
                    <FileDown className="w-4 h-4" />
                  </a>
                ) : (
                  <p className="text-sm text-slate-400 mt-0.5">ไม่มีไฟล์แนบ</p>
                )}
              </div>
            </div>

            <div className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Globe className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400 font-bold uppercase">
                  เว็บไซต์/เพจแผนกวิชา
                </p>
                {curr.website_url ? (
                  <a
                    href={normalizeLinkUrl(curr.website_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-700 mt-0.5 truncate"
                  >
                    <span>เยี่ยมชมเว็บไซต์</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <p className="text-sm text-slate-400 mt-0.5">ไม่ได้ระบุ</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left Column (2/3) */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-10">
            {/* Course Description */}
            <div className="bg-white rounded-none sm:rounded-3xl p-4 sm:p-10 shadow-none sm:shadow-sm border-0 sm:border border-slate-100">
              <h2 className="text-xl font-extrabold text-slate-800 mb-6 pb-4 border-b border-slate-100 flex items-center gap-3">
                <span className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </span>
                <span>รายละเอียดสาขาวิชา (Course Description)</span>
              </h2>
              <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed">
                {curr.description ? (
                  hasHtmlTags(curr.description) ? (
                    <div
                      dangerouslySetInnerHTML={{
                        __html: normalizeHtmlContent(curr.description),
                      }}
                    />
                  ) : (
                    <div className="whitespace-pre-line">{curr.description}</div>
                  )
                ) : (
                  <p className="text-slate-400 italic">
                    ยังไม่มีรายละเอียดเพิ่มเติมสำหรับหลักสูตรนี้
                  </p>
                )}
              </div>
            </div>

            {/* Career Guidelines */}
            {curr.career_guidelines && (
              <div className="bg-white rounded-none sm:rounded-3xl p-4 sm:p-10 shadow-none sm:shadow-sm border-0 sm:border border-slate-100">
                <h2 className="text-xl font-extrabold text-slate-800 mb-6 pb-4 border-b border-slate-100 flex items-center gap-3">
                  <span className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Briefcase className="w-5 h-5" />
                  </span>
                  <span>แนวทางการประกอบอาชีพ (Career Guidelines)</span>
                </h2>
                <div className="text-slate-600 leading-relaxed">
                  {hasHtmlTags(curr.career_guidelines) ? (
                    <div
                      className="prose prose-slate max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: normalizeHtmlContent(curr.career_guidelines),
                      }}
                    />
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {careerLines.map((line, idx) => {
                        const cleanLine = line.replace(/^[-•*]\s*/, '').trim();
                        return (
                          <div
                            key={idx}
                            className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-colors"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                            <span className="text-sm font-medium text-slate-700">
                              {cleanLine}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Gallery Images */}
            {galleryImages.length > 0 && (
              <div className="bg-white rounded-none sm:rounded-3xl p-4 sm:p-10 shadow-none sm:shadow-sm border-0 sm:border border-slate-100">
                <h2 className="text-xl font-extrabold text-slate-800 mb-6 pb-4 border-b border-slate-100 flex items-center gap-3">
                  <span className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Images className="w-5 h-5" />
                  </span>
                  <span>ภาพบรรยากาศการเรียนการสอน ({galleryImages.length} รูป)</span>
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {galleryImages.map((imgPath, idx) => {
                    const thumb = normalizeImageUrl(imgPath, 'thumbnail');
                    const full = normalizeImageUrl(imgPath, 'preview');
                    return (
                      <div
                        key={idx}
                        data-lightbox-src={full}
                        data-lightbox-caption={curr.name}
                        className="group relative aspect-[4/3] rounded-xl sm:rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 cursor-pointer shadow-sm hover:shadow-md transition-all"
                      >
                        <img
                          src={thumb}
                          alt="บรรยากาศการเรียนการสอน"
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="w-10 h-10 rounded-full bg-white/90 text-slate-800 flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-transform">
                            <ZoomIn className="w-5 h-5" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Related Personnel */}
            {relatedPersonnel.length > 0 && (
              <div className="bg-white rounded-none sm:rounded-3xl p-4 sm:p-10 shadow-none sm:shadow-sm border-0 sm:border border-slate-100">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                  <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-3">
                    <span className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </span>
                    <span>บุคลากรประจำสาขาวิชา ({relatedPersonnel.length} ท่าน)</span>
                  </h2>
                  <Link
                    href="/personnel"
                    className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors"
                  >
                    <span>ดูทั้งหมด</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                  {relatedPersonnel.map((tp) => {
                    const isHead = Boolean(tp.is_head || tp.is_executive);
                    const fullName = `${tp.name}${
                      tp.academic_standing ? ` (${tp.academic_standing})` : ''
                    }`;
                    const contact = parseContactInfo(tp.contact_info);

                    return (
                      <div
                        key={tp.id}
                        className="group bg-slate-50/70 hover:bg-white rounded-2xl border border-slate-200/80 hover:border-orange-300 p-4 flex flex-col items-center text-center transition-all hover:shadow-lg relative overflow-hidden"
                      >
                        {isHead && (
                          <div className="absolute top-2 right-2 px-2 py-0.5 bg-orange-600 text-white text-[10px] font-bold rounded-full shadow-sm">
                            หัวหน้าแผนก
                          </div>
                        )}
                        <Link
                          href={`/personnel/${tp.id}`}
                          className="flex flex-col items-center w-full"
                        >
                          <div
                            className={`w-20 h-20 rounded-full overflow-hidden border-2 ${
                              isHead ? 'border-orange-500 ring-2 ring-orange-400/40' : 'border-white'
                            } shadow-md bg-slate-200 mb-3`}
                          >
                            {tp.image_path ? (
                              <img
                                src={normalizeImageUrl(tp.image_path)}
                                alt={tp.name}
                                loading="lazy"
                                className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <User className="w-8 h-8" />
                              </div>
                            )}
                          </div>
                          <h4 className="text-sm font-bold text-slate-800 group-hover:text-orange-600 transition-colors line-clamp-1">
                            {fullName}
                          </h4>
                          <p className="text-xs text-orange-600 font-medium mt-0.5 line-clamp-1">
                            {tp.position}
                          </p>
                          {tp.special_duty && (
                            <span className="mt-1.5 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200/60 rounded-full text-[10px] font-semibold line-clamp-1">
                              {tp.special_duty}
                            </span>
                          )}
                        </Link>

                        {(contact.email || contact.phone) && (
                          <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-100 w-full justify-center">
                            {contact.phone && (
                              <a
                                href={`tel:${contact.phone.replace(/[^0-9+]/g, '')}`}
                                title={`โทร: ${contact.phone}`}
                                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-orange-600 hover:text-white text-slate-600 flex items-center justify-center transition-colors"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {contact.email && (
                              <a
                                href={`mailto:${contact.email}`}
                                title={`อีเมล: ${contact.email}`}
                                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-orange-600 hover:text-white text-slate-600 flex items-center justify-center transition-colors"
                              >
                                <Mail className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <Link
                              href={`/personnel/${tp.id}`}
                              title="ดูประวัติเต็ม"
                              className="w-7 h-7 rounded-full bg-slate-100 hover:bg-orange-600 hover:text-white text-slate-600 flex items-center justify-center transition-colors"
                            >
                              <User className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Sticky Sidebar (1/3) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-none sm:rounded-3xl p-4 sm:p-6 shadow-none sm:shadow-sm border-0 sm:border border-slate-100 sticky top-28 space-y-6">
              <div>
                <h3 className="text-base font-extrabold text-slate-800 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-orange-600" />
                  <span>ข้อมูลสรุปหลักสูตร</span>
                </h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex justify-between py-2 border-b border-slate-50">
                    <span className="text-slate-500">ระดับการศึกษา:</span>
                    <span className="font-bold text-slate-800">
                      {curr.level || '-'}
                    </span>
                  </li>
                  {curr.code && (
                    <li className="flex justify-between py-2 border-b border-slate-50">
                      <span className="text-slate-500">รหัสหลักสูตร:</span>
                      <span className="font-mono font-bold text-orange-600">
                        {curr.code}
                      </span>
                    </li>
                  )}
                  <li className="flex justify-between py-2 border-b border-slate-50">
                    <span className="text-slate-500">ระยะเวลาเรียน:</span>
                    <span className="font-bold text-slate-800">
                      {curr.duration || '-'}
                    </span>
                  </li>
                </ul>
              </div>

              {curr.file_path && (
                <a
                  href={normalizeImageUrl(curr.file_path)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3.5 px-5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm transition-all shadow-lg shadow-orange-600/20"
                >
                  <FileDown className="w-5 h-5" />
                  <span>ดาวน์โหลดโครงสร้างหลักสูตร</span>
                </a>
              )}

              {curr.website_url && (
                <a
                  href={normalizeLinkUrl(curr.website_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2 w-full py-3 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all"
                >
                  <span className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-slate-500" />
                    <span>เว็บไซต์/เพจแผนกวิชา</span>
                  </span>
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                </a>
              )}

              <div className="bg-gradient-to-br from-orange-950 via-slate-900 to-slate-900 rounded-2xl p-5 text-white">
                <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                  <Headphones className="w-4 h-4 text-amber-400" />
                  <span>สนใจสมัครเรียนสาขานี้?</span>
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  ติดต่อสอบถามข้อมูลการรับสมัครเรียน โควตา หรือทุนการศึกษาได้ที่งานทะเบียนและวัดผล
                </p>
                {settings.contact_phone && (
                  <a
                    href={`tel:${settings.contact_phone.replace(
                      /[^0-9+]/g,
                      ''
                    )}`}
                    className="inline-flex items-center gap-2 text-xs font-bold text-amber-300 hover:text-white transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>โทร: {settings.contact_phone}</span>
                  </a>
                )}
              </div>

              <div className="pt-2">
                <Link
                  href="/curriculum"
                  className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500 hover:text-orange-600 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>กลับหน้ารวมหลักสูตรทั้งหมด</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
