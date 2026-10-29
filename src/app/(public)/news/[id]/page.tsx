import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import {
  normalizeHtmlContent,
  normalizeImageUrl,
} from '@/lib/url-helper';
import NewsShareButtons from '@/components/public/NewsShareButtons';
import NewsGalleryViewer from '@/components/public/NewsGalleryViewer';
import {
  Calendar,
  Eye,
  User,
  Clock,
  ArrowLeft,
  FileText,
  Download,
  Image as ImageIcon,
  Camera,
  Tag,
  ChevronRight,
  Home,
  Zap,
} from 'lucide-react';

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

function formatDateTime(date: Date | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const day = d.getDate();
  const month = THAI_MONTHS_SHORT[d.getMonth()] || '';
  const year = d.getFullYear() + 543;
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year} เวลา ${hh}:${mm} น.`;
}

function formatDateShort(date: Date | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return `${d.getDate()} ${THAI_MONTHS_SHORT[d.getMonth()] || ''} ${
    d.getFullYear() + 543
  }`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id: rawIdOrSlug } = await params;
  const decoded = decodeURIComponent(rawIdOrSlug);
  const numericId = /^\d+$/.test(decoded) ? parseInt(decoded, 10) : null;

  const article = await prisma.news.findFirst({
    where: {
      status: 'published',
      OR: [
        { slug: decoded },
        ...(numericId !== null ? [{ id: numericId }] : []),
      ],
    },
    select: {
      id: true,
      title: true,
      content: true,
      cover_image: true,
      meta_title: true,
      created_at: true,
      updated_at: true,
    },
  });

  if (!article) {
    return {
      title: 'ข่าวประชาสัมพันธ์',
    };
  }

  const plainText = (article.content || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const description =
    plainText.slice(0, 160) ||
    'ข่าวประชาสัมพันธ์และกิจกรรม วิทยาลัยการอาชีพเชียงราย';

  const title = article.meta_title || article.title;
  const canonicalUrl = `https://www.cric.ac.th/news/${article.id}`;
  const ogImage = article.cover_image
    ? normalizeImageUrl(article.cover_image)
    : 'https://www.cric.ac.th/uploads/file_6a27706c88d814.68152088.webp';

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'วิทยาลัยการอาชีพเชียงราย',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: 'article',
      publishedTime: article.created_at ? article.created_at.toISOString() : undefined,
      modifiedTime: (article.updated_at || article.created_at)?.toISOString(),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawIdOrSlug } = await params;
  const decoded = decodeURIComponent(rawIdOrSlug);
  const numericId = /^\d+$/.test(decoded) ? parseInt(decoded, 10) : null;

  let article = await prisma.news.findFirst({
    where: {
      status: 'published',
      OR: [
        { slug: decoded },
        ...(numericId !== null ? [{ id: numericId }] : []),
      ],
    },
    include: {
      news_categories: true,
      users: {
        select: { username: true },
      },
      news_tags: true,
      galleries: {
        include: {
          gallery_images: {
            orderBy: { id: 'desc' },
          },
        },
      },
    },
  });

  if (!article) {
    notFound();
  }

  // Increment views
  try {
    await prisma.news.update({
      where: { id: article.id },
      data: { views: { increment: 1 } },
    });
    article = {
      ...article,
      views: (article.views || 0) + 1,
    };
  } catch {
    // Ignore view increment error
  }

  const [relatedNews, categories] = await Promise.all([
    prisma.news.findMany({
      where: {
        status: 'published',
        id: { not: article.id },
      },
      orderBy: { created_at: 'desc' },
      take: 4,
      select: {
        id: true,
        title: true,
        slug: true,
        cover_image: true,
        cover_position: true,
        created_at: true,
      },
    }),
    prisma.news_categories.findMany({
      orderBy: { id: 'asc' },
    }),
  ]);

  let additionalImages: string[] = [];
  if (article.additional_images) {
    const raw = article.additional_images.trim();
    if (raw.startsWith('[') && raw.endsWith(']')) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          additionalImages = parsed.map((s) => String(s).trim()).filter(Boolean);
        }
      } catch {
        // Fallback to split below
      }
    }
    if (additionalImages.length === 0 && raw) {
      additionalImages = raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }

  const linkedGallery = article.galleries || null;

  const posClass =
    article.cover_position === 'top'
      ? 'object-top'
      : article.cover_position === 'bottom'
      ? 'object-bottom'
      : 'object-center';

  const pdfUrl = article.pdf_path ? normalizeImageUrl(article.pdf_path) : '';

  const newsArticleSchema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://www.cric.ac.th/news/${article.id}`,
    },
    headline: article.title,
    image: article.cover_image
      ? [normalizeImageUrl(article.cover_image)]
      : ['https://www.cric.ac.th/uploads/file_6a27706c88d814.68152088.webp'],
    datePublished: article.created_at ? article.created_at.toISOString() : undefined,
    dateModified: (article.updated_at || article.created_at)?.toISOString(),
    author: {
      '@type': 'Organization',
      name: 'วิทยาลัยการอาชีพเชียงราย',
      url: 'https://www.cric.ac.th',
    },
    publisher: {
      '@type': 'EducationalOrganization',
      name: 'วิทยาลัยการอาชีพเชียงราย',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.cric.ac.th/uploads/file_6a27706c88d814.68152088.webp',
      },
    },
    description: (article.content || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 200),
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
        name: 'ข่าวประชาสัมพันธ์',
        item: 'https://www.cric.ac.th/news',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: article.title,
        item: `https://www.cric.ac.th/news/${article.id}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(newsArticleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {/* Breadcrumb Bar */}
      <div className="bg-slate-50 border-b border-slate-200/80 py-3.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 text-xs text-slate-500 overflow-x-auto whitespace-nowrap">
          <Link
            href="/"
            className="hover:text-orange-600 transition-colors flex items-center gap-1"
          >
            <Home className="w-3.5 h-3.5" /> หน้าแรก
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <Link href="/news" className="hover:text-orange-600 transition-colors">
            ข่าวประชาสัมพันธ์
          </Link>
          {article.news_categories && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <Link
                href={`/news?category=${encodeURIComponent(
                  article.news_categories.slug
                )}`}
                className="hover:text-orange-600 transition-colors"
              >
                {article.news_categories.name}
              </Link>
            </>
          )}
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-800 font-medium truncate max-w-xs md:max-w-md">
            {article.title}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 py-4 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-10">
          {/* Article Column */}
          <div className="lg:col-span-2">
            <article className="bg-white rounded-none sm:rounded-3xl shadow-none sm:shadow-xs border-0 sm:border border-slate-200/80 overflow-hidden">
              {article.cover_image && (
                <div className="w-full aspect-video bg-slate-100 relative overflow-hidden">
                  <img
                    src={normalizeImageUrl(article.cover_image, 'preview')}
                    alt={article.title}
                    data-lightbox-src={normalizeImageUrl(
                      article.cover_image,
                      'preview'
                    )}
                    data-lightbox-caption={article.title}
                    style={{ objectPosition: `center ${article.cover_position || '50%'}` }}
                    className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-500"
                  />
                </div>
              )}

              <div className="p-4 sm:p-10">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-700">
                    {article.news_categories?.name || 'ข่าวทั่วไป'}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {formatDateTime(article.created_at)}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    {article.users?.username || 'ผู้ดูแลระบบ'}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                    {(article.views || 0).toLocaleString()} ครั้ง
                  </span>
                  <div className="ml-auto hidden sm:block">
                    <NewsShareButtons title={article.title} />
                  </div>
                </div>

                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-800 leading-tight mb-8">
                  {article.title}
                </h1>

                <div
                  className="prose prose-slate prose-orange max-w-none text-slate-600 leading-relaxed space-y-4 overflow-x-auto break-words"
                  dangerouslySetInnerHTML={{
                    __html: normalizeHtmlContent(article.content),
                  }}
                />

                {/* Embedded PDF Document */}
                {pdfUrl && (
                  <div className="mt-10 pt-8 border-t border-slate-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 bg-rose-50/70 p-4 rounded-2xl border border-rose-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center text-lg shadow-sm shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-slate-800">
                            เอกสารแนบ (PDF)
                          </h3>
                          <p className="text-xs text-slate-500">
                            สามารถอ่านเอกสารได้จากหน้าต่างด้านล่าง หรือคลิกปุ่มดาวน์โหลด
                          </p>
                        </div>
                      </div>
                      <a
                        href={pdfUrl}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-rose-600/20 shrink-0"
                      >
                        <Download className="w-4 h-4" /> ดาวน์โหลดเอกสาร PDF
                      </a>
                    </div>
                    <div className="w-full h-[600px] sm:h-[750px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-inner">
                      <iframe
                        src={`${pdfUrl}#toolbar=1&navpanes=0&scrollbar=1`}
                        className="w-full h-full border-0"
                        title="PDF Document Viewer"
                      ></iframe>
                    </div>
                  </div>
                )}

                {/* Linked Activity Gallery */}
                {linkedGallery &&
                  linkedGallery.gallery_images &&
                  linkedGallery.gallery_images.length > 0 && (
                    <NewsGalleryViewer
                      title={`อัลบั้มภาพกิจกรรม: ${linkedGallery.title}`}
                      subtitle={
                        linkedGallery.description ||
                        'ประมวลภาพกิจกรรมที่เกี่ยวข้องกับข่าวนี้'
                      }
                      images={linkedGallery.gallery_images.map((g) => g.image_path)}
                      galleryLink={{
                        href: `/gallery?album=${linkedGallery.id}`,
                        label: `ดูภาพกิจกรรมทั้งหมด (${linkedGallery.gallery_images.length} รูป)`,
                      }}
                      initialLimit={8}
                    />
                  )}

                {/* Additional Images Gallery */}
                {additionalImages.length > 0 && (
                  <NewsGalleryViewer
                    title="ภาพกิจกรรมเพิ่มเติม"
                    subtitle="ประมวลภาพกิจกรรมประชาสัมพันธ์เพิ่มเติม"
                    images={additionalImages}
                    initialLimit={8}
                  />
                )}

                {/* Article Tags */}
                {article.news_tags.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-orange-500" /> ป้ายกำกับ:
                    </span>
                    {article.news_tags.map((nt) => (
                      <Link
                        key={nt.tag_name}
                        href={`/news?tag=${encodeURIComponent(nt.tag_name)}`}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 hover:bg-orange-600 text-slate-600 hover:text-white text-xs font-semibold transition-colors"
                      >
                        #{nt.tag_name}
                      </Link>
                    ))}
                  </div>
                )}

                <div className="mt-12 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
                  <Link
                    href="/news"
                    className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-orange-600 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" /> กลับหน้ารวมข่าวสาร
                  </Link>
                  <NewsShareButtons title={article.title} />
                </div>
              </div>
            </article>
          </div>

          {/* Sidebar: Related News & Categories */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-none sm:rounded-3xl p-4 sm:p-6 shadow-none sm:shadow-xs border-0 sm:border border-slate-200/80 sticky top-28 space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" /> ข่าวสารล่าสุดอื่นๆ
                </h3>
                <div className="space-y-4 mt-4">
                  {relatedNews.map((rel) => {
                    const relHref = `/news/${encodeURIComponent(
                      rel.slug || String(rel.id)
                    )}`;
                    return (
                      <Link
                        key={rel.id}
                        href={relHref}
                        className="group flex gap-3.5 items-start"
                      >
                        <div className="w-18 h-18 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100">
                          {rel.cover_image ? (
                            <img
                              src={normalizeImageUrl(rel.cover_image, 'thumbnail')}
                              alt={rel.title}
                              loading="lazy"
                              style={{
                                objectPosition: `center ${rel.cover_position || '50%'}`,
                              }}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <ImageIcon className="w-6 h-6 opacity-30" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-slate-800 group-hover:text-orange-600 transition-colors line-clamp-2 leading-snug mb-1">
                            {rel.title}
                          </h4>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                            <Clock className="w-3 h-3 text-slate-400" />{' '}
                            {formatDateShort(rel.created_at)}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  หมวดหมู่ข่าวสาร
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/news?category=${encodeURIComponent(cat.slug)}`}
                      className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-orange-50 text-slate-600 hover:text-orange-600 text-xs font-medium transition-colors border border-slate-200/60"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
