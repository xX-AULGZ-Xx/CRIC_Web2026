import React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import { ArrowLeft, Clock } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const slug = decodeURIComponent(params.slug)

  const page = await prisma.static_pages.findUnique({
    where: { slug },
  })

  if (!page) {
    return { title: 'ไม่พบหน้านี้' }
  }

  return {
    title: page.meta_title || page.title,
    description: page.meta_description || page.title,
  }
}

export default async function StaticPage(props: Props) {
  const params = await props.params
  const slug = decodeURIComponent(params.slug)

  const page = await prisma.static_pages.findUnique({
    where: { slug },
  })

  if (!page) {
    notFound()
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-800 transition font-semibold mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>กลับสู่หน้าแรก</span>
      </Link>

      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-10 shadow-xs">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 border-b border-slate-100 pb-5 mb-6">
          {page.title}
        </h1>

        <div
          className="prose prose-slate max-w-none text-slate-800 leading-relaxed text-sm sm:text-base prose-img:rounded-2xl prose-table:border prose-table:border-slate-200"
          dangerouslySetInnerHTML={{ __html: page.content || '' }}
        />
      </div>
    </div>
  )
}
