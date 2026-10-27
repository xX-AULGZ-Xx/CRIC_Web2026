import { getSitemapEntries } from '@/app/sitemap'

export const revalidate = 86400

export async function GET() {
  const entries = await getSitemapEntries()

  const xmlUrls = entries
    .map((e) => {
      const loc = `<loc>${e.url}</loc>`
      const lastmod = e.lastModified ? `\n    <lastmod>${e.lastModified}</lastmod>` : ''
      const changefreq = e.changeFrequency
        ? `\n    <changefreq>${e.changeFrequency}</changefreq>`
        : ''
      const priority =
        typeof e.priority === 'number'
          ? `\n    <priority>${e.priority.toFixed(1)}</priority>`
          : ''

      return `  <url>\n    ${loc}${lastmod}${changefreq}${priority}\n  </url>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlUrls}
</urlset>
`

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=43200',
      'X-Robots-Tag': 'all',
    },
  })
}
