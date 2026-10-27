'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Phone,
  Mail,
  Home,
  Info,
  Users,
  BookOpen,
  Newspaper,
  Images,
  Download,
  Shield,
  ShieldAlert,
  Award,
  FileText,
  ExternalLink,
  Calendar,
  LayoutDashboard,
  LogOut,
  LogIn,
} from 'lucide-react'
import { SiteSettings, getThemeClasses } from '@/lib/settings'
import { normalizeLinkUrl, normalizeImageUrl } from '@/lib/url-helper'

export interface RawNavbarItem {
  id: number
  parent_id?: number | null
  label: string
  url: string
  icon?: string | null
  order_num?: number | null
  is_active?: boolean | null
  target_blank?: boolean | null
  children?: RawNavbarItem[]
}

export interface NestedNavItem {
  id: number
  parent_id: number | null
  label: string
  url: string
  icon?: string | null
  target_blank: boolean
  children: NestedNavItem[]
}

interface HeaderProps {
  settings: SiteSettings
  navbars?: RawNavbarItem[]
  navTree?: NestedNavItem[] | RawNavbarItem[]
  isLoggedIn?: boolean
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  home: Home,
  info: Info,
  users: Users,
  'book-open': BookOpen,
  newspaper: Newspaper,
  images: Images,
  download: Download,
  phone: Phone,
  mail: Mail,
  shield: Shield,
  'shield-alert': ShieldAlert,
  award: Award,
  'file-text': FileText,
  'external-link': ExternalLink,
  'graduation-cap': GraduationCap,
  calendar: Calendar,
}

function DynamicMenuIcon({
  name,
  className = 'w-4 h-4',
}: {
  name?: string | null
  className?: string
}) {
  if (!name) return null
  const cleanName = name.trim().toLowerCase()
  const IconComp = ICON_MAP[cleanName]
  if (!IconComp) return null
  return <IconComp className={className} />
}

function buildThreeLevelNavTree(
  navbars?: RawNavbarItem[],
  navTree?: RawNavbarItem[]
): NestedNavItem[] {
  if (navbars && navbars.length > 0) {
    const byParent = new Map<number | null, RawNavbarItem[]>()
    for (const item of navbars) {
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

    return buildLevel(null, 1)
  }

  if (navTree && navTree.length > 0) {
    const mapRecursive = (items: RawNavbarItem[], depth: number): NestedNavItem[] => {
      if (depth > 3) return []
      return items.map((item) => ({
        id: item.id,
        parent_id: item.parent_id ?? null,
        label: item.label,
        url: normalizeLinkUrl(item.url),
        icon: item.icon,
        target_blank: Boolean(item.target_blank),
        children: item.children ? mapRecursive(item.children, depth + 1) : [],
      }))
    }
    return mapRecursive(navTree, 1)
  }

  return []
}

export function Header({
  settings,
  navbars,
  navTree,
  isLoggedIn = false,
}: HeaderProps) {
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [mobileOpenIds, setMobileOpenIds] = useState<Record<number, boolean>>({})

  const theme = getThemeClasses(settings.theme_color || 'blue')
  const showIcons = settings.show_navbar_icons !== '0'
  const showMourningRibbon = settings.show_mourning_ribbon === '1'
  const showLoginBtn = settings.show_login_btn !== '0'
  const loginBtnText = settings.login_btn_text || 'เข้าสู่ระบบจัดการ'

  const menus: NestedNavItem[] =
    navTree && navTree.length > 0 && 'children' in navTree[0]
      ? (navTree as NestedNavItem[])
      : buildThreeLevelNavTree(navbars, navTree as RawNavbarItem[])

  useEffect(() => {
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const next = window.scrollY > 50
          setIsScrolled((prev) => (prev !== next ? next : prev))
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const [currentSearch, setCurrentSearch] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentSearch(window.location.search)
    }
  }, [pathname])

  const isMenuActive = (menuUrl: string): boolean => {
    if (!menuUrl || menuUrl === '#') return false
    if (menuUrl.startsWith('http://') || menuUrl.startsWith('https://')) return false

    const [urlPath, urlQuery] = menuUrl.split('?')

    // 1. If menu item has query parameters (e.g. /curriculum?id=23 or ?slug=vision)
    if (urlQuery) {
      if (pathname !== urlPath) return false
      if (!currentSearch) return false
      const searchParams = new URLSearchParams(currentSearch.replace(/^\?/, ''))
      const menuParams = new URLSearchParams(urlQuery)
      for (const [key, val] of menuParams.entries()) {
        if (searchParams.get(key) !== val) {
          return false
        }
      }
      return true
    }

    // 2. Exact match for homepage
    if (urlPath === '/' && pathname === '/') {
      return true
    }

    // 3. For pages without query parameters:
    if (urlPath !== '/') {
      if (pathname === urlPath) {
        return true
      }
      if (pathname.startsWith(`${urlPath}/`)) {
        return true
      }
    }
    return false
  }

  const isBranchActive = (node: NestedNavItem): boolean => {
    if (isMenuActive(node.url)) return true
    return node.children.some((child) => isBranchActive(child))
  }

  const toggleMobileGroup = (id: number) => {
    setMobileOpenIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      window.location.href = '/'
    } catch {
      window.location.href = '/'
    }
  }

  const logoSrc = settings.site_logo ? normalizeImageUrl(settings.site_logo) : ''

  return (
    <>
      {/* Mourning ribbon (Responsive sizing, decorative only, unclickable click-through) */}
      {showMourningRibbon && (
        <div
          id="ribbon-wrapper"
          className="fixed z-[999999] pointer-events-none top-0 left-0 w-[80px] h-[80px] sm:w-[150px] sm:h-[150px]"
        >
          <img
            src="https://ribbon.get-qr.net/black_ribbon_top_left.png"
            alt="mourning ribbon"
            className="w-full h-full block object-contain"
          />
        </div>
      )}

      {/* Top contact info bar */}
      <div
        id="top-bar"
        className={`hidden sm:block ${theme.navBg} text-white/80 text-xs py-2 border-b border-white/5 font-medium z-40 transition-all duration-300`}
      >
        <div className="max-w-7xl mx-auto px-6 flex flex-row justify-between items-center gap-2 w-full">
          <div className="flex items-center gap-4">
            {settings.contact_phone && (
              <a
                href={`tel:${settings.contact_phone}`}
                className="flex items-center gap-1 hover:text-white transition whitespace-nowrap"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{settings.contact_phone}</span>
              </a>
            )}
            {settings.contact_email && (
              <a
                href={`mailto:${settings.contact_email}`}
                className="flex items-center gap-1 hover:text-white transition whitespace-nowrap"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>{settings.contact_email}</span>
              </a>
            )}
          </div>

          <div className="flex items-center gap-3">
            {(settings.social_facebook || settings.facebook_url) && (
              <a
                href={settings.social_facebook || settings.facebook_url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition"
                title="Facebook"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 320 512">
                  <path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z" />
                </svg>
              </a>
            )}
            {(settings.social_youtube || settings.youtube_url) && (
              <a
                href={settings.social_youtube || settings.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition"
                title="YouTube"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 576 512">
                  <path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z" />
                </svg>
              </a>
            )}
            {(settings.social_line || settings.line_id) && (
              <a
                href={settings.social_line || settings.line_id}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition flex items-center gap-1"
                title="LINE"
              >
                <span className="text-[10px] font-extrabold">LINE</span>
              </a>
            )}
            {settings.social_twitter && (
              <a
                href={settings.social_twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition"
                title="Twitter / X"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <header
        id="main-header"
        className={`sticky top-0 backdrop-blur-md border-b border-slate-100 z-50 transition-all duration-300 ${
          isScrolled ? 'shadow-md bg-white/98' : 'bg-white/95 shadow-sm'
        }`}
      >
        <div
          id="header-container"
          className={`max-w-7xl mx-auto px-6 flex items-center justify-between transition-all duration-300 ${
            isScrolled ? 'h-16' : 'h-20'
          }`}
        >
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            {logoSrc ? (
              <Image
                src={logoSrc}
                width={48}
                height={48}
                priority
                fetchPriority="high"
                className="w-12 h-12 object-contain transition duration-300 group-hover:scale-105"
                alt="College Logo"
              />
            ) : (
              <div
                className={`p-2.5 ${theme.primaryBg} ${theme.primaryHover} rounded-xl text-white shadow-lg transition duration-300 group-hover:scale-105`}
              >
                <GraduationCap className="w-6 h-6" />
              </div>
            )}
            <div className="flex flex-col justify-center max-w-[200px] sm:max-w-[320px] md:max-w-md my-auto">
              <h1 className="font-extrabold text-slate-900 text-sm sm:text-base md:text-lg leading-none tracking-tight truncate">
                {settings.site_name || 'วิทยาลัยการอาชีพเชียงราย'}
              </h1>
              <span className="text-[8px] sm:text-[9px] text-slate-500 font-semibold uppercase tracking-wide block leading-normal mt-1 whitespace-pre-line">
                {settings.site_name_en || 'College Web CMS System'}
              </span>
            </div>
          </Link>

          {/* Client Navbar Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1">
            {menus.map((parent) => {
              const hasChildren = parent.children.length > 0
              const isParentActive = isBranchActive(parent)

              if (hasChildren) {
                const parentActiveClass = isParentActive
                  ? `${theme.primaryText} bg-slate-50`
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'

                const parentHref =
                  parent.url && parent.url !== '#' ? parent.url : '#'

                return (
                  <div key={parent.id} className="relative group">
                    <Link
                      href={parentHref}
                      target={parent.target_blank ? '_blank' : undefined}
                      rel={parent.target_blank ? 'noopener noreferrer' : undefined}
                      onClick={(e) => {
                        if (parentHref === '#') e.preventDefault()
                      }}
                      className={`px-3 py-2.5 text-sm font-bold flex items-center gap-1.5 rounded-xl transition whitespace-nowrap ${parentActiveClass}`}
                    >
                      {showIcons && parent.icon && (
                        <DynamicMenuIcon
                          name={parent.icon}
                          className="w-4 h-4 opacity-70"
                        />
                      )}
                      <span>{parent.label}</span>
                      <ChevronDown className="w-4 h-4 opacity-50 group-hover:rotate-180 transition duration-200" />
                    </Link>

                    {/* Level 2 Dropdown List */}
                    <div className="absolute left-1/2 -translate-x-1/2 pt-2 w-64 opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-200 z-50">
                      <div className="bg-white/98 backdrop-blur-md border border-slate-100 shadow-2xl rounded-2xl p-2 space-y-0.5">
                        {parent.children.map((child) => {
                          const hasSubChildren = child.children.length > 0
                          const childActive = isBranchActive(child)
                            ? `${theme.accentBg} ${theme.accentText} font-bold ring-1 ring-orange-200/50`
                            : 'text-slate-700 hover:bg-orange-50/70 hover:text-orange-600 group-hover/sub:bg-orange-50/70 group-hover/sub:text-orange-600'

                          if (hasSubChildren) {
                            return (
                              <div key={child.id} className="relative group/sub">
                                <div
                                  className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-semibold rounded-xl transition cursor-pointer select-none ${childActive}`}
                                >
                                  <span className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover/sub:bg-orange-500 transition-colors" />
                                    <span>{child.label}</span>
                                  </span>
                                  <div className="flex items-center gap-1.5 text-xs text-slate-400 group-hover/sub:text-slate-600">
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 group-hover/sub:bg-orange-100 group-hover/sub:text-orange-700 text-slate-500 font-medium transition-colors">
                                      {child.children.length} สาขา
                                    </span>
                                    <ChevronRight className="w-3.5 h-3.5 group-hover/sub:translate-x-0.5 transition-transform" />
                                  </div>
                                </div>
                                {/* Level 3 Sub-dropdown List */}
                                <div className="absolute left-full top-0 pl-2 w-72 opacity-0 invisible translate-x-2 group-hover/sub:opacity-100 group-hover/sub:visible group-hover/sub:translate-x-0 transition-all duration-200 z-50 before:absolute before:inset-y-0 before:-left-3 before:w-5 before:content-['']">
                                  <div className="bg-white/98 backdrop-blur-md border border-slate-100 shadow-2xl rounded-2xl p-2 max-h-[75vh] overflow-y-auto overscroll-contain">
                                    <div className="px-3 py-1.5 mb-1.5 border-b border-slate-100 flex items-center justify-between">
                                      <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                                        ระดับ {child.label}
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-medium">
                                        {child.children.length} สาขาวิชา
                                      </span>
                                    </div>
                                    <div className="space-y-0.5">
                                      {child.children.map((subChild) => {
                                        const subChildActive = isMenuActive(subChild.url)
                                          ? `${theme.accentBg} ${theme.accentText} font-bold ring-1 ring-orange-200/50`
                                          : 'text-slate-600 hover:bg-orange-50/70 hover:text-orange-600'
                                        return (
                                          <Link
                                            key={subChild.id}
                                            href={subChild.url}
                                            target={subChild.target_blank ? '_blank' : undefined}
                                            rel={
                                              subChild.target_blank
                                                ? 'noopener noreferrer'
                                                : undefined
                                            }
                                            className={`block px-3 py-2 text-xs font-semibold rounded-lg transition truncate ${subChildActive}`}
                                            title={subChild.label}
                                          >
                                            {subChild.label}
                                          </Link>
                                        )
                                      })}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          }

                          return (
                            <Link
                              key={child.id}
                              href={child.url}
                              target={child.target_blank ? '_blank' : undefined}
                              rel={child.target_blank ? 'noopener noreferrer' : undefined}
                              className={`flex items-center gap-2 px-3.5 py-2.5 text-sm font-semibold rounded-xl transition ${childActive}`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 transition-colors" />
                              <span>{child.label}</span>
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )
              }

              const linkActive = isMenuActive(parent.url)
                ? `${theme.badgeBg} ${theme.primaryText}`
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'

              return (
                <Link
                  key={parent.id}
                  href={parent.url}
                  target={parent.target_blank ? '_blank' : undefined}
                  rel={parent.target_blank ? 'noopener noreferrer' : undefined}
                  className={`px-3 py-2.5 text-sm font-bold flex items-center gap-1.5 rounded-xl transition whitespace-nowrap ${linkActive}`}
                >
                  {showIcons && parent.icon && (
                    <DynamicMenuIcon
                      name={parent.icon}
                      className="w-4 h-4 opacity-70"
                    />
                  )}
                  <span>{parent.label}</span>
                </Link>
              )
            })}

            {isLoggedIn ? (
              <>
                <Link
                  href="/admin"
                  className={`ml-4 px-4 py-2 text-xs font-bold text-white ${theme.primaryBg} ${theme.primaryHover} rounded-xl shadow-md transition transform hover:scale-105 duration-150 whitespace-nowrap`}
                >
                  แผงควบคุม
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="ml-2 px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 transition whitespace-nowrap cursor-pointer"
                >
                  ออกจากระบบ
                </button>
              </>
            ) : showLoginBtn ? (
              <Link
                href="/admin/login"
                className={`ml-4 px-4 py-2 text-xs font-bold text-white ${theme.primaryBg} ${theme.primaryHover} rounded-xl shadow-md transition transform hover:scale-105 duration-150 whitespace-nowrap`}
              >
                {loginBtnText}
              </Link>
            ) : null}
          </nav>

          {/* Mobile menu trigger */}
          <button
            type="button"
            id="client-mobile-btn"
            onClick={() => setMobileDrawerOpen(true)}
            className="lg:hidden p-2 hover:bg-slate-50 rounded-xl text-slate-700"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      <div
        id="client-mobile-sidebar"
        onClick={(e) => {
          if (e.target === e.currentTarget) setMobileDrawerOpen(false)
        }}
        className={`fixed inset-0 bg-slate-900/60 z-50 backdrop-blur-sm transition-opacity duration-300 flex justify-end ${
          mobileDrawerOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none hidden'
        }`}
      >
        <div
          id="client-mobile-sidebar-content"
          className={`w-64 bg-slate-900 h-full flex flex-col p-4 shadow-2xl relative transition-transform duration-300 ${
            mobileDrawerOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <button
            type="button"
            id="close-client-mobile-menu"
            onClick={() => setMobileDrawerOpen(false)}
            className="absolute top-4 right-4 text-slate-400 hover:text-white"
            aria-label="Close menu"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="mb-8 pt-2 pr-6">
            <span className="font-extrabold text-white text-lg block leading-tight">
              {settings.site_name || 'วิทยาลัยการอาชีพเชียงราย'}
            </span>
            <span className="text-[10px] text-slate-500 font-bold uppercase block mt-1">
              เมนูระบบนำทาง
            </span>
          </div>

          <nav className="flex-1 space-y-2 overflow-y-auto pr-1">
            {menus.map((parent) => {
              const hasChildren = parent.children.length > 0
              const isParentOpen = Boolean(mobileOpenIds[parent.id])

              if (hasChildren) {
                return (
                  <div key={parent.id} className="space-y-1">
                    <button
                      type="button"
                      onClick={() => toggleMobileGroup(parent.id)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-800 text-slate-300 text-sm font-bold transition"
                    >
                      <span className="flex items-center gap-3">
                        {showIcons && parent.icon && (
                          <DynamicMenuIcon name={parent.icon} className="w-4 h-4" />
                        )}
                        <span>{parent.label}</span>
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 transition duration-200 ${
                          isParentOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {isParentOpen && (
                      <div className="pl-4 space-y-1 bg-slate-950/40 rounded-xl py-1">
                        {parent.children.map((child) => {
                          const hasSubChildren = child.children.length > 0
                          const isChildOpen = Boolean(mobileOpenIds[child.id])

                          if (hasSubChildren) {
                            return (
                              <div key={child.id} className="space-y-1">
                                <button
                                  type="button"
                                  onClick={() => toggleMobileGroup(child.id)}
                                  className="w-full flex items-center justify-between px-3 py-2 text-slate-400 hover:text-white text-xs font-semibold transition"
                                >
                                  <span>{child.label}</span>
                                  <ChevronDown
                                    className={`w-3.5 h-3.5 opacity-50 transition duration-200 ${
                                      isChildOpen ? 'rotate-180' : ''
                                    }`}
                                  />
                                </button>
                                {isChildOpen && (
                                  <div className="pl-4 space-y-1 bg-slate-950/20 rounded-lg py-1 border-l border-slate-800 ml-2">
                                    {child.children.map((subChild) => {
                                      const mSubActive = isMenuActive(subChild.url)
                                        ? 'text-white font-bold bg-slate-800'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                      return (
                                        <Link
                                          key={subChild.id}
                                          href={subChild.url}
                                          target={
                                            subChild.target_blank ? '_blank' : undefined
                                          }
                                          rel={
                                            subChild.target_blank
                                              ? 'noopener noreferrer'
                                              : undefined
                                          }
                                          onClick={() => setMobileDrawerOpen(false)}
                                          className={`block px-4 py-1.5 rounded-lg text-[10px] font-semibold transition ${mSubActive}`}
                                        >
                                          {subChild.label}
                                        </Link>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            )
                          }

                          const mChildActive = isMenuActive(child.url)
                            ? 'text-white font-bold bg-slate-800'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'

                          return (
                            <Link
                              key={child.id}
                              href={child.url}
                              target={child.target_blank ? '_blank' : undefined}
                              rel={
                                child.target_blank ? 'noopener noreferrer' : undefined
                              }
                              onClick={() => setMobileDrawerOpen(false)}
                              className={`block px-4 py-2 rounded-lg text-xs font-semibold transition ${mChildActive}`}
                            >
                              {child.label}
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              }

              const mLinkActive = isMenuActive(parent.url)
                ? 'text-white font-bold bg-slate-800'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'

              return (
                <Link
                  key={parent.id}
                  href={parent.url}
                  target={parent.target_blank ? '_blank' : undefined}
                  rel={parent.target_blank ? 'noopener noreferrer' : undefined}
                  onClick={() => setMobileDrawerOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-sm font-bold ${mLinkActive}`}
                >
                  {showIcons && parent.icon && (
                    <DynamicMenuIcon name={parent.icon} className="w-4 h-4" />
                  )}
                  <span>{parent.label}</span>
                </Link>
              )
            })}

            <div className="pt-6 mt-6 border-t border-slate-800 space-y-2">
              {isLoggedIn ? (
                <>
                  <Link
                    href="/admin"
                    onClick={() => setMobileDrawerOpen(false)}
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 ${theme.primaryBg} ${theme.primaryHover} text-white font-bold rounded-xl text-xs shadow-lg transition`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>แผงควบคุม (CMS)</span>
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>ออกจากระบบ</span>
                  </button>
                </>
              ) : showLoginBtn ? (
                <Link
                  href="/admin/login"
                  onClick={() => setMobileDrawerOpen(false)}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 ${theme.primaryBg} ${theme.primaryHover} text-white font-bold rounded-xl text-xs shadow-lg transition`}
                >
                  <LogIn className="w-4 h-4" />
                  <span>{loginBtnText}</span>
                </Link>
              ) : null}
            </div>
          </nav>
        </div>
      </div>
    </>
  )
}

export default Header
