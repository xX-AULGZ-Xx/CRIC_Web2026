import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const downloadId = parseInt(id, 10);
    if (isNaN(downloadId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    await prisma.downloads.update({
      where: { id: downloadId },
      data: {
        downloads_count: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Track download error:', err);
    return NextResponse.json({ error: 'Failed to track download' }, { status: 500 });
  }
}
