import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession, logAudit } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, id, status, title, category_id, content } = await req.json()

    if (action === 'toggle-status') {
      const updated = await prisma.news.update({
        where: { id },
        data: { status: status === 'published' ? 'draft' : 'published' },
      })
      await logAudit('update_status', 'news', id, `Changed status to ${updated.status}`)
      return NextResponse.json({ success: true, status: updated.status })
    }

    if (action === 'delete') {
      await prisma.news.delete({ where: { id } })
      await logAudit('delete', 'news', id, 'Deleted news item')
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('Admin news error:', error)
    return NextResponse.json({ error: error.message || 'Error' }, { status: 500 })
  }
}
