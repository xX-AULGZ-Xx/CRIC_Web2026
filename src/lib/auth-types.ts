export interface UserSession {
  id: number
  username: string
  role: 'admin' | 'editor' | 'staff'
  email?: string | null
  allowed_pages?: string[]
}

export function hasModuleAccess(session: UserSession | null, moduleKey: string): boolean {
  if (!session) return false
  if (session.role === 'admin') return true

  // Legacy page mapping to modern modules
  const pageMap: Record<string, string[]> = {
    news: ['news.php', 'news_categories.php'],
    personnel: ['personnel.php', 'personnel_categories.php', 'personnel_positions.php'],
    galleries: ['galleries.php', 'media.php'],
    downloads: ['downloads.php'],
    curriculums: ['curriculum.php'],
    ita: ['ita.php'],
    complaints: ['complaints.php'],
    sliders: ['sliders.php'],
    pages: ['pages.php'],
    settings: ['settings.php'],
    database: ['database.php', 'backups.php'],
  }

  const allowed = session.allowed_pages || []
  if (allowed.length > 0) {
    const legacyFiles = pageMap[moduleKey] || [moduleKey]
    return legacyFiles.some((f) => allowed.includes(f)) || allowed.includes(moduleKey)
  }

  // Default fallbacks based on role
  if (session.role === 'editor') return true
  if (session.role === 'staff') {
    return ['news', 'personnel', 'galleries', 'downloads'].includes(moduleKey)
  }

  return false
}
