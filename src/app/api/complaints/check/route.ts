import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ticket = (searchParams.get('ticket') || '').trim().toUpperCase();
    if (!ticket) {
      return NextResponse.json(
        { success: false, error: 'กรุณาระบุรหัส Ticket' },
        { status: 400 }
      );
    }

    const complaint = await prisma.complaints.findUnique({
      where: { ticket_number: ticket },
      select: {
        ticket_number: true,
        title: true,
        type: true,
        status: true,
        status_note: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!complaint) {
      return NextResponse.json(
        {
          success: false,
          error: `ไม่พบข้อมูลคำร้องหมายเลข "${ticket}" กรุณาตรวจสอบรหัสอีกครั้ง`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: complaint,
    });
  } catch (err) {
    console.error('Complaint check error:', err);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการตรวจสอบสถานะ' },
      { status: 500 }
    );
  }
}
