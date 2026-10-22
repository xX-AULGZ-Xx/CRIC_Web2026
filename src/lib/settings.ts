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
    navBg: string
    footerBg: string
    gradient: string
    accentBg: string
  }> = {
    orange: {
      primaryBg: 'bg-orange-600',
      primaryHover: 'hover:bg-orange-700',
      primaryText: 'text-orange-600',
      primaryBorder: 'border-orange-600',
      navBg: 'bg-orange-900',
      footerBg: 'bg-slate-900',
      gradient: 'from-orange-600 to-orange-800',
      accentBg: 'bg-orange-50',
    },
    blue: {
      primaryBg: 'bg-blue-600',
      primaryHover: 'hover:bg-blue-700',
      primaryText: 'text-blue-600',
      primaryBorder: 'border-blue-600',
      navBg: 'bg-blue-900',
      footerBg: 'bg-slate-900',
      gradient: 'from-blue-600 to-blue-800',
      accentBg: 'bg-blue-50',
    },
    red: {
      primaryBg: 'bg-red-600',
      primaryHover: 'hover:bg-red-700',
      primaryText: 'text-red-600',
      primaryBorder: 'border-red-600',
      navBg: 'bg-red-900',
      footerBg: 'bg-slate-900',
      gradient: 'from-red-600 to-red-800',
      accentBg: 'bg-red-50',
    },
    green: {
      primaryBg: 'bg-emerald-600',
      primaryHover: 'hover:bg-emerald-700',
      primaryText: 'text-emerald-600',
      primaryBorder: 'border-emerald-600',
      navBg: 'bg-emerald-950',
      footerBg: 'bg-slate-900',
      gradient: 'from-emerald-600 to-emerald-800',
      accentBg: 'bg-emerald-50',
    },
    purple: {
      primaryBg: 'bg-purple-600',
      primaryHover: 'hover:bg-purple-700',
      primaryText: 'text-purple-600',
      primaryBorder: 'border-purple-600',
      navBg: 'bg-purple-900',
      footerBg: 'bg-slate-900',
      gradient: 'from-purple-600 to-purple-800',
      accentBg: 'bg-purple-50',
    },
    indigo: {
      primaryBg: 'bg-indigo-600',
      primaryHover: 'hover:bg-indigo-700',
      primaryText: 'text-indigo-600',
      primaryBorder: 'border-indigo-600',
      navBg: 'bg-indigo-950',
      footerBg: 'bg-slate-900',
      gradient: 'from-indigo-600 to-indigo-800',
      accentBg: 'bg-indigo-50',
    },
    slate: {
      primaryBg: 'bg-slate-700',
      primaryHover: 'hover:bg-slate-800',
      primaryText: 'text-slate-700',
      primaryBorder: 'border-slate-700',
      navBg: 'bg-slate-900',
      footerBg: 'bg-slate-950',
      gradient: 'from-slate-700 to-slate-900',
      accentBg: 'bg-slate-100',
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
