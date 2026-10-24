import React, { Suspense } from 'react'
import prisma from '@/lib/prisma'
import { getSettings, getThemeClasses } from '@/lib/settings'
import { getSession } from '@/lib/auth'
import { Header } from '@/components/public/Header'
import { Footer } from '@/components/public/Footer'
import { GlobalLightbox } from '@/components/public/GlobalLightbox'
import { MaintenanceView } from '@/components/public/MaintenanceView'

export const dynamic = 'force-dynamic'

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [settings, session, allNavbars] = await Promise.all([
    getSettings(),
    getSession(),
    prisma.navbars
      .findMany({
        where: { is_active: true },
        orderBy: { order_num: 'asc' },
      })
      .catch(() => []),
  ])

  const isMaintenance =
    (settings.maintenance_mode === '1' || settings.maintenance_mode === 'all') &&
    !session

  if (isMaintenance) {
    return <MaintenanceView settings={settings} />
  }

  // Filter out specific maintenance pages from navbar for guests (matching header.php)
  const filteredNavbars = allNavbars.filter((menu) => {
    if (session) return true
    if (settings.maintenance_mode === 'specific' && settings.maintenance_pages) {
      const blocked = settings.maintenance_pages
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
      const rawUrl = (menu.url || '').toLowerCase()
      const baseFile = rawUrl.split('?')[0].replace(/^\.?\//, '')
      if (blocked.includes(rawUrl) || blocked.includes(baseFile)) {
        return false
      }
    }
    return true
  })

  const theme = getThemeClasses(settings.theme_color || 'orange')

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen flex flex-col justify-between">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            :root {
              --theme-primary: ${theme.hex.primary};
              --theme-primary-hover: ${theme.hex.primaryHover};
              --theme-primary-light: ${theme.hex.primaryLight};
              --theme-primary-border: ${theme.hex.primaryBorder};
              --theme-nav-bg: ${theme.hex.navBg};
            }
          `,
        }}
      />
      <Suspense fallback={null}>
        <Header
          settings={settings}
          navbars={filteredNavbars}
          isLoggedIn={Boolean(session)}
        />
      </Suspense>
      <main className="flex-1 flex flex-col">{children}</main>
      <Footer settings={settings} />
      <GlobalLightbox />
    </div>
  )
}
