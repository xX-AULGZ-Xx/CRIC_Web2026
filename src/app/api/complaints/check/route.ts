import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const ticket = searchParams.get('ticket')?.trim()

    if (!ticket) {
      return NextResponse.json({ error: 'กรุณาระบุเลขที่คำร้อง' }, { status: 400 })
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
    })

    if (!complaint) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลคำร้องตามเลขที่ระบุ' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: complaint,
    })
  } catch (error: any) {
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบ' }, { status: 500 })
  }
}
