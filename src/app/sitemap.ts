import type { MetadataRoute } from 'next'
import prisma from '@/lib/prisma'
import { getSettings } from '@/lib/settings'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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

  // 1. Static Core Pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/executives`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/personnel`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/curriculum`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/news`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/gallery`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/downloads`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/ita`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/complaints`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/sitemap`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ]

  // 2. Dynamic Content from Database
  try {
    const [news, staticPages, curriculums, galleries, depts] = await Promise.all([
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
      }),
      prisma.galleries.findMany({
        select: { id: true, created_at: true },
        orderBy: { created_at: 'desc' },
        take: 200,
      }),
      prisma.personnel_categories.findMany({
        select: { id: true, parent_id: true },
      }),
    ])

    const newsUrls: MetadataRoute.Sitemap = news.map((item) => ({
      url: `${baseUrl}/news/${item.id}`,
      lastModified: item.updated_at || item.created_at || now,
      changeFrequency: 'weekly',
      priority: 0.7,
    }))

    const pageUrls: MetadataRoute.Sitemap = staticPages.map((page) => ({
      url: `${baseUrl}/${encodeURIComponent(page.slug)}`,
      lastModified: page.updated_at || now,
      changeFrequency: 'monthly',
      priority: 0.8,
    }))

    const curriculumUrls: MetadataRoute.Sitemap = curriculums.map((c) => ({
      url: `${baseUrl}/curriculum/${c.id}`,
      lastModified: c.created_at || now,
      changeFrequency: 'monthly',
      priority: 0.8,
    }))

    const galleryUrls: MetadataRoute.Sitemap = galleries.map((g) => ({
      url: `${baseUrl}/gallery/${g.id}`,
      lastModified: g.created_at || now,
      changeFrequency: 'monthly',
      priority: 0.6,
    }))

    const deptUrls: MetadataRoute.Sitemap = depts.map((d) => ({
      url: d.parent_id
        ? `${baseUrl}/personnel/sub-dept/${d.id}`
        : `${baseUrl}/personnel/dept/${d.id}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    }))

    return [
      ...staticRoutes,
      ...pageUrls,
      ...newsUrls,
      ...curriculumUrls,
      ...galleryUrls,
      ...deptUrls,
    ]
  } catch (err) {
    console.error('Error generating dynamic sitemap:', err)
    return staticRoutes
  }
}
