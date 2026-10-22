import React from 'react'
import { Phone, Mail } from 'lucide-react'
import Link from 'next/link'
import { SiteSettings, getThemeClasses } from '@/lib/settings'

export function TopBar({ settings }: { settings: SiteSettings }) {
  const theme = getThemeClasses(settings.theme_color)

  return (
    <div className={`hidden sm:block ${theme.navBg} text-white/80 text-xs py-2 border-b border-white/5 font-medium z-40 transition-all duration-300`}>
      <div className="max-w-7xl mx-auto px-6 flex flex-row justify-between items-center gap-2 w-full">
        <div className="flex items-center gap-4">
          {settings.contact_phone && (
            <a
              href={`tel:${settings.contact_phone}`}
              className="flex items-center gap-1.5 hover:text-white transition whitespace-nowrap"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>{settings.contact_phone}</span>
            </a>
          )}
          {settings.contact_email && (
            <a
              href={`mailto:${settings.contact_email}`}
              className="flex items-center gap-1.5 hover:text-white transition whitespace-nowrap"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{settings.contact_email}</span>
            </a>
          )}
        </div>

        <div className="flex items-center gap-4">
          {settings.social_facebook && (
            <a
              href={settings.social_facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition text-xs flex items-center gap-1"
            >
              <span>Facebook</span>
            </a>
          )}
          {settings.social_line && (
            <a
              href={settings.social_line}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition text-xs flex items-center gap-1"
            >
              <span>LINE</span>
            </a>
          )}
          {settings.social_youtube && (
            <a
              href={settings.social_youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition text-xs flex items-center gap-1"
            >
              <span>YouTube</span>
            </a>
          )}
          <Link
            href="/admin/login"
            className="text-white/60 hover:text-white transition text-xs ml-2 pl-3 border-l border-white/20"
          >
            {settings.login_btn_text || 'เข้าสู่ระบบจัดการ'}
          </Link>
        </div>
      </div>
    </div>
  )
}
