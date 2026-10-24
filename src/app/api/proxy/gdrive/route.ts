import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id') || '';
  const size = searchParams.get('size') || 'large';

  if (!id) {
    return new NextResponse('Bad Request: Missing id', { status: 400 });
  }

  const szParam = size === 'thumbnail' ? '=w400' : size === 'preview' ? '=w1440' : '=w1920';
  const etag = `W/"gdrive-${id}-${size}"`;

  // 304 Not Modified check
  if (req.headers.get('if-none-match') === etag) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        ETag: etag,
        'Cache-Control': 'public, max-age=2592000, stale-while-revalidate=86400, immutable',
      },
    });
  }

  const url = `https://lh3.googleusercontent.com/d/${encodeURIComponent(id)}${szParam}`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      next: { revalidate: 604800 },
    });

    if (res.ok) {
      const contentType = res.headers.get('content-type') || 'image/jpeg';
      const buffer = await res.arrayBuffer();
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          ETag: etag,
          'Cache-Control': 'public, max-age=2592000, stale-while-revalidate=86400, immutable',
        },
      });
    }
  } catch (err) {
    console.error('GDrive proxy error:', err);
  }

  return new NextResponse('Not Found', { status: 404 });
}
