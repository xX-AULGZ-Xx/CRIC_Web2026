import type { MetadataRoute } from 'next'
import { getSettings } from '@/lib/settings'

export default async function robots(): Promise<MetadataRoute.Robots> {
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

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/admin/', '/login', '/setup/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
