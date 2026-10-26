import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession, logAudit } from '@/lib/auth'
import {
  runDirectLocalMigration,
  restoreFromZipBuffer,
  restoreFromSqlString,
  rollbackSnapshot,
  createSafetySnapshot,
  listSafetySnapshots,
} from '@/lib/migration'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes timeout for large migration files

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const defaultLegacy =
      process.platform === 'win32'
        ? 'c:\\inetpub\\wwwroot\\cric_new26'
        : '/www/wwwroot/cric_new26'
    const customLegacyPath = searchParams.get('legacyPath') || defaultLegacy

    // Get DB tables count
    const tablesResult: any[] = await prisma.$queryRawUnsafe('SHOW TABLES')
    const tablesCount = tablesResult.length

    // Count uploads in web_cric_upgrade
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    let uploadsCount = 0
    let uploadsSize = 0

    function measureDir(dir: string, cb: (count: number, size: number) => void) {
      if (!fs.existsSync(dir)) return
      let c = 0
      let s = 0
      function walk(curr: string) {
        const entries = fs.readdirSync(curr, { withFileTypes: true })
        for (const entry of entries) {
          const fullPath = path.join(curr, entry.name)
          if (entry.isDirectory()) {
            walk(fullPath)
          } else {
            c++
            try {
              s += fs.statSync(fullPath).size
            } catch {}
          }
        }
      }
      try {
        walk(dir)
      } catch {}
      cb(c, s)
    }

    measureDir(uploadsDir, (c, s) => {
      uploadsCount = c
      uploadsSize = s
    })

    // Check legacy dir stats
    let legacyExists = false
    let legacyUploadsCount = 0
    let legacyUploadsSize = 0

    if (fs.existsSync(/*turbopackIgnore: true*/ customLegacyPath)) {
      legacyExists = true
      const legacyUploads = path.join(customLegacyPath, 'uploads')
      measureDir(legacyUploads, (c, s) => {
        legacyUploadsCount = c
        legacyUploadsSize = s
      })
    }

    const snapshots = listSafetySnapshots()

    return NextResponse.json({
      success: true,
      tablesCount,
      uploadsCount,
      uploadsSize,
      legacyPath: customLegacyPath,
      legacyExists,
      legacyUploadsCount,
      legacyUploadsSize,
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
      const cleanReset = formData.get('cleanReset') === '1'

      if (!file) {
        return NextResponse.json({ error: 'ไม่พบไฟล์ที่อัปโหลด' }, { status: 400 })
      }

      const buffer = Buffer.from(await file.arrayBuffer())

      if (mode === 'upload-zip' || file.name.endsWith('.zip')) {
        const result = await restoreFromZipBuffer(buffer, cleanReset)
        if (result.success) {
          await logAudit(
            'MIGRATION_ZIP',
            'migration',
            undefined,
            `Restored from ZIP backup: ${file.name} (Clean: ${cleanReset})`
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
            `Restored from SQL dump: ${file.name}`
          )
        }
        return NextResponse.json(result)
      }

      return NextResponse.json(
        { error: 'รูปแบบไฟล์ไม่ถูกต้อง (รองรับเฉพาะไฟล์ .zip หรือ .sql)' },
        { status: 400 }
      )
    }

    // JSON payload
    const body = await req.json()
    const { action } = body

    if (action === 'direct-sync') {
      const { legacyPath, policy, syncDatabase, syncUploads } = body
      const result = await runDirectLocalMigration({
        legacyPath,
        policy,
        syncDatabase,
        syncUploads,
      })
      if (result.success) {
        await logAudit(
          'MIGRATION_DIRECT',
          'migration',
          undefined,
          `Direct sync from ${legacyPath || 'cric_new26'} (${policy || 'merge'})`
        )
      }
      return NextResponse.json(result)
    }

    if (action === 'rollback') {
      const { filename } = body
      if (!filename) {
        return NextResponse.json({ error: 'กรุณาระบุชื่อไฟล์ Snapshot' }, { status: 400 })
      }
      const result = await rollbackSnapshot(filename)
      if (result.success) {
        await logAudit(
          'MIGRATION_ROLLBACK',
          'migration',
          undefined,
          `Rollback executed to ${filename}`
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
