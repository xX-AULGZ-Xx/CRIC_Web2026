import { NextRequest, NextResponse } from 'next/server'
import {
  checkSystemRequirements,
  isSystemInstalled,
  runInstallation,
  InstallOptions,
} from '@/lib/installer'
import prisma from '@/lib/prisma'

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
      try {
        const testResult: any[] = await prisma.$queryRawUnsafe('SELECT 1 as connected')
        return NextResponse.json({
          success: true,
          connected: Boolean(testResult[0]?.connected),
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
