import { NextRequest, NextResponse } from 'next/server';
import { getSettings } from '@/lib/settings';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const assetId = searchParams.get('id') || '';
  const size = searchParams.get('size') || 'large';

  if (!assetId) {
    return new NextResponse('Bad Request: Missing id', { status: 400 });
  }

  const settings = await getSettings();
  const serverUrl = (settings.immich_server_url || '').replace(/\/+$/, '');
  const apiKey = settings.immich_api_key || '';

  if (!serverUrl || !apiKey) {
    return new NextResponse('Immich server not configured', { status: 500 });
  }

  // Map 'large' to 'preview' for Immich v1.106+ compatibility, fallback to original if needed
  const immichSize = size === 'thumbnail' ? 'thumbnail' : 'preview';
  const etag = `W/"immich-${assetId}-${immichSize}"`;

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

  try {
    const thumbUrl = `${serverUrl}/api/assets/${encodeURIComponent(assetId)}/thumbnail?size=${encodeURIComponent(immichSize)}`;
    const res = await fetch(thumbUrl, {
      headers: { 'x-api-key': apiKey },
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

    // Fallback to original asset
    const origUrl = `${serverUrl}/api/assets/${encodeURIComponent(assetId)}/original`;
    const origRes = await fetch(origUrl, {
      headers: { 'x-api-key': apiKey },
      next: { revalidate: 604800 },
    });

    if (origRes.ok) {
      const contentType = origRes.headers.get('content-type') || 'image/jpeg';
      const buffer = await origRes.arrayBuffer();
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
    console.error('Immich proxy error:', err);
  }

  return new NextResponse('Not Found', { status: 404 });
}
