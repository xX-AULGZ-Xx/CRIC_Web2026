import type { MetadataRoute } from 'next'
import prisma from '@/lib/prisma'
import { getSettings } from '@/lib/settings'

export const revalidate = 86400

function toW3CDate(d: Date | string | null | undefined, fallback: Date): string {
  if (!d) return fallback.toISOString().split('T')[0]
  try {
    const dateObj = typeof d === 'string' ? new Date(d) : d
    if (isNaN(dateObj.getTime())) return fallback.toISOString().split('T')[0]
    return dateObj.toISOString().split('T')[0]
  } catch {
    return fallback.toISOString().split('T')[0]
  }
}

export async function getSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const settings = await getSettings()
  const rawBaseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.SITE_URL ||
    (settings as any)?.site_url ||
    (settings as any)?.website_url ||
    process.env.NEXTAUTH_URL
  const isLocal =
    !rawBaseUrl ||
    rawBaseUrl.includes('localhost') ||
    rawBaseUrl.includes('127.0.0.1')
  let baseUrl = (
    isLocal
      ? (settings as any)?.site_url ||
        (settings as any)?.website_url ||
        'https://www.cric.ac.th'
      : rawBaseUrl
  ).replace(/\/+$/, '')

  // Ensure canonical www subdomain for cric.ac.th
  if (baseUrl === 'https://cric.ac.th' || baseUrl === 'http://cric.ac.th') {
    baseUrl = 'https://www.cric.ac.th'
  }

  const now = new Date()
  const todayStr = toW3CDate(now, now)

  // 1. Static Core Pages (Matches old PHP sitemap.php & new Next.js routes)
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: todayStr,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: todayStr,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/executives`,
      lastModified: todayStr,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/personnel`,
      lastModified: todayStr,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/curriculum`,
      lastModified: todayStr,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/news`,
      lastModified: todayStr,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/gallery`,
      lastModified: todayStr,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/downloads`,
      lastModified: todayStr,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/ita`,
      lastModified: todayStr,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/complaints`,
      lastModified: todayStr,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/sitemap`,
      lastModified: todayStr,
      changeFrequency: 'weekly',
      priority: 0.5,
    },
  ]

  // 2. Dynamic Content from Database
  try {
    const [news, staticPages, curriculums, galleries, depts, personnelList] = await Promise.all([
      prisma.news.findMany({
        where: { status: 'published' },
        select: { id: true, updated_at: true, created_at: true },
        orderBy: { created_at: 'desc' },
        take: 500,
      }),
      prisma.static_pages.findMany({
        where: { slug: { notIn: ['home', ''] } },
        select: { slug: true, updated_at: true },
      }),
      prisma.curriculums.findMany({
        select: { id: true, created_at: true },
        orderBy: { id: 'desc' },
      }),
      prisma.galleries.findMany({
        select: { id: true, created_at: true },
        orderBy: { created_at: 'desc' },
        take: 200,
      }),
      prisma.personnel_categories.findMany({
        select: { id: true, parent_id: true },
        orderBy: [{ order_num: 'asc' }, { id: 'asc' }],
      }),
      prisma.personnel.findMany({
        where: { is_active: true },
        select: { id: true },
        orderBy: { id: 'desc' },
        take: 500,
      }),
    ])

    const newsUrls: MetadataRoute.Sitemap = news.map((item) => ({
      url: `${baseUrl}/news/${item.id}`,
      lastModified: toW3CDate(item.updated_at || item.created_at, now),
      changeFrequency: 'weekly',
      priority: 0.6,
    }))

    const pageUrls: MetadataRoute.Sitemap = staticPages.map((page) => ({
      url: `${baseUrl}/${encodeURIComponent(page.slug)}`,
      lastModified: toW3CDate(page.updated_at, now),
      changeFrequency: 'monthly',
      priority: 0.7,
    }))

    const curriculumUrls: MetadataRoute.Sitemap = curriculums.map((c) => ({
      url: `${baseUrl}/curriculum/${c.id}`,
      lastModified: toW3CDate(c.created_at, now),
      changeFrequency: 'monthly',
      priority: 0.6,
    }))

    const galleryUrls: MetadataRoute.Sitemap = galleries.map((g) => ({
      url: `${baseUrl}/gallery/${g.id}`,
      lastModified: toW3CDate(g.created_at, now),
      changeFrequency: 'monthly',
      priority: 0.6,
    }))

    const deptUrls: MetadataRoute.Sitemap = depts.map((d) => ({
      url: d.parent_id
        ? `${baseUrl}/personnel/sub-dept/${d.id}`
        : `${baseUrl}/personnel/dept/${d.id}`,
      lastModified: todayStr,
      changeFrequency: 'weekly',
      priority: 0.6,
    }))

    const personnelUrls: MetadataRoute.Sitemap = personnelList.map((p) => ({
      url: `${baseUrl}/personnel/${p.id}`,
      lastModified: todayStr,
      changeFrequency: 'monthly',
      priority: 0.5,
    }))

    return [
      ...staticRoutes,
      ...pageUrls,
      ...newsUrls,
      ...curriculumUrls,
      ...galleryUrls,
      ...deptUrls,
      ...personnelUrls,
    ]
  } catch (err) {
    console.error('Error generating dynamic sitemap:', err)
    return staticRoutes
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return getSitemapEntries()
}
