import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import path from 'path';
import fs from 'fs/promises';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const typeRaw = String(formData.get('type') || 'corruption');
    const type = typeRaw === 'misconduct' ? 'misconduct' : 'corruption';
    const title = String(formData.get('title') || '').trim();
    const description = String(formData.get('description') || '').trim();
    const accusedName = String(formData.get('accused_name') || '').trim() || null;
    const incidentDateStr = String(formData.get('incident_date') || '').trim();
    const reporterName = String(formData.get('reporter_name') || '').trim() || null;
    const reporterPhone = String(formData.get('reporter_phone') || '').trim() || null;
    const reporterEmail = String(formData.get('reporter_email') || '').trim() || null;
    const attachment = formData.get('attachment') as File | null;

    if (!title || !description) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกหัวข้อเรื่องและรายละเอียดให้ครบถ้วน' },
        { status: 400 }
      );
    }

    let attachmentPath: string | null = null;
    if (attachment && attachment.size > 0) {
      const ext = path.extname(attachment.name).toLowerCase();
      const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.doc', '.docx', '.zip'];
      if (!allowed.includes(ext)) {
        return NextResponse.json(
          { success: false, error: 'ชนิดไฟล์แนบไม่รองรับ' },
          { status: 400 }
        );
      }
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'complaints');
      await fs.mkdir(uploadDir, { recursive: true });
      const filename = `cmp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
      const fullPath = path.join(uploadDir, filename);
      const buffer = Buffer.from(await attachment.arrayBuffer());
      await fs.writeFile(fullPath, buffer);
      attachmentPath = `uploads/complaints/${filename}`;
    }

    const now = new Date();
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const randPart = String(Math.floor(1000 + Math.random() * 9000));
    const ticketNumber = `CMP-${datePart}-${randPart}`;

    const incidentDate = incidentDateStr ? new Date(incidentDateStr) : null;

    await prisma.complaints.create({
      data: {
        ticket_number: ticketNumber,
        type,
        title,
        description,
        accused_name: accusedName,
        incident_date: incidentDate && !isNaN(incidentDate.getTime()) ? incidentDate : null,
        reporter_name: reporterName,
        reporter_phone: reporterPhone,
        reporter_email: reporterEmail,
        attachment_path: attachmentPath,
        status: 'pending',
        is_published: false,
      },
    });

    return NextResponse.json({
      success: true,
      ticket_number: ticketNumber,
    });
  } catch (err) {
    console.error('Complaint submit error:', err);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' },
      { status: 500 }
    );
  }
}
