import prisma from './prisma'

export interface SiteSettings {
  [key: string]: string
}

export async function getSettings(): Promise<SiteSettings> {
  try {
    const rows = await prisma.settings.findMany()
    const settings: SiteSettings = {}
    for (const row of rows) {
      settings[row.setting_key] = row.setting_value || ''
    }
    return settings
  } catch (error) {
    console.error('Failed to get settings:', error)
    return {}
  }
}

export function getThemeClasses(color: string = 'orange') {
  const themes: Record<string, {
    primaryBg: string
    primaryHover: string
    primaryText: string
    primaryBorder: string
    primaryRing: string
    navBg: string
    footerBg: string
    gradient: string
    headerGradient: string
    accentBg: string
    accentText: string
    badgeBg: string
    hex: {
      primary: string
      primaryHover: string
      primaryLight: string
      primaryBorder: string
      navBg: string
    }
  }> = {
    orange: {
      primaryBg: 'bg-orange-600',
      primaryHover: 'hover:bg-orange-700',
      primaryText: 'text-orange-600',
      primaryBorder: 'border-orange-600',
      primaryRing: 'focus:border-orange-500 focus:ring-orange-500',
      navBg: 'bg-orange-900',
      footerBg: 'bg-slate-900',
      gradient: 'from-orange-600 to-orange-800',
      headerGradient: 'from-orange-950 via-slate-900 to-amber-950',
      accentBg: 'bg-orange-50',
      accentText: 'text-orange-700',
      badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-400/30',
      hex: {
        primary: '#ea580c',
        primaryHover: '#c2410c',
        primaryLight: '#fff7ed',
        primaryBorder: '#f97316',
        navBg: '#7c2d12',
      },
    },
    blue: {
      primaryBg: 'bg-blue-600',
      primaryHover: 'hover:bg-blue-700',
      primaryText: 'text-blue-600',
      primaryBorder: 'border-blue-600',
      primaryRing: 'focus:border-blue-500 focus:ring-blue-500',
      navBg: 'bg-blue-900',
      footerBg: 'bg-slate-900',
      gradient: 'from-blue-600 to-blue-800',
      headerGradient: 'from-blue-950 via-slate-900 to-sky-950',
      accentBg: 'bg-blue-50',
      accentText: 'text-blue-700',
      badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
      hex: {
        primary: '#2563eb',
        primaryHover: '#1d4ed8',
        primaryLight: '#eff6ff',
        primaryBorder: '#3b82f6',
        navBg: '#1e3a8a',
      },
    },
    red: {
      primaryBg: 'bg-red-600',
      primaryHover: 'hover:bg-red-700',
      primaryText: 'text-red-600',
      primaryBorder: 'border-red-600',
      primaryRing: 'focus:border-red-500 focus:ring-red-500',
      navBg: 'bg-red-900',
      footerBg: 'bg-slate-900',
      gradient: 'from-red-600 to-red-800',
      headerGradient: 'from-red-950 via-slate-900 to-rose-950',
      accentBg: 'bg-red-50',
      accentText: 'text-red-700',
      badgeBg: 'bg-red-500/20 text-red-300 border-red-400/30',
      hex: {
        primary: '#dc2626',
        primaryHover: '#b91c1c',
        primaryLight: '#fef2f2',
        primaryBorder: '#ef4444',
        navBg: '#7f1d1d',
      },
    },
    green: {
      primaryBg: 'bg-emerald-600',
      primaryHover: 'hover:bg-emerald-700',
      primaryText: 'text-emerald-600',
      primaryBorder: 'border-emerald-600',
      primaryRing: 'focus:border-emerald-500 focus:ring-emerald-500',
      navBg: 'bg-emerald-950',
      footerBg: 'bg-slate-900',
      gradient: 'from-emerald-600 to-emerald-800',
      headerGradient: 'from-emerald-950 via-slate-900 to-teal-950',
      accentBg: 'bg-emerald-50',
      accentText: 'text-emerald-700',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
      hex: {
        primary: '#059669',
        primaryHover: '#047857',
        primaryLight: '#ecfdf5',
        primaryBorder: '#10b981',
        navBg: '#064e3b',
      },
    },
    purple: {
      primaryBg: 'bg-purple-600',
      primaryHover: 'hover:bg-purple-700',
      primaryText: 'text-purple-600',
      primaryBorder: 'border-purple-600',
      primaryRing: 'focus:border-purple-500 focus:ring-purple-500',
      navBg: 'bg-purple-900',
      footerBg: 'bg-slate-900',
      gradient: 'from-purple-600 to-purple-800',
      headerGradient: 'from-purple-950 via-slate-900 to-violet-950',
      accentBg: 'bg-purple-50',
      accentText: 'text-purple-700',
      badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-400/30',
      hex: {
        primary: '#9333ea',
        primaryHover: '#7e22ce',
        primaryLight: '#faf5ff',
        primaryBorder: '#a855f7',
        navBg: '#581c87',
      },
    },
    indigo: {
      primaryBg: 'bg-indigo-600',
      primaryHover: 'hover:bg-indigo-700',
      primaryText: 'text-indigo-600',
      primaryBorder: 'border-indigo-600',
      primaryRing: 'focus:border-indigo-500 focus:ring-indigo-500',
      navBg: 'bg-indigo-950',
      footerBg: 'bg-slate-900',
      gradient: 'from-indigo-600 to-indigo-800',
      headerGradient: 'from-indigo-950 via-slate-900 to-blue-950',
      accentBg: 'bg-indigo-50',
      accentText: 'text-indigo-700',
      badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30',
      hex: {
        primary: '#4f46e5',
        primaryHover: '#4338ca',
        primaryLight: '#eef2ff',
        primaryBorder: '#6366f1',
        navBg: '#1e1b4b',
      },
    },
    slate: {
      primaryBg: 'bg-slate-700',
      primaryHover: 'hover:bg-slate-800',
      primaryText: 'text-slate-700',
      primaryBorder: 'border-slate-700',
      primaryRing: 'focus:border-slate-600 focus:ring-slate-600',
      navBg: 'bg-slate-900',
      footerBg: 'bg-slate-950',
      gradient: 'from-slate-700 to-slate-900',
      headerGradient: 'from-slate-950 via-slate-900 to-zinc-950',
      accentBg: 'bg-slate-100',
      accentText: 'text-slate-800',
      badgeBg: 'bg-slate-500/20 text-slate-300 border-slate-400/30',
      hex: {
        primary: '#334155',
        primaryHover: '#1e293b',
        primaryLight: '#f1f5f9',
        primaryBorder: '#475569',
        navBg: '#0f172a',
      },
    },
  }

  return themes[color] ?? themes.orange
}

export function mapLegacyUrl(url: string | null | undefined): string {
  if (!url) return '#'
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  if (url === '#') return '#'

  // Format: about.php?slug=about -> /pages/about
  const aboutMatch = url.match(/about\.php\?slug=([^&]+)/)
  if (aboutMatch) return `/pages/${aboutMatch[1]}`

  // Format: curriculum.php?id=1 -> /curriculum/1
  const currMatch = url.match(/curriculum\.php\?id=([^&]+)/)
  if (currMatch) return `/curriculum/${currMatch[1]}`

  // Format: news.php?id=1 -> /news/1
  const newsMatch = url.match(/news\.php\?id=([^&]+)/)
  if (newsMatch) return `/news/${newsMatch[1]}`

  // Format: gallery.php?id=1 -> /gallery/${id}
  const galleryMatch = url.match(/gallery\.php\?id=([^&]+)/)
  if (galleryMatch) return `/gallery/${galleryMatch[1]}`

  // Format: personnel_dept.php?id=1 -> /personnel?dept=1
  const deptMatch = url.match(/personnel_dept\.php\?id=([^&]+)/)
  if (deptMatch) return `/personnel?dept=${deptMatch[1]}`

  // Exact file replacements
  const mapping: Record<string, string> = {
    'index.php': '/',
    'about.php': '/pages/about',
    'news.php': '/news',
    'curriculum.php': '/curriculum',
    'personnel.php': '/personnel',
    'ita.php': '/ita',
    'complaint.php': '/complaint',
    'gallery.php': '/gallery',
    'download.php': '/downloads',
    'downloads.php': '/downloads',
    'login.php': '/admin/login',
  }

  const base = url.split('?')[0]
  if (mapping[base]) {
    const query = url.split('?')[1]
    return query ? `${mapping[base]}?${query}` : mapping[base]
  }

  return url.startsWith('/') ? url : `/${url}`
}

export interface NavItem {
  id: number
  label: string
  url: string
  icon?: string | null
  target_blank: boolean
  children?: NavItem[]
}

export function isMaintenanceActive(
  settings: SiteSettings,
  pageIdentifiers?: string[]
): boolean {
  const mode = settings.maintenance_mode
  if (!mode || mode === '0') return false
  if (mode === '1' || mode === 'all') return true
  if (mode === 'specific' && pageIdentifiers && pageIdentifiers.length > 0) {
    const rawList = (settings.maintenance_pages || '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
    const lowerPageIds = pageIdentifiers.map((p) => p.toLowerCase())
    return rawList.some(
      (m) =>
        lowerPageIds.includes(m) ||
        lowerPageIds.includes(m.replace('.php', ''))
    )
  }
  return false
}

export async function getNavTree(): Promise<NavItem[]> {
  try {
    const items = await prisma.navbars.findMany({
      where: { is_active: true },
      orderBy: { order_num: 'asc' },
    })

    const roots: NavItem[] = []
    const childrenMap = new Map<number, NavItem[]>()

    for (const item of items) {
      const navItem: NavItem = {
        id: item.id,
        label: item.label,
        url: mapLegacyUrl(item.url),
        icon: item.icon,
        target_blank: item.target_blank ?? false,
      }

      if (item.parent_id) {
        if (!childrenMap.has(item.parent_id)) {
          childrenMap.set(item.parent_id, [])
        }
        childrenMap.get(item.parent_id)!.push(navItem)
      } else {
        roots.push(navItem)
      }
    }

    for (const root of roots) {
      if (childrenMap.has(root.id)) {
        root.children = childrenMap.get(root.id)
      }
    }

    return roots
  } catch (error) {
    console.error('Failed to get navbars:', error)
    return []
  }
}
