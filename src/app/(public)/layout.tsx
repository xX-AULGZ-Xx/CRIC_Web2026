import React from 'react'
import prisma from '@/lib/prisma'
import { getSettings, getThemeClasses } from '@/lib/settings'
import { getSession } from '@/lib/auth'
import { Header, NestedNavItem } from '@/components/public/Header'
import { Footer } from '@/components/public/Footer'
import { GlobalLightbox } from '@/components/public/GlobalLightbox'
import { MaintenanceView } from '@/components/public/MaintenanceView'
import { PDPABanner } from '@/components/public/PDPABanner'
import { normalizeLinkUrl } from '@/lib/url-helper'

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

  // Build 3-level tree on the server to reduce client-side payload and hydration cost
  const byParent = new Map<number | null, (typeof allNavbars)[number][]>()
  for (const item of filteredNavbars) {
    const pid = item.parent_id ? Number(item.parent_id) : null
    if (!byParent.has(pid)) byParent.set(pid, [])
    byParent.get(pid)!.push(item)
  }

  const buildLevel = (parentId: number | null, depth: number): NestedNavItem[] => {
    if (depth > 3) return []
    const list = byParent.get(parentId) || []
    return list.map((item) => ({
      id: item.id,
      parent_id: item.parent_id ?? null,
      label: item.label,
      url: normalizeLinkUrl(item.url),
      icon: item.icon,
      target_blank: Boolean(item.target_blank),
      children: buildLevel(item.id, depth + 1),
    }))
  }

  const navTree = buildLevel(null, 1)
  const theme = getThemeClasses(settings.theme_color || 'orange')

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen flex flex-col justify-between w-full max-w-full overflow-x-clip">
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
      <Header
        settings={settings}
        navTree={navTree}
        isLoggedIn={Boolean(session)}
      />
      <main className="flex-1 flex flex-col w-full max-w-full min-w-0 overflow-x-clip">{children}</main>
      <Footer settings={settings} />
      <GlobalLightbox />
      {settings.pdpa_enabled !== '0' && (
        <PDPABanner
          enabled={settings.pdpa_enabled !== '0'}
          text={settings.pdpa_text}
        />
      )}
    </div>
  )
}
