import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession, logAudit } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, status, status_note } = await req.json()

    const updated = await prisma.complaints.update({
      where: { id },
      data: {
        status,
        status_note,
        updated_at: new Date(),
      },
    })

    await logAudit(
      'update_complaint',
      'complaints',
      id,
      `Status changed to ${status} for ticket ${updated.ticket_number}`
    )

    return NextResponse.json({ success: true, complaint: updated })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error' }, { status: 500 })
  }
}
