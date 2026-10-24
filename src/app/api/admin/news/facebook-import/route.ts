import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import path from 'path'
import fs from 'fs/promises'

function decodeHtmlEntities(text: string): string {
  if (!text) return ''
  let prev = ''
  let current = String(text)
  let passes = 0

  while (current !== prev && passes < 5) {
    prev = current
    passes++

    current = current
      // 1. Hexadecimal numeric entities (e.g. &#xe27; or &#x0e27; or &#x27;)
      .replace(/&#x([0-9a-fA-F]+);?/gi, (_, hex) => {
        try {
          return String.fromCharCode(parseInt(hex, 16))
        } catch {
          return _
        }
      })
      // 2. Decimal numeric entities (e.g. &#3623; or &#39;)
      .replace(/&#([0-9]+);?/g, (_, dec) => {
        try {
          return String.fromCharCode(parseInt(dec, 10))
        } catch {
          return _
        }
      })
      // 3. Named entities
      .replace(/&quot;/gi, '"')
      .replace(/&apos;/gi, "'")
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&hellip;/gi, '...')
      .replace(/&copy;/gi, '©')
      .replace(/&amp;/gi, '&')
  }

  return current
}

function extractMeta(html: string, nameOrProperty: string): string {
  const regex = new RegExp(
    `<meta[^>]*(?:name|property)=["']${nameOrProperty}["'][^>]*content=["']([^"']*)["']|<meta[^>]*content=["']([^"']*)["'][^>]*(?:name|property)=["']${nameOrProperty}["']`,
    'i'
  )
  const match = html.match(regex)
  if (match) {
    const val = match[1] || match[2] || ''
    return decodeHtmlEntities(val)
  }
  return ''
}

function safeJsonDecode(str: string): string {
  try {
    const parsed = JSON.parse(`"${str}"`)
    return decodeHtmlEntities(parsed)
  } catch {
    const unescaped = str
      .replace(/\\"/g, '"')
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '')
      .replace(/\\t/g, '\t')
      .replace(/\\u([0-9a-fA-F]{4})/g, (_, code) =>
        String.fromCharCode(parseInt(code, 16))
      )
    return decodeHtmlEntities(unescaped)
  }
}

// 0. GET: PROXY IMAGE TO PREVENT FACEBOOK CDN 403 FORBIDDEN
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')
  const imageUrl = searchParams.get('url')

  if (action === 'proxy_image' && imageUrl) {
    try {
      const decodedUrl = decodeURIComponent(imageUrl)
      if (!decodedUrl.startsWith('http://') && !decodedUrl.startsWith('https://')) {
        return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
      }

      const imgRes = await fetch(decodedUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)',
          Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(12000),
      })

      if (!imgRes.ok) {
        return NextResponse.json(
          { error: `Upstream error: ${imgRes.status}` },
          { status: imgRes.status }
        )
      }

      const contentType = imgRes.headers.get('content-type') || 'image/jpeg'
      const imageBuffer = await imgRes.arrayBuffer()

      return new NextResponse(imageBuffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        },
      })
    } catch (err: any) {
      return NextResponse.json(
        { error: err?.message || 'Failed to proxy image' },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { action, url, title, content, images, cover_image } = body

    // 1. PREVIEW FACEBOOK POST
    if (action === 'preview') {
      if (!url || typeof url !== 'string') {
        return NextResponse.json(
          { error: 'กรุณาระบุ URL โพสต์ Facebook' },
          { status: 400 }
        )
      }

      const cleanUrl = url.trim()
      let html = ''

      // Attempt 1: Facebook Bot UA
      try {
        const res = await fetch(cleanUrl, {
          headers: {
            'User-Agent':
              'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
            Accept:
              'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'th,en-US;q=0.9,en;q=0.8',
          },
          redirect: 'follow',
          signal: AbortSignal.timeout(14000),
        })
        if (res.ok) {
          html = await res.text()
        }
      } catch (err: any) {
        // Fallback below
      }

      // Attempt 2: Fallback Desktop User Agent if attempt 1 was empty or blocked
      if (!html || html.length < 500 || (!html.includes('og:title') && !html.includes('og:description'))) {
        try {
          const res = await fetch(cleanUrl, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
              Accept:
                'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Accept-Language': 'th,en-US;q=0.9,en;q=0.8',
            },
            redirect: 'follow',
            signal: AbortSignal.timeout(14000),
          })
          if (res.ok) {
            html = await res.text()
          }
        } catch {
          // Ignore
        }
      }

      if (!html || html.length < 200) {
        return NextResponse.json(
          {
            error:
              'ไม่สามารถเชื่อมต่อไปยัง Facebook ได้ หรือโพสต์อาจถูกตั้งค่าความเป็นส่วนตัว/จำกัดสิทธิ์การเข้าถึง',
          },
          { status: 400 }
        )
      }

      let parsedTitle = extractMeta(html, 'og:title')
      let parsedDesc =
        extractMeta(html, 'og:description') || extractMeta(html, 'description')
      const ogImage = extractMeta(html, 'og:image')

      // Extract full text from JSON payloads if available (avoids 100-character description cutoffs)
      let fullContent = ''

      // Strategy A: articleBody
      const articleBodyMatch = html.match(/"articleBody"\s*:\s*"((?:[^"\\]|\\.)*)"/i)
      if (articleBodyMatch && articleBodyMatch[1]) {
        const decoded = safeJsonDecode(articleBodyMatch[1])
        if (decoded && decoded.length > fullContent.length) {
          fullContent = decoded
        }
      }

      // Strategy B: "message":{"text":"..."}
      const messageMatch = html.match(
        /"message"\s*:\s*\{\s*"text"\s*:\s*"((?:[^"\\]|\\.)*)"/i
      )
      if (messageMatch && messageMatch[1]) {
        const decoded = safeJsonDecode(messageMatch[1])
        if (decoded && decoded.length > fullContent.length) {
          fullContent = decoded
        }
      }

      // Strategy C: general "text":"..."
      const allTextMatches = html.matchAll(/"text"\s*:\s*"((?:[^"\\]|\\.)*)"/gi)
      for (const tm of allTextMatches) {
        if (tm[1] && tm[1].length > fullContent.length && tm[1].length > 30) {
          const decoded = safeJsonDecode(tm[1])
          // Ignore JSON system strings
          if (
            decoded &&
            !decoded.includes('__typename') &&
            !decoded.includes('viewer') &&
            decoded.length > fullContent.length
          ) {
            fullContent = decoded
          }
        }
      }

      // Clean content
      let finalContent =
        fullContent && fullContent.length >= parsedDesc.length
          ? fullContent
          : parsedDesc
      finalContent = decodeHtmlEntities(finalContent).trim()

      // Clean Title
      let cleanTitle = decodeHtmlEntities(parsedTitle).trim()
      cleanTitle = cleanTitle
        .replace(/\s*[-|–—]\s*(Home|Facebook|หน้าหลัก).*$/i, '')
        .replace(/^['"“‘\s]+|['"”’\s]+$/g, '')
        .trim()

      // If title is empty, generic, login prompt, or page name, derive from content
      const isGenericTitle =
        !cleanTitle ||
        cleanTitle.toLowerCase() === 'facebook' ||
        cleanTitle.length < 4 ||
        cleanTitle.includes('เข้าสู่ระบบหรือสมัคร') ||
        cleanTitle.includes('Log in or sign up') ||
        cleanTitle === 'วิทยาลัยการอาชีพเชียงคำ'

      if (isGenericTitle && finalContent) {
        const cleanExcerpt = finalContent
          .replace(/\s+/g, ' ')
          .replace(/<[^>]*>/g, '')
          .trim()
        if (cleanExcerpt) {
          cleanTitle =
            cleanExcerpt.slice(0, 95) + (cleanExcerpt.length > 95 ? '...' : '')
        }
      }

      if (!cleanTitle) {
        cleanTitle = 'ข่าวประชาสัมพันธ์จาก Facebook'
      }

      // Image Extraction: support fbcdn.net and fbsbx.com (including escaped slashes and \u0026)
      const foundImages: string[] = []

      if (ogImage && ogImage.startsWith('http')) {
        let cleanOg = ogImage.replace(/\\/g, '')
        cleanOg = decodeHtmlEntities(cleanOg)
        if (!foundImages.includes(cleanOg)) {
          foundImages.push(cleanOg)
        }
      }

      // Match all CDN image URLs in HTML
      const cdnRegex =
        /https?:(?:\\\/|\/)(?:\\\/|\/)[a-z0-9\.-]+\.(?:fbcdn\.net|fbsbx\.com)\/[^\s"'\)<>]+/gi
      const matches = html.match(cdnRegex) || []

      for (let rawMatch of matches) {
        // Normalize slashes
        let clean = rawMatch.replace(/\\\/|\//g, '/')
        // Fix JSON escaped unicode ampersands
        clean = clean.replace(/\\u0026/g, '&').replace(/&amp;/g, '&')
        clean = clean.replace(/\\"/g, '').replace(/\\'/g, '').replace(/\\+$/, '')
        clean = decodeHtmlEntities(clean)

        // Filter out Facebook web icons, emojis, tracking assets
        const lower = clean.toLowerCase()
        if (
          lower.includes('static.xx.fbcdn.net') ||
          lower.includes('/rsrc.php/') ||
          lower.includes('emoji') ||
          lower.includes('/cp/') ||
          lower.includes('/assets/') ||
          lower.includes('favicon')
        ) {
          continue
        }

        // Only keep valid image extensions or media paths
        if (
          /\.(png|jpg|jpeg|webp|gif)/i.test(clean) ||
          clean.includes('/v/') ||
          clean.includes('oe=') ||
          clean.includes('_nc_cat=')
        ) {
          if (!foundImages.includes(clean) && foundImages.length < 30) {
            foundImages.push(clean)
          }
        }
      }

      return NextResponse.json({
        success: true,
        title: cleanTitle,
        content: finalContent || '',
        images: foundImages,
      })
    }

    // 2. CONFIRM & DOWNLOAD IMAGES TO LOCAL STORAGE
    if (action === 'download_images') {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'news')
      await fs.mkdir(uploadDir, { recursive: true })

      const downloadHelper = async (
        imgUrl: string,
        prefix: string
      ): Promise<string | null> => {
        try {
          const resp = await fetch(imgUrl, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)',
              Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            },
            signal: AbortSignal.timeout(15000),
          })

          if (!resp.ok) return null

          const contentType = resp.headers.get('content-type') || ''
          let ext = 'jpg'
          if (contentType.includes('png') || /\.png/i.test(imgUrl)) ext = 'png'
          else if (contentType.includes('webp') || /\.webp/i.test(imgUrl)) ext = 'webp'
          else if (contentType.includes('gif') || /\.gif/i.test(imgUrl)) ext = 'gif'

          const buffer = Buffer.from(await resp.arrayBuffer())
          const filename = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`
          const filePath = path.join(uploadDir, filename)
          await fs.writeFile(filePath, buffer)
          return `uploads/news/${filename}`
        } catch {
          return null
        }
      }

      let downloadedCover: string | null = null
      const downloadedAdditional: string[] = []

      // If specific cover image is designated
      if (cover_image && typeof cover_image === 'string') {
        downloadedCover = await downloadHelper(cover_image, 'fb_cover')
      }

      // Additional images
      const imgList: string[] = Array.isArray(images) ? images : []
      for (const imgUrl of imgList) {
        if (!imgUrl) continue
        // If no cover was downloaded yet and this is the first image, use as cover
        if (!downloadedCover && !cover_image) {
          downloadedCover = await downloadHelper(imgUrl, 'fb_cover')
        } else {
          const addPath = await downloadHelper(imgUrl, 'fb_add')
          if (addPath) {
            downloadedAdditional.push(addPath)
          }
        }
      }

      return NextResponse.json({
        success: true,
        cover_image: downloadedCover,
        additional_images: downloadedAdditional,
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
