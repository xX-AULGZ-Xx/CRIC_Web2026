import React from 'react'
import { getSettings, getNavTree } from '@/lib/settings'
import { TopBar } from '@/components/layout/TopBar'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

export const dynamic = 'force-dynamic'

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [settings, navTree] = await Promise.all([
    getSettings(),
    getNavTree(),
  ])

  return (
    <>
      <TopBar settings={settings} />
      <Header settings={settings} navTree={navTree} />
      <main className="grow flex flex-col">{children}</main>
      <Footer settings={settings} />
    </>
  )
}
