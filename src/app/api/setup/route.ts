import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'
import {
  checkSystemRequirements,
  isSystemInstalled,
  runInstallation,
  InstallOptions,
} from '@/lib/installer'
import prisma, { updatePrismaUrl } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const requirements = await checkSystemRequirements()
    return NextResponse.json({
      success: true,
      data: requirements,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action } = body

    if (action === 'test_db') {
      const { dbHost, dbPort, dbUser, dbPass, dbName, saveConfig } = body

      // If custom parameters are provided
      if (dbHost && dbUser && dbName) {
        const host = dbHost.trim()
        const port = dbPort ? String(dbPort).trim() : '3306'
        const user = dbUser.trim()
        const pass = encodeURIComponent(dbPass ?? '')
        const name = dbName.trim()
        const testUrl = `mysql://${user}:${pass}@${host}:${port}/${name}?connection_limit=10&connect_timeout=30&pool_timeout=30`

        const testClient = new PrismaClient({
          datasources: { db: { url: testUrl } },
        })

        try {
          const testResult: any[] = await testClient.$queryRawUnsafe('SELECT 1 as connected')
          const tablesResult: any[] = await testClient.$queryRawUnsafe('SHOW TABLES')
          const tableCount = Array.isArray(tablesResult) ? tablesResult.length : 0

          if (saveConfig) {
            // Persist to .env
            const envPath = path.join(process.cwd(), '.env')
            let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : ''
            if (envContent.includes('DATABASE_URL=')) {
              envContent = envContent.replace(/DATABASE_URL=.*$/m, `DATABASE_URL="${testUrl}"`)
            } else {
              envContent += `\nDATABASE_URL="${testUrl}"\n`
            }
            fs.writeFileSync(envPath, envContent, 'utf8')

            // Update live Prisma singleton
            updatePrismaUrl(testUrl)
          }

          return NextResponse.json({
            success: true,
            connected: Boolean(testResult[0]?.connected),
            databaseName: name,
            existingTablesCount: tableCount,
            saved: Boolean(saveConfig),
            message: `เชื่อมต่อฐานข้อมูล ${name} สำเร็จ (พบ ${tableCount} ตาราง)`,
          })
        } catch (err: any) {
          // If database does not exist, try to create it automatically
          if (err.message && err.message.includes('does not exist')) {
            try {
              const rootUrl = `mysql://${user}:${pass}@${host}:${port}/mysql?connection_limit=5&connect_timeout=15`
              const rootClient = new PrismaClient({ datasources: { db: { url: rootUrl } } })
              await rootClient.$executeRawUnsafe(
                `CREATE DATABASE IF NOT EXISTS \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
              )
              await rootClient.$disconnect()

              // Retry connecting to the newly created database
              const retryClient = new PrismaClient({ datasources: { db: { url: testUrl } } })
              const retryResult: any[] = await retryClient.$queryRawUnsafe('SELECT 1 as connected')
              await retryClient.$disconnect()

              if (saveConfig) {
                const envPath = path.join(process.cwd(), '.env')
                let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : ''
                if (envContent.includes('DATABASE_URL=')) {
                  envContent = envContent.replace(/DATABASE_URL=.*$/m, `DATABASE_URL="${testUrl}"`)
                } else {
                  envContent += `\nDATABASE_URL="${testUrl}"\n`
                }
                fs.writeFileSync(envPath, envContent, 'utf8')
                updatePrismaUrl(testUrl)
              }

              return NextResponse.json({
                success: true,
                connected: Boolean(retryResult[0]?.connected),
                databaseName: name,
                existingTablesCount: 0,
                saved: Boolean(saveConfig),
                message: `สร้างฐานข้อมูล ${name} อัตโนมัติและเชื่อมต่อสำเร็จเรียบร้อยแล้ว`,
              })
            } catch {
              // Could not auto-create, fallback to original error
            }
          }

          return NextResponse.json({
            success: false,
            connected: false,
            message: `ไม่สามารถเชื่อมต่อฐานข้อมูลได้: ${err.message}`,
          })
        } finally {
          await testClient.$disconnect()
        }
      }

      // Default: test current prisma
      try {
        const testResult: any[] = await prisma.$queryRawUnsafe('SELECT 1 as connected')
        const tablesResult: any[] = await prisma.$queryRawUnsafe('SHOW TABLES')
        const tableCount = Array.isArray(tablesResult) ? tablesResult.length : 0
        const dbNameResult: any[] = await prisma.$queryRawUnsafe('SELECT DATABASE() as db')

        return NextResponse.json({
          success: true,
          connected: Boolean(testResult[0]?.connected),
          databaseName: dbNameResult[0]?.db || 'cric_cms',
          existingTablesCount: tableCount,
          message: 'เชื่อมต่อฐานข้อมูลสำเร็จ',
        })
      } catch (err: any) {
        return NextResponse.json({
          success: false,
          connected: false,
          message: `ไม่สามารถเชื่อมต่อฐานข้อมูลได้: ${err.message}`,
        })
      }
    }

    if (action === 'install') {
      // Check if system is already installed
      const alreadyInstalled = await isSystemInstalled()
      const allowForce = body.forceInstall === true

      if (alreadyInstalled && !allowForce) {
        return NextResponse.json(
          {
            success: false,
            message:
              'ระบบได้รับการติดตั้งอยู่แล้ว หากต้องการติดตั้งใหม่ กรุณาลบไฟล์ installed.lock บนเซิร์ฟเวอร์',
          },
          { status: 400 }
        )
      }

      const options: InstallOptions = {
        adminUsername: body.adminUsername?.trim() || 'admin',
        adminPassword: body.adminPassword || '',
        adminEmail: body.adminEmail?.trim() || 'admin@cric.ac.th',
        siteName: body.siteName?.trim() || 'วิทยาลัยการอาชีพเชียงราย',
        siteTitle: body.siteTitle?.trim(),
        sitePhone: body.sitePhone?.trim(),
        siteEmail: body.siteEmail?.trim(),
        siteAddress: body.siteAddress?.trim(),
        currentYear: body.currentYear ? Number(body.currentYear) : 2569,
      }

      if (!options.adminPassword || options.adminPassword.length < 6) {
        return NextResponse.json(
          { success: false, message: 'รหัสผ่านผู้ดูแลระบบต้องมีความยาวอย่างน้อย 6 ตัวอักษร' },
          { status: 400 }
        )
      }

      const result = await runInstallation(options)
      return NextResponse.json(result, { status: result.success ? 200 : 500 })
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}
