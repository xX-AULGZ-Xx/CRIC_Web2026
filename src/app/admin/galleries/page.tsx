import React from 'react'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { GalleriesAdminClient } from './GalleriesAdminClient'

export const dynamic = 'force-dynamic'

export default async function AdminGalleriesPage() {
  const session = await getSession()
  if (!session) redirect('/admin/login')

  const albums = await prisma.galleries.findMany({
    orderBy: { created_at: 'desc' },
    include: {
      gallery_images: {
        orderBy: { id: 'asc' },
      },
    },
  })

  const serialized = albums.map((a) => ({
    ...a,
    created_at: a.created_at ? a.created_at.toISOString() : null,
    gallery_images: a.gallery_images.map((img) => ({
      id: img.id,
      gallery_id: img.gallery_id,
      image_path: img.image_path,
    })),
  }))

  return <GalleriesAdminClient initialAlbums={serialized} />
}
