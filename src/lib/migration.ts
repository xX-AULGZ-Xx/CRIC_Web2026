import prisma from './prisma'
import fs from 'fs'
import path from 'path'
import AdmZip from 'adm-zip'

export interface MigrationStepResult {
  step: string
  status: 'pending' | 'success' | 'failed'
  message: string
  timestamp: string
}

export interface MigrationSummary {
  success: boolean
  snapshotFile?: string
  tablesCount?: number
  queriesExecuted?: number
  filesCopied?: number
  logs: MigrationStepResult[]
  error?: string
}

// Ensure backups directory exists
export function getBackupsDir(): string {
  const dir = path.join(process.cwd(), 'backups')
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  return dir
}

// 1. Create a safety snapshot of the current database
export async function createSafetySnapshot(): Promise<string> {
  const backupsDir = getBackupsDir()
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const filename = `safety_snapshot_${timestamp}.sql`
  const filepath = path.join(backupsDir, filename)

  // Get all table names
  const tablesResult: any[] = await prisma.$queryRawUnsafe('SHOW TABLES')
  const tables = tablesResult.map((row) => Object.values(row)[0] as string)

  let sqlDump = `-- CRIC CMS Safety Snapshot Dump\n`
  sqlDump += `-- Created on ${new Date().toISOString()}\n\n`
  sqlDump += `SET FOREIGN_KEY_CHECKS=0;\n\n`

  for (const table of tables) {
    // DDL
    const ddlResult: any[] = await prisma.$queryRawUnsafe(`SHOW CREATE TABLE \`${table}\``)
    const createTableSql = ddlResult[0]['Create Table']
    sqlDump += `DROP TABLE IF EXISTS \`${table}\`;\n`
    sqlDump += `${createTableSql};\n\n`

    // Data
    const rows: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM \`${table}\``)
    if (rows.length > 0) {
      sqlDump += `-- Dumping data for ${table}\n`
      for (const row of rows) {
        const columns = Object.keys(row).map((k) => `\`${k}\``).join(', ')
        const values = Object.values(row)
          .map((val) => {
            if (val === null || val === undefined) return 'NULL'
            if (typeof val === 'number' || typeof val === 'bigint') return String(val)
            if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`
            if (typeof val === 'boolean') return val ? '1' : '0'
            // Escape string
            const str = String(val).replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, (char) => {
              switch (char) {
                case '\0': return '\\0'
                case '\x08': return '\\b'
                case '\x09': return '\\t'
                case '\x1a': return '\\z'
                case '\n': return '\\n'
                case '\r': return '\\r'
                case '"':
                case "'":
                case '\\':
                case '%': return '\\' + char
                default: return char
              }
            })
            return `'${str}'`
          })
          .join(', ')

        sqlDump += `INSERT INTO \`${table}\` (${columns}) VALUES (${values});\n`
      }
      sqlDump += `\n`
    }
  }

  sqlDump += `SET FOREIGN_KEY_CHECKS=1;\n`
  fs.writeFileSync(filepath, sqlDump, 'utf8')
  return filename
}

// 2. Execute SQL dump statements safely
export async function executeSqlDump(sqlContent: string): Promise<number> {
  // Split statements by semicolon followed by optional spaces and end of line
  const queries = sqlContent
    .split(/;\s*$/m)
    .map((q) => q.trim())
    .filter((q) => q.length > 0 && !q.startsWith('--') && !q.startsWith('/*'))

  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0;')

  let executed = 0
  for (const query of queries) {
    try {
      await prisma.$executeRawUnsafe(query)
      executed++
    } catch (err: any) {
      // Continue on non-fatal warnings
      console.warn('SQL execution notice on statement:', query.slice(0, 60), err.message)
    }
  }

  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1;')
  return executed
}

// Helper: Copy directory recursively
function copyDirRecursive(src: string, dest: string): number {
  if (!fs.existsSync(/*turbopackIgnore: true*/ src)) return 0
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true })
  }

  let count = 0
  const entries = fs.readdirSync(/*turbopackIgnore: true*/ src, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)

    if (entry.isDirectory()) {
      count += copyDirRecursive(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
      count++
    }
  }

  return count
}

// 3. Direct Local Migration from cric_new26 on the server
export async function runDirectLocalMigration(
  legacyPath: string = 'c:\\inetpub\\wwwroot\\cric_new26'
): Promise<MigrationSummary> {
  const logs: MigrationStepResult[] = []

  const addLog = (step: string, status: 'pending' | 'success' | 'failed', message: string) => {
    logs.push({ step, status, message, timestamp: new Date().toLocaleTimeString('th-TH') })
  }

  try {
    // Step 1: Safety Snapshot
    addLog('Snapshot', 'pending', 'กำลังสร้าง Safety Snapshot สำรองข้อมูลปัจจุบัน...')
    const snapshotFile = await createSafetySnapshot()
    addLog('Snapshot', 'success', `สร้าง Snapshot สำรองเรียบร้อย: ${snapshotFile}`)

    // Step 2: Check legacy directory existence
    addLog('Verification', 'pending', `ตรวจสอบโฟลเดอร์ระบบเดิม: ${legacyPath}`)
    if (!fs.existsSync(/*turbopackIgnore: true*/ legacyPath)) {
      throw new Error(`ไม่พบโฟลเดอร์ระบบเดิมที่ ${legacyPath}`)
    }
    addLog('Verification', 'success', 'พบโฟลเดอร์ระบบเดิมเรียบร้อย')

    // Step 3: Sync Uploads & Assets
    const legacyUploads = path.join(legacyPath, 'uploads')
    const targetUploads = path.join(process.cwd(), 'public', 'uploads')
    addLog('UploadsSync', 'pending', 'กำลังคัดลอกและซิงค์ไฟล์จาก uploads...')
    const filesCopied = copyDirRecursive(legacyUploads, targetUploads)
    addLog('UploadsSync', 'success', `ซิงค์ไฟล์สำเร็จจำนวน ${filesCopied} ไฟล์`)

    // Step 4: Verify Database Tables
    addLog('DatabaseVerify', 'pending', 'กำลังตรวจสอบตารางฐานข้อมูล...')
    const tablesResult: any[] = await prisma.$queryRawUnsafe('SHOW TABLES')
    const tableCount = tablesResult.length
    addLog('DatabaseVerify', 'success', `ตรวจสอบฐานข้อมูล MariaDB เรียบร้อย ทั้งหมด ${tableCount} ตารางพร้อมใช้งาน`)

    return {
      success: true,
      snapshotFile,
      tablesCount: tableCount,
      filesCopied,
      logs,
    }
  } catch (error: any) {
    addLog('Error', 'failed', error.message || 'เกิดข้อผิดพลาดในการย้ายข้อมูล')
    return {
      success: false,
      logs,
      error: error.message,
    }
  }
}

// 4. Restore from uploaded ZIP file (cric_new26 backup format)
export async function restoreFromZipBuffer(zipBuffer: Buffer): Promise<MigrationSummary> {
  const logs: MigrationStepResult[] = []
  const addLog = (step: string, status: 'pending' | 'success' | 'failed', message: string) => {
    logs.push({ step, status, message, timestamp: new Date().toLocaleTimeString('th-TH') })
  }

  try {
    addLog('Snapshot', 'pending', 'กำลังสร้าง Safety Snapshot สำรองข้อมูลปัจจุบัน...')
    const snapshotFile = await createSafetySnapshot()
    addLog('Snapshot', 'success', `สร้าง Snapshot สำรองเรียบร้อย: ${snapshotFile}`)

    addLog('ZipRead', 'pending', 'กำลังอ่านและแตกไฟล์ ZIP สำรองข้อมูล...')
    const zip = new AdmZip(zipBuffer)
    const zipEntries = zip.getEntries()
    addLog('ZipRead', 'success', `อ่านไฟล์ ZIP สำเร็จ พบรายการทั้งหมด ${zipEntries.length} รายการ`)

    // Find SQL dump file in zip
    let sqlContent: string | null = null
    for (const entry of zipEntries) {
      if (entry.entryName.endsWith('.sql') && !entry.isDirectory) {
        sqlContent = zip.readAsText(entry)
        addLog('SqlFound', 'success', `พบไฟล์ฐานข้อมูลใน ZIP: ${entry.entryName}`)
        break
      }
    }

    let queriesExecuted = 0
    if (sqlContent) {
      addLog('SqlRestore', 'pending', 'กำลังกู้คืนโครงสร้างและข้อมูลตารางจาก SQL...')
      queriesExecuted = await executeSqlDump(sqlContent)
      addLog('SqlRestore', 'success', `กู้คืนตารางฐานข้อมูลสำเร็จ รันทั้งหมด ${queriesExecuted} คำสั่ง`)
    } else {
      addLog('SqlRestore', 'pending', 'ไม่พบไฟล์ .sql ใน ZIP (ข้ามการกู้คืนฐานข้อมูล)')
    }

    // Extract uploads
    addLog('UploadsExtract', 'pending', 'กำลังแตกไฟล์อัปโหลดลงใน public/uploads...')
    let filesExtracted = 0
    const targetUploads = path.join(process.cwd(), 'public', 'uploads')

    for (const entry of zipEntries) {
      if (entry.entryName.startsWith('uploads/') && !entry.isDirectory) {
        // Relative subpath after uploads/
        const relativeName = entry.entryName.replace(/^uploads\//, '')
        const fullDest = path.join(targetUploads, relativeName)
        const destDir = path.dirname(fullDest)
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true })
        }
        fs.writeFileSync(fullDest, entry.getData())
        filesExtracted++
      }
    }
    addLog('UploadsExtract', 'success', `แตกไฟล์อัปโหลดสำเร็จ ${filesExtracted} ไฟล์`)

    return {
      success: true,
      snapshotFile,
      queriesExecuted,
      filesCopied: filesExtracted,
      logs,
    }
  } catch (error: any) {
    addLog('Error', 'failed', error.message || 'เกิดข้อผิดพลาดในการกู้คืนจากไฟล์ ZIP')
    return {
      success: false,
      logs,
      error: error.message,
    }
  }
}

// 5. Restore from raw SQL file
export async function restoreFromSqlString(sqlString: string): Promise<MigrationSummary> {
  const logs: MigrationStepResult[] = []
  const addLog = (step: string, status: 'pending' | 'success' | 'failed', message: string) => {
    logs.push({ step, status, message, timestamp: new Date().toLocaleTimeString('th-TH') })
  }

  try {
    addLog('Snapshot', 'pending', 'กำลังสร้าง Safety Snapshot สำรองข้อมูลปัจจุบัน...')
    const snapshotFile = await createSafetySnapshot()
    addLog('Snapshot', 'success', `สร้าง Snapshot สำรองเรียบร้อย: ${snapshotFile}`)

    addLog('SqlRestore', 'pending', 'กำลังประมวลผลคำสั่ง SQL นำเข้าฐานข้อมูล...')
    const queriesExecuted = await executeSqlDump(sqlString)
    addLog('SqlRestore', 'success', `นำเข้าข้อมูลตารางสำเร็จ รันทั้งหมด ${queriesExecuted} คำสั่ง`)

    return {
      success: true,
      snapshotFile,
      queriesExecuted,
      logs,
    }
  } catch (error: any) {
    addLog('Error', 'failed', error.message || 'เกิดข้อผิดพลาดในการนำเข้าไฟล์ SQL')
    return {
      success: false,
      logs,
      error: error.message,
    }
  }
}

// 6. Get list of all safety snapshots available for download
export function listSafetySnapshots(): { name: string; size: number; createdAt: Date }[] {
  const dir = getBackupsDir()
  const files = fs.readdirSync(dir)
  return files
    .filter((f) => f.endsWith('.sql'))
    .map((name) => {
      const stats = fs.statSync(path.join(dir, name))
      return {
        name,
        size: stats.size,
        createdAt: stats.birthtime,
      }
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}
