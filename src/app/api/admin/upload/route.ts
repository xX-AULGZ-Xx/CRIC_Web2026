import { NextRequest, NextResponse } from 'next/server'
import { getSession, logAudit } from '@/lib/auth'
import prisma from '@/lib/prisma'
import fs from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const rawFolder = (formData.get('folder') as string) || 'media'
    const safeFolder = rawFolder.replace(/[^a-zA-Z0-9_-]/g, '') || 'media'
    const recordMedia = formData.get('recordMedia') !== 'false'

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', safeFolder)
    await fs.mkdir(uploadDir, { recursive: true })

    const files: File[] = []
    const singleFile = formData.get('file')
    if (singleFile && singleFile instanceof File && singleFile.size > 0) {
      files.push(singleFile)
    }
    const multiFiles = formData.getAll('files')
    for (const f of multiFiles) {
      if (f instanceof File && f.size > 0) {
        files.push(f)
      }
    }

    if (files.length === 0) {
      return NextResponse.json({ error: 'ไม่พบไฟล์ที่อัปโหลด' }, { status: 400 })
    }

    const uploadedResults: Array<{
      id?: number
      path: string
      url: string
      file_name: string
      file_size: number
      file_type: string
    }> = []

    for (const file of files) {
      const originalName = file.name || 'file'
      const ext = path.extname(originalName).toLowerCase()
      const baseName = path
        .basename(originalName, ext)
        .replace(/[^a-zA-Z0-9ก-๙_-]/g, '_')
        .slice(0, 60)
      const uniqueName = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${baseName}${ext}`
      const destPath = path.join(uploadDir, uniqueName)

      const arrayBuffer = await file.arrayBuffer()
      await fs.writeFile(destPath, Buffer.from(arrayBuffer))

      const relativePath = `uploads/${safeFolder}/${uniqueName}`
      const publicUrl = `/${relativePath}`
      const fileType = file.type || ext.replace('.', '') || 'application/octet-stream'

      let mediaId: number | undefined
      if (recordMedia) {
        try {
          const created = await prisma.media.create({
            data: {
              file_name: originalName,
              file_path: relativePath,
              file_type: fileType.slice(0, 50),
              file_size: file.size,
              uploaded_by: session.id,
            },
          })
          mediaId = created.id
        } catch {
          // ignore if media table insert fails
        }
      }

      uploadedResults.push({
        id: mediaId,
        path: relativePath,
        url: publicUrl,
        file_name: originalName,
        file_size: file.size,
        file_type: fileType,
      })
    }

    await logAudit(
      'UPLOAD',
      safeFolder,
      uploadedResults[0]?.id,
      `Uploaded ${uploadedResults.length} file(s) to ${safeFolder}`
    )

    const first = uploadedResults[0]
    return NextResponse.json({
      success: true,
      id: first.id,
      path: first.path,
      url: first.url,
      file_name: first.file_name,
      file_size: first.file_size,
      file_type: first.file_type,
      files: uploadedResults,
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error?.message || 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์' },
      { status: 500 }
    )
  }
}
