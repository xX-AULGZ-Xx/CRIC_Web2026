import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import path from 'path';
import fs from 'fs/promises';

const ALLOWED_EXTS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.svg',
  '.webp',
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.zip',
];

function buildCallbackHtml(funcNum: string, url: string, message: string) {
  const safeUrl = url.replace(/'/g, "\\'");
  const safeMsg = message.replace(/'/g, "\\'");
  return `<script type="text/javascript">window.parent.CKEDITOR.tools.callFunction(${Number(funcNum) || 0}, '${safeUrl}', '${safeMsg}');</script>`;
}

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const funcNum = searchParams.get('CKEditorFuncNum');

  try {
    const session = await getSession();
    if (!session) {
      if (funcNum !== null) {
        return new NextResponse(buildCallbackHtml(funcNum, '', 'กรุณาเข้าสู่ระบบก่อนอัปโหลดไฟล์'), {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }
      return NextResponse.json(
        { uploaded: 0, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = (formData.get('upload') || formData.get('file')) as File | null;

    if (!file || file.size === 0) {
      const msg = 'ไม่พบไฟล์ที่อัปโหลด หรือเกิดข้อผิดพลาด';
      if (funcNum !== null) {
        return new NextResponse(buildCallbackHtml(funcNum, '', msg), {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }
      return NextResponse.json({ uploaded: 0, error: { message: msg } });
    }

    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTS.includes(ext)) {
      const msg = `ไม่รองรับนามสกุลไฟล์ ${ext}`;
      if (funcNum !== null) {
        return new NextResponse(buildCallbackHtml(funcNum, '', msg), {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }
      return NextResponse.json({ uploaded: 0, error: { message: msg } });
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });

    const safeBase = path
      .basename(file.name, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 50);
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${safeBase}${ext}`;
    const fullPath = path.join(uploadDir, fileName);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(fullPath, buffer);

    const relativePath = `uploads/${fileName}`;
    const publicUrl = `/${relativePath}`;

    try {
      const media = await prisma.media.create({
        data: {
          file_name: file.name,
          file_path: relativePath,
          file_type: file.type || ext.replace('.', ''),
          file_size: file.size,
          uploaded_by: Number(session.id) || 1,
        },
      });
      if (session.id) {
        await prisma.audit_logs.create({
          data: {
            user_id: Number(session.id),
            action: 'CREATE',
            target_type: 'media',
            target_id: media.id,
            details: `Uploaded file via CKEditor: ${file.name}`,
          },
        });
      }
    } catch {
      // Ignore DB log error
    }

    if (funcNum !== null) {
      return new NextResponse(buildCallbackHtml(funcNum, publicUrl, ''), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    return NextResponse.json({
      uploaded: 1,
      fileName: file.name,
      url: publicUrl,
    });
  } catch (err: any) {
    const msg = err?.message || 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์';
    if (funcNum !== null) {
      return new NextResponse(buildCallbackHtml(funcNum, '', msg), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }
    return NextResponse.json({ uploaded: 0, error: { message: msg } });
  }
}
