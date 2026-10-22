import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession, logAudit } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { settings } = await req.json()

    // Upsert all settings key-values
    const updates = Object.entries(settings).map(([key, val]) =>
      prisma.settings.upsert({
        where: { setting_key: key },
        update: { setting_value: String(val) },
        create: { setting_key: key, setting_value: String(val) },
      })
    )

    await prisma.$transaction(updates)
    await logAudit('update', 'settings', undefined, 'Updated site settings')

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error' }, { status: 500 })
  }
}
