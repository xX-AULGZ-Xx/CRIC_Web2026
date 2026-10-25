import fs from 'fs'
import path from 'path'
import prisma from './prisma'
import bcrypt from 'bcryptjs'
import { SCHEMA_TABLE_QUERIES } from './schema-tables'
import { repairDatabaseIntegrity } from './migration'

export interface SystemRequirementsResult {
  isInstalled: boolean
  nodeVersion: string
  osPlatform: string
  uploadsWritable: boolean
  backupsWritable: boolean
  databaseConnected: boolean
  databaseName: string
  existingTablesCount: number
  hasAdminUser: boolean
}

export interface InstallOptions {
  adminUsername: string
  adminPassword: string
  adminEmail: string
  siteName: string
  siteTitle?: string
  sitePhone?: string
  siteEmail?: string
  siteAddress?: string
  currentYear?: number
}

const LOCK_FILE_NAME = 'installed.lock'

export function getLockFilePath(): string {
  return path.join(process.cwd(), LOCK_FILE_NAME)
}

/**
 * Checks if the system is installed.
 */
export async function isSystemInstalled(): Promise<boolean> {
  const lockFile = getLockFilePath()
  if (fs.existsSync(lockFile)) {
    return true
  }

  // Fallback: Check if database has users and settings
  try {
    const userCount = await prisma.users.count()
    if (userCount > 0) {
      // System is already populated, generate lockfile for safety
      try {
        fs.writeFileSync(
          lockFile,
          JSON.stringify({
            installed_at: new Date().toISOString(),
            auto_detected: true,
          }),
          'utf8'
        )
      } catch (e) {
        console.warn('Could not auto-write lockfile:', e)
      }
      return true
    }
  } catch {
    // Database connection failed or tables don't exist yet
    return false
  }

  return false
}

/**
 * Checks server directories write permissions and system health.
 */
export async function checkSystemRequirements(): Promise<SystemRequirementsResult> {
  const isInstalled = await isSystemInstalled()
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
  const backupsDir = path.join(process.cwd(), 'backups')

  let uploadsWritable = false
  try {
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })
    const testFile = path.join(uploadsDir, '.write-test')
    fs.writeFileSync(testFile, 'test')
    fs.unlinkSync(testFile)
    uploadsWritable = true
  } catch {
    uploadsWritable = false
  }

  let backupsWritable = false
  try {
    if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true })
    const testFile = path.join(backupsDir, '.write-test')
    fs.writeFileSync(testFile, 'test')
    fs.unlinkSync(testFile)
    backupsWritable = true
  } catch {
    backupsWritable = false
  }

  let databaseConnected = false
  let existingTablesCount = 0
  let hasAdminUser = false
  let databaseName = ''

  try {
    const dbNameResult: any[] = await prisma.$queryRawUnsafe('SELECT DATABASE() as db')
    databaseName = dbNameResult[0]?.db || 'cric_cms'
    databaseConnected = true

    const tablesResult: any[] = await prisma.$queryRawUnsafe('SHOW TABLES')
    existingTablesCount = Array.isArray(tablesResult) ? tablesResult.length : 0

    if (existingTablesCount > 0) {
      const users = await prisma.users.count().catch(() => 0)
      hasAdminUser = users > 0
    }
  } catch {
    databaseConnected = false
  }

  return {
    isInstalled,
    nodeVersion: process.version,
    osPlatform: process.platform,
    uploadsWritable,
    backupsWritable,
    databaseConnected,
    databaseName,
    existingTablesCount,
    hasAdminUser,
  }
}

/**
 * Run complete setup and installation.
 */
export async function runInstallation(options: InstallOptions): Promise<{
  success: boolean
  message: string
  logs: string[]
}> {
  const logs: string[] = []
  const addLog = (msg: string) => {
    logs.push(`[${new Date().toLocaleTimeString('th-TH')}] ${msg}`)
  }

  try {
    addLog('เริ่มขั้นตอนการติดตั้งระบบ...')

    // 1. Initialize all 27 tables
    addLog('กำลังสร้างและจัดเตรียมโครงสร้างฐานข้อมูล (27 ตาราง)...')
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0;')

    for (const query of SCHEMA_TABLE_QUERIES) {
      await prisma.$executeRawUnsafe(query)
    }

    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1;')
    addLog('สร้างโครงสร้างตารางฐานข้อมูลสำเร็จครบถ้วน')

    // 2. Run Database Integrity & Core Seed
    addLog('กำลังนำเข้าข้อมูลพื้นฐานและโครงสร้าง ITA...')
    await repairDatabaseIntegrity()
    addLog('ข้อมูลหมวดหมู่และโครงสร้างพื้นฐานพร้อมใช้งาน')

    // 3. Create or Update Super Admin User
    addLog(`กำลังสร้างบัญชีผู้ดูแลระบบ: ${options.adminUsername}...`)
    const hashedPassword = await bcrypt.hash(options.adminPassword, 10)

    // Check if user ID 1 exists
    const existingAdmin = await prisma.users.findUnique({
      where: { username: options.adminUsername },
    })

    if (existingAdmin) {
      await prisma.users.update({
        where: { id: existingAdmin.id },
        data: {
          password: hashedPassword,
          email: options.adminEmail,
          role: 'admin',
        },
      })
      addLog(`อัปเดตสิทธิ์และรหัสผ่านของผู้ดูแลระบบ ${options.adminUsername} สำเร็จ`)
    } else {
      await prisma.users.create({
        data: {
          username: options.adminUsername,
          password: hashedPassword,
          email: options.adminEmail,
          role: 'admin',
        },
      })
      addLog(`สร้างบัญชีผู้ดูแลระบบ ${options.adminUsername} สำเร็จ`)
    }

    // 4. Save Site Settings
    addLog('กำลังบันทึกข้อมูลการตั้งค่าองค์กรและเว็บไซต์...')
    const year = options.currentYear || 2569
    const settingsList: [string, string][] = [
      ['site_name', options.siteName || 'วิทยาลัยการอาชีพเชียงราย'],
      ['site_title', options.siteTitle || options.siteName || 'วิทยาลัยการอาชีพเชียงราย'],
      ['site_phone', options.sitePhone || '053-774422'],
      ['site_email', options.siteEmail || options.adminEmail || 'cric@cric.ac.th'],
      ['site_address', options.siteAddress || '111 หมู่ 8 ต.ป่าซาง อ.แม่จัน จ.เชียงราย 57110'],
      ['current_year', String(year)],
      ['system_installed', '1'],
      ['installed_at', new Date().toISOString()],
    ]

    for (const [key, value] of settingsList) {
      await prisma.settings.upsert({
        where: { setting_key: key },
        create: { setting_key: key, setting_value: value },
        update: { setting_value: value },
      })
    }
    addLog('บันทึกการตั้งค่าเว็บไซต์สำเร็จ')

    // 5. Ensure default home page in static_pages
    const homePage = await prisma.static_pages.findUnique({
      where: { slug: 'home' },
    })
    if (!homePage) {
      await prisma.static_pages.create({
        data: {
          slug: 'home',
          title: 'หน้าแรก',
          content: `<!-- block:home_sliders -->\n<!-- block:quick_access -->\n<!-- block:latest_news -->\n<!-- block:executives -->`,
        },
      })
      addLog('สร้างโครงสร้างหน้าแรก (Homepage Blocks) เริ่มต้นเรียบร้อย')
    }

    // 6. Write Lockfile
    const lockFile = getLockFilePath()
    fs.writeFileSync(
      lockFile,
      JSON.stringify(
        {
          installed_at: new Date().toISOString(),
          admin_username: options.adminUsername,
          site_name: options.siteName,
          installed_by: 'installer_wizard',
        },
        null,
        2
      ),
      'utf8'
    )
    addLog(`สร้างไฟล์ความปลอดภัย ${LOCK_FILE_NAME} เรียบร้อยแล้ว`)
    addLog('การติดตั้งระบบเสร็จสมบูรณ์ 100% พร้อมใช้งานทันที')

    return {
      success: true,
      message: 'ติดตั้งระบบและสร้างฐานข้อมูลเริ่มต้นเรียบร้อยแล้ว',
      logs,
    }
  } catch (err: any) {
    addLog(`เกิดข้อผิดพลาดระหว่างการติดตั้ง: ${err.message}`)
    console.error('Installation error:', err)
    return {
      success: false,
      message: err.message || 'เกิดข้อผิดพลาดระหว่างการติดตั้งระบบ',
      logs,
    }
  }
}
