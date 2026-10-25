import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Phone, Mail, GraduationCap } from 'lucide-react'
import { SiteSettings, getThemeClasses, mapLegacyUrl } from '@/lib/settings'

export function Footer({ settings }: { settings: SiteSettings }) {
  const theme = getThemeClasses(settings.theme_color)

  const quickLinks = [
    {
      label: settings.footer_link_1_label || settings.footer_link_1_title || 'เกี่ยวกับวิทยาลัย',
      url: mapLegacyUrl(settings.footer_link_1_url || '/pages/about'),
    },
    {
      label: settings.footer_link_2_label || settings.footer_link_2_title || 'สาขาวิชาที่เปิดสอน',
      url: mapLegacyUrl(settings.footer_link_2_url || '/curriculum'),
    },
    {
      label: settings.footer_link_3_label || settings.footer_link_3_title || 'ทำเนียบบุคลากร',
      url: mapLegacyUrl(settings.footer_link_3_url || '/personnel'),
    },
    {
      label: settings.footer_link_4_label || settings.footer_link_4_title || 'ข่าวสารประชาสัมพันธ์',
      url: mapLegacyUrl(settings.footer_link_4_url || '/news'),
    },
    {
      label: settings.footer_link_5_label || settings.footer_link_5_title || 'คลังรูปกิจกรรม',
      url: mapLegacyUrl(settings.footer_link_5_url || '/gallery'),
    },
    {
      label: settings.footer_link_6_label || settings.footer_link_6_title || 'ศูนย์ดาวน์โหลด',
      url: mapLegacyUrl(settings.footer_link_6_url || '/downloads'),
    },
  ]

  return (
    <footer className={`${theme.footerBg} text-slate-400 pt-16 pb-8 border-t border-white/5`}>
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
        {/* Left Info Col */}
        <div className="space-y-4">
          <Link href="/" className="flex items-center gap-2.5 text-white">
            {settings.site_logo ? (
              <div className="relative w-10 h-10 shrink-0">
                <Image
                  src={settings.site_logo.startsWith('/') ? settings.site_logo : `/${settings.site_logo}`}
                  alt={settings.site_name || 'Logo'}
                  fill
                  className="object-contain"
                  sizes="40px"
                />
              </div>
            ) : (
              <div className={`p-2 ${theme.primaryBg} rounded-lg text-white`}>
                <GraduationCap className="w-5 h-5" />
              </div>
            )}
            <span className="font-extrabold text-base sm:text-lg tracking-tight">
              {settings.site_name || 'วิทยาลัยการอาชีพเชียงราย'}
            </span>
          </Link>
          <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
            {settings.footer_desc ||
              'วิทยาลัยมุ่งมั่นในการเรียนรู้อย่างต่อเนื่อง พัฒนาทักษะวิชาชีพ และนำเทคโนโลยีเข้ามาส่งเสริมสังคมในระดับประเทศและสากล'}
          </p>
          <div className="flex items-center gap-3 pt-2">
            {(settings.social_facebook || settings.facebook_url) && (
              <a
                href={settings.social_facebook || settings.facebook_url}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 ${theme.primaryHover} hover:text-white transition text-xs font-bold`}
                title="Facebook"
              >
                FB
              </a>
            )}
            {(settings.social_line || settings.line_id) && (
              <a
                href={settings.social_line || settings.line_id}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-emerald-600 hover:text-white transition text-xs font-bold"
                title="LINE"
              >
                LN
              </a>
            )}
            {(settings.social_youtube || settings.youtube_url) && (
              <a
                href={settings.social_youtube || settings.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-rose-600 hover:text-white transition text-xs font-bold"
                title="YouTube"
              >
                YT
              </a>
            )}
          </div>
        </div>

        {/* Middle Quick Links Col */}
        <div className="space-y-4">
          <h4 className="font-bold text-white text-sm uppercase tracking-wider">
            ลิงก์ด่วนภายในเว็บ
          </h4>
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            {quickLinks.map((item, idx) => (
              <Link
                key={idx}
                href={item.url}
                className="hover:text-white transition py-0.5"
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
            {settings.contact_address && (
              <p className="flex items-start gap-2.5 leading-relaxed">
                <MapPin className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <span>{settings.contact_address}</span>
              </p>
            )}
            {settings.contact_phone && (
              <p className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-orange-400 shrink-0" />
                <span>{settings.contact_phone}</span>
              </p>
            )}
            {settings.contact_email && (
              <p className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-orange-400 shrink-0" />
                <span>{settings.contact_email}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 border-t border-white/5 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500 font-medium">
        <span>{settings.footer_text || '© 2026 cric.ac.th All rights reserved.'}</span>
        <span>
          {settings.footer_powered_by ||
            'Powered by งานศูนย์ดิจิทัลและสื่อสารองค์กร วิทยาลัยการอาชีพเชียงราย'}
        </span>
      </div>
    </footer>
  )
}
