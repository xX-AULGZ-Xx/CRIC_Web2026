import React from 'react'
import Link from 'next/link'
import {
  BookOpen,
  GraduationCap,
  Users,
  Download,
  ShieldAlert,
  FileCheck2,
  Images,
} from 'lucide-react'

export function QuickAccess() {
  const items = [
    {
      title: 'เกี่ยวกับวิทยาลัย',
      subtitle: 'ประวัติ วิสัยทัศน์ และข้อมูลองค์กร',
      url: '/pages/about',
      icon: BookOpen,
      iconBg: 'bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white',
    },
    {
      title: 'สาขาวิชาที่เปิดสอน',
      subtitle: 'หลักสูตร ปวช. และ ปวส.',
      url: '/curriculum',
      icon: GraduationCap,
      iconBg: 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white',
    },
    {
      title: 'ทำเนียบบุคลากร',
      subtitle: 'คณะผู้บริหาร ครู และบุคลากรทางการศึกษา',
      url: '/personnel',
      icon: Users,
      iconBg: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white',
    },
    {
      title: 'การประเมิน ITA',
      subtitle: 'การเปิดเผยข้อมูลสาธารณะ (OIT)',
      url: '/ita',
      icon: FileCheck2,
      iconBg: 'bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white',
    },
    {
      title: 'ศูนย์ร้องเรียนทุจริต',
      subtitle: 'แจ้งเรื่องร้องเรียนและความโปร่งใส',
      url: '/complaint',
      icon: ShieldAlert,
      iconBg: 'bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white',
    },
    {
      title: 'ศูนย์ดาวน์โหลด',
      subtitle: 'แบบฟอร์มและเอกสารเผยแพร่',
      url: '/downloads',
      icon: Download,
      iconBg: 'bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white',
    },
  ]

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 -mt-6 sm:-mt-10 relative z-30 w-full">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {items.map((item, idx) => {
          const Icon = item.icon
          return (
            <Link
              key={idx}
              href={item.url}
              className="bg-white border border-slate-200/80 p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center group"
            >
              <div
                className={`p-3 rounded-2xl ${item.iconBg} transition-all duration-300 mb-3`}
              >
                <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-xs sm:text-sm group-hover:text-orange-600 transition">
                {item.title}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1 font-medium line-clamp-1 hidden sm:block">
                {item.subtitle}
              </p>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
