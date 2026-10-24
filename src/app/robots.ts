import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXTAUTH_URL ||
    'https://cric.ac.th'
  ).replace(/\/+$/, '')

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/admin/', '/login'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
