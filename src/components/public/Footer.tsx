import React from 'react'
import Link from 'next/link'
import { MapPin, Phone, Mail, GraduationCap } from 'lucide-react'
import { SiteSettings, getThemeClasses } from '@/lib/settings'
import { normalizeLinkUrl, normalizeImageUrl } from '@/lib/url-helper'

export function Footer({ settings }: { settings: SiteSettings }) {
  const theme = getThemeClasses(settings.theme_color || 'blue')
  const logoSrc = settings.site_logo ? normalizeImageUrl(settings.site_logo) : ''

  const defaultLinks: Record<number, { label: string; url: string }> = {
    1: { label: 'เกี่ยวกับวิทยาลัย', url: 'about.php?slug=about' },
    2: { label: 'สาขาวิชาที่เปิดสอน', url: 'curriculum.php' },
    3: { label: 'ทำเนียบบุคลากร', url: 'personnel.php' },
    4: { label: 'ข่าวสารประชาสัมพันธ์', url: 'news.php' },
    5: { label: 'คลังรูปกิจกรรม', url: 'gallery.php' },
    6: { label: 'ศูนย์ดาวน์โหลด', url: 'download.php' },
  }

  const quickLinks: { label: string; url: string }[] = []
  for (let i = 1; i <= 6; i++) {
    const lbl = settings[`footer_link_${i}_label`] ?? defaultLinks[i].label
    const rawUrl = settings[`footer_link_${i}_url`] || defaultLinks[i].url
    if (lbl && lbl.trim() !== '') {
      quickLinks.push({
        label: lbl,
        url: normalizeLinkUrl(rawUrl),
      })
    }
  }

  return (
    <footer
      className={`${theme.footerBg} text-slate-400 pt-16 pb-8 border-t border-white/5`}
    >
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
        {/* Left Info Col */}
        <div className="space-y-4">
          <Link href="/" className="flex items-center gap-2 text-white">
            {logoSrc ? (
              <img
                src={logoSrc}
                width={40}
                height={40}
                loading="lazy"
                decoding="async"
                className="w-10 h-10 object-contain"
                alt="College Logo"
              />
            ) : (
              <div className="p-2 bg-orange-600 rounded-lg text-white">
                <GraduationCap className="w-5 h-5" />
              </div>
            )}
            <span className="font-extrabold text-lg tracking-tight">
              {settings.site_name || 'วิทยาลัยการอาชีพเชียงราย'}
            </span>
          </Link>
          <p className="text-xs text-slate-500 max-w-sm">
            {settings.footer_desc ||
              'วิทยาลัยมุ่งมั่นในการเรียนรู้อย่างต่อเนื่อง พัฒนาทักษะวิชาชีพ และนำเทคโนโลยีเข้ามาส่งเสริมสังคมในระดับประเทศและสากล'}
          </p>
          <div className="flex items-center gap-3">
            {settings.social_facebook && (
              <a
                href={settings.social_facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-orange-600 hover:text-white transition"
                title="Facebook"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 320 512">
                  <path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z" />
                </svg>
              </a>
            )}
            {settings.social_youtube && (
              <a
                href={settings.social_youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-rose-600 hover:text-white transition"
                title="YouTube"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 576 512">
                  <path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z" />
                </svg>
              </a>
            )}
            {settings.social_line && (
              <a
                href={settings.social_line}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-emerald-600 hover:text-white transition"
                title="LINE"
              >
                <span className="text-[9px] font-extrabold tracking-tighter">LINE</span>
              </a>
            )}
            {settings.social_twitter && (
              <a
                href={settings.social_twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-sky-500 hover:text-white transition"
                title="Twitter / X"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            )}
          </div>
        </div>

        {/* Middle Quick Links Col */}
        <div className="space-y-4">
          <h4 className="font-bold text-white text-sm uppercase tracking-wider">
            ลิงก์ด่วนภายในเว็บ
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {quickLinks.map((item, idx) => (
              <Link
                key={idx}
                href={item.url}
                className="hover:text-white transition"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Right Contacts Col */}
        <div className="space-y-4">
          <h4 className="font-bold text-white text-sm uppercase tracking-wider">
            ข้อมูลการติดต่อ
          </h4>
          <div className="space-y-3 text-xs">
            <p className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
              <span>{settings.contact_address || ''}</span>
            </p>
            <p className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-orange-500 shrink-0" />
              <span>{settings.contact_phone || ''}</span>
            </p>
            <p className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-orange-500 shrink-0" />
              <span>{settings.contact_email || ''}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 border-t border-white/5 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500 font-medium">
        <span>{settings.footer_text || ''}</span>
        <span>{settings.footer_powered_by || 'Powered by College Web CMS'}</span>
      </div>
    </footer>
  )
}

export default Footer
