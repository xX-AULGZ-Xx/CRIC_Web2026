import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { Readable } from 'stream'

export const dynamic = 'force-dynamic'

const MIME_TYPES: Record<string, string> = {
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.bmp': 'image/bmp',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.txt': 'text/plain; charset=utf-8',
  '.zip': 'application/zip',
  '.rar': 'application/x-rar-compressed',
  '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg',
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params
    if (!pathSegments || pathSegments.length === 0) {
      return new NextResponse('Not Found', { status: 404 })
    }

    const uploadsBase = path.resolve(process.cwd(), 'public', 'uploads')
    const requestedPath = path.resolve(uploadsBase, ...pathSegments)

    // Security: Prevent directory traversal attacks
    if (!requestedPath.startsWith(uploadsBase)) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    if (!fs.existsSync(requestedPath)) {
      return new NextResponse('File Not Found', { status: 404 })
    }

    const stat = fs.statSync(requestedPath)
    if (!stat.isFile()) {
      return new NextResponse('Not Found', { status: 404 })
    }

    const ext = path.extname(requestedPath).toLowerCase()
    const contentType = MIME_TYPES[ext] || 'application/octet-stream'

    const nodeStream = fs.createReadStream(requestedPath)
    const webStream = Readable.toWeb(nodeStream) as ReadableStream

    return new NextResponse(webStream, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': stat.size.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Error serving upload file:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
