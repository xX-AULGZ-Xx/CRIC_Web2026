import React from 'react'
import Image from 'next/image'
import { User, Phone, Mail } from 'lucide-react'
import { getThemeClasses } from '@/lib/settings'

export interface ExecutiveData {
  id: number
  name: string
  position: string
  image_path: string | null
  contact_info: string | null
  cat_name: string
  is_executive?: boolean | number | null
}

interface ExecutivesSectionProps {
  title?: string
  subtitle?: string
  executives: ExecutiveData[]
  themeColor?: string
}

export function ExecutivesSection({
  title = 'คณะผู้บริหารระดับสูง',
  subtitle = 'ผู้สนับสนุนดูแล ขับเคลื่อนนโยบายและการศึกษาที่มีคุณภาพของวิทยาลัย',
  executives,
  themeColor = 'orange',
}: ExecutivesSectionProps) {
  if (executives.length === 0) return null

  const director = executives[0]
  const deputies = executives.slice(1)
  const theme = getThemeClasses(themeColor)

  const formatImagePath = (path: string) => {
    if (path.startsWith('http://') || path.startsWith('https://')) return path
    return path.startsWith('/') ? path : `/${path}`
  }

  return (
    <section className="bg-orange-50/40 border-t border-b border-orange-100/60 py-10 sm:py-16 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-xl mx-auto mb-10 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">{subtitle}</p>
        </div>

        {/* Director (Centered) */}
        {director && (
          <div className="flex justify-center mb-8 sm:mb-10">
            <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-md text-center flex flex-col items-center space-y-4 max-w-sm w-full hover:shadow-xl transition">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-3 border-orange-500 relative shadow-inner">
                {director.image_path ? (
                  <Image
                    src={formatImagePath(director.image_path)}
                    alt={director.name}
                    fill
                    className="object-cover object-top"
                    sizes="128px"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-400">
                    <User className="w-12 h-12" />
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-lg sm:text-xl">
                  {director.name}
                </h4>
                <span className={`text-sm ${theme.primaryText} font-bold block mt-1`}>
                  {director.position}
                </span>
                <span className="text-xs text-slate-400 font-medium block mt-0.5">
                  {director.cat_name}
                </span>
              </div>
              {director.contact_info && (
                <p className="text-xs text-slate-500 font-mono bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                  {director.contact_info}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Deputies */}
        {deputies.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto justify-center">
            {deputies.map((boss) => (
              <div
                key={boss.id}
                className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-sm hover:shadow-md transition text-center flex flex-col items-center space-y-3"
              >
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-orange-400 relative shrink-0">
                  {boss.image_path ? (
                    <Image
                      src={formatImagePath(boss.image_path)}
                      alt={boss.name}
                      fill
                      className="object-cover object-top"
                      sizes="96px"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-400">
                      <User className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="w-full">
                  <h4 className="font-extrabold text-slate-900 text-base leading-snug truncate">
                    {boss.name}
                  </h4>
                  <span className={`text-xs ${theme.primaryText} font-bold block mt-1 line-clamp-1`}>
                    {boss.position}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium block mt-0.5 truncate">
                    {boss.cat_name}
                  </span>
                </div>
                {boss.contact_info && (
                  <p className="text-[11px] text-slate-500 font-mono truncate max-w-full">
                    {boss.contact_info}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
