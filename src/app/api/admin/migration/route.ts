import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession, logAudit } from '@/lib/auth'
import {
  runDirectLocalMigration,
  restoreFromZipBuffer,
  restoreFromSqlString,
  createSafetySnapshot,
  listSafetySnapshots,
} from '@/lib/migration'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get DB tables count
    const tablesResult: any[] = await prisma.$queryRawUnsafe('SHOW TABLES')
    const tablesCount = tablesResult.length

    // Count uploads
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    let uploadsCount = 0
    let uploadsSize = 0

    function measureDir(dir: string) {
      if (!fs.existsSync(/*turbopackIgnore: true*/ dir)) return
      const entries = fs.readdirSync(/*turbopackIgnore: true*/ dir, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          measureDir(fullPath)
        } else {
          uploadsCount++
          uploadsSize += fs.statSync(/*turbopackIgnore: true*/ fullPath).size
        }
      }
    }

    measureDir(uploadsDir)

    // Check legacy dir existence
    const legacyPath = 'c:\\inetpub\\wwwroot\\cric_new26'
    const legacyExists = fs.existsSync(/*turbopackIgnore: true*/ legacyPath)

    const snapshots = listSafetySnapshots()

    return NextResponse.json({
      success: true,
      tablesCount,
      uploadsCount,
      uploadsSize,
      legacyPath,
      legacyExists,
      snapshots,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contentType = req.headers.get('content-type') || ''

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      const mode = formData.get('mode') as string
      const file = formData.get('file') as File | null

      if (!file) {
        return NextResponse.json({ error: 'ไม่พบไฟล์ที่อัปโหลด' }, { status: 400 })
      }

      const buffer = Buffer.from(await file.arrayBuffer())

      if (mode === 'upload-zip' || file.name.endsWith('.zip')) {
        const result = await restoreFromZipBuffer(buffer)
        if (result.success) {
          await logAudit(
            'MIGRATION_ZIP',
            'migration',
            undefined,
            `Restored from ZIP backup: ${file.name}`
          )
        }
        return NextResponse.json(result)
      } else if (mode === 'upload-sql' || file.name.endsWith('.sql')) {
        const sqlString = buffer.toString('utf8')
        const result = await restoreFromSqlString(sqlString)
        if (result.success) {
          await logAudit(
            'MIGRATION_SQL',
            'migration',
            undefined,
            `Restored from SQL backup: ${file.name}`
          )
        }
        return NextResponse.json(result)
      }

      return NextResponse.json({ error: 'รูปแบบไฟล์ไม่ถูกต้อง (รองรับเฉพาะ .zip หรือ .sql)' }, { status: 400 })
    }

    // JSON payload
    const body = await req.json()
    const { action, legacyPath } = body

    if (action === 'direct-sync') {
      const result = await runDirectLocalMigration(legacyPath || 'c:\\inetpub\\wwwroot\\cric_new26')
      if (result.success) {
        await logAudit(
          'MIGRATION_DIRECT',
          'migration',
          undefined,
          `Direct sync executed successfully from ${legacyPath || 'cric_new26'}`
        )
      }
      return NextResponse.json(result)
    }

    if (action === 'create-snapshot') {
      const filename = await createSafetySnapshot()
      await logAudit(
        'CREATE_SNAPSHOT',
        'database',
        undefined,
        `Created manual safety snapshot: ${filename}`
      )
      return NextResponse.json({ success: true, filename })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('Migration API error:', error)
    return NextResponse.json({ error: error.message || 'Error' }, { status: 500 })
  }
}
