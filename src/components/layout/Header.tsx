'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu, X, ChevronDown, GraduationCap } from 'lucide-react'
import { SiteSettings, NavItem, getThemeClasses } from '@/lib/settings'

interface HeaderProps {
  settings: SiteSettings
  navTree: NavItem[]
}

export function Header({ settings, navTree }: HeaderProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<number | null>(null)
  const theme = getThemeClasses(settings.theme_color)

  const isItemActive = (url: string) => {
    if (url === '/' && pathname === '/') return true
    if (url !== '/' && url !== '#' && pathname.startsWith(url)) return true
    return false
  }

  return (
    <header className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-100 z-50 shadow-xs transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          {settings.site_logo ? (
            <div className="relative w-12 h-12 shrink-0 transition duration-300 group-hover:scale-105">
              <Image
                src={settings.site_logo.startsWith('/') ? settings.site_logo : `/${settings.site_logo}`}
                alt={settings.site_name || 'Logo'}
                fill
                className="object-contain"
                sizes="48px"
                priority
              />
            </div>
          ) : (
            <div className={`p-2.5 ${theme.primaryBg} rounded-xl text-white shadow-lg transition duration-300 group-hover:scale-105`}>
              <GraduationCap className="w-6 h-6" />
            </div>
          )}
          <div className="flex flex-col justify-center max-w-[200px] sm:max-w-[340px] md:max-w-md">
            <h1 className="font-extrabold text-slate-900 text-sm sm:text-base md:text-lg leading-tight tracking-tight truncate">
              {settings.site_name || 'วิทยาลัยการอาชีพเชียงราย'}
            </h1>
            <span className="text-[9px] sm:text-[10px] text-slate-400 font-semibold uppercase tracking-wider block leading-tight mt-0.5 whitespace-pre-line truncate">
              {settings.site_name_en || 'Chiangrai Industrial And Community Education College'}
            </span>
          </div>
        </Link>

        {/* Desktop Navbar */}
        <nav className="hidden lg:flex items-center gap-1">
          {navTree.map((item) => {
            const hasChildren = item.children && item.children.length > 0
            const active = isItemActive(item.url) || (hasChildren && item.children?.some(c => isItemActive(c.url)))

            if (hasChildren) {
              return (
                <div key={item.id} className="relative group">
                  <button
                    className={`px-3 py-2 text-sm font-bold flex items-center gap-1.5 rounded-xl transition cursor-pointer ${
                      active ? `${theme.primaryText} bg-slate-50` : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <span>{item.label}</span>
                    <ChevronDown className="w-4 h-4 opacity-50 group-hover:rotate-180 transition duration-200" />
                  </button>

                  <div className="absolute left-0 mt-1 w-64 bg-white border border-slate-100 shadow-xl rounded-2xl p-2 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 z-50">
                    {item.children?.map((child) => (
                      <Link
                        key={child.id}
                        href={child.url}
                        target={child.target_blank ? '_blank' : undefined}
                        className={`block px-3 py-2 text-sm font-medium rounded-lg transition ${
                          isItemActive(child.url)
                            ? `${theme.primaryText} ${theme.accentBg} font-semibold`
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )
            }

            return (
              <Link
                key={item.id}
                href={item.url}
                target={item.target_blank ? '_blank' : undefined}
                className={`px-3 py-2 text-sm font-bold flex items-center gap-1.5 rounded-xl transition ${
                  active ? `${theme.primaryText} bg-slate-50` : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Mobile Hamburger Button */}
        <div className="lg:hidden flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-100 shadow-xl px-4 py-4 space-y-1">
          {navTree.map((item) => {
            const hasChildren = item.children && item.children.length > 0
            const isOpen = openDropdown === item.id

            if (hasChildren) {
              return (
                <div key={item.id} className="border-b border-slate-50 last:border-0 pb-1">
                  <button
                    onClick={() => setOpenDropdown(isOpen ? null : item.id)}
                    className="w-full flex items-center justify-between py-2 px-3 text-sm font-bold text-slate-800 rounded-lg hover:bg-slate-50 transition"
                  >
                    <span>{item.label}</span>
                    <ChevronDown className={`w-4 h-4 transition duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="pl-4 space-y-1 py-1">
                      {item.children?.map((child) => (
                        <Link
                          key={child.id}
                          href={child.url}
                          target={child.target_blank ? '_blank' : undefined}
                          onClick={() => setMobileMenuOpen(false)}
                          className="block py-1.5 px-3 text-sm text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-50"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            }

            return (
              <Link
                key={item.id}
                href={item.url}
                target={item.target_blank ? '_blank' : undefined}
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-2 px-3 text-sm font-bold rounded-lg transition ${
                  isItemActive(item.url) ? `${theme.primaryText} bg-slate-50` : 'text-slate-800 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </div>
      )}
    </header>
  )
}
