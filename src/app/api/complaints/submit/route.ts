import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const title = formData.get('title') as string
    const type = (formData.get('type') as 'corruption' | 'misconduct') || 'corruption'
    const description = formData.get('description') as string
    const accusedName = (formData.get('accused_name') as string) || null
    const incidentDateStr = formData.get('incident_date') as string
    const reporterName = (formData.get('reporter_name') as string) || null
    const reporterEmail = (formData.get('reporter_email') as string) || null
    const reporterPhone = (formData.get('reporter_phone') as string) || null
    const file = formData.get('attachment') as File | null

    if (!title || !description) {
      return NextResponse.json(
        { error: 'กรุณากรอกหัวข้อเรื่องและรายละเอียดการร้องเรียน' },
        { status: 400 }
      )
    }

    let attachmentPath: string | null = null
    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'complaints')
      await mkdir(uploadDir, { recursive: true })

      const ext = path.extname(file.name) || '.pdf'
      const fileName = `complaint_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`
      const filePath = path.join(uploadDir, fileName)

      await writeFile(filePath, buffer)
      attachmentPath = `uploads/complaints/${fileName}`
    }

    // Generate Ticket Number: CMP-YYYYMMDD-XXXX
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const randSuffix = Math.floor(1000 + Math.random() * 9000)
    const ticketNumber = `CMP-${datePrefix}-${randSuffix}`

    let incidentDate: Date | null = null
    if (incidentDateStr) {
      incidentDate = new Date(incidentDateStr)
    }

    const complaint = await prisma.complaints.create({
      data: {
        ticket_number: ticketNumber,
        title,
        type,
        description,
        accused_name: accusedName,
        incident_date: incidentDate,
        reporter_name: reporterName,
        reporter_email: reporterEmail,
        reporter_phone: reporterPhone,
        attachment_path: attachmentPath,
        status: 'pending',
      },
    })

    return NextResponse.json({
      success: true,
      ticket_number: complaint.ticket_number,
    })
  } catch (error: any) {
    console.error('Complaint submit error:', error)
    return NextResponse.json(
      { error: error?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' },
      { status: 500 }
    )
  }
}
