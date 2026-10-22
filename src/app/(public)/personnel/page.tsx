import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import { getSettings, getThemeClasses } from '@/lib/settings'
import { User, Phone, Mail, Award, Users, Search } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{
    dept?: string
    q?: string
  }>
}

export default async function PersonnelPage(props: Props) {
  const searchParams = await props.searchParams
  const deptFilter = searchParams.dept
  const searchQuery = (searchParams.q || '').trim()

  const [settings, categories, allPersonnel, specialDuties] = await Promise.all([
    getSettings(),
    prisma.personnel_categories.findMany({
      orderBy: { order_num: 'asc' },
    }),
    prisma.personnel.findMany({
      where: { is_active: true },
      include: {
        personnel_categories: true,
      },
      orderBy: [
        { is_executive: 'desc' },
        { order_num: 'asc' },
        { id: 'asc' },
      ],
    }),
    prisma.personnel_special_duties.findMany({
      include: {
        personnel_categories: true,
      },
    }),
  ])

  const theme = getThemeClasses(settings.theme_color)

  // Map special duties by personnel_id
  const dutiesMap = new Map<number, any[]>()
  for (const duty of specialDuties) {
    if (!dutiesMap.has(duty.personnel_id)) {
      dutiesMap.set(duty.personnel_id, [])
    }
    dutiesMap.get(duty.personnel_id)!.push(duty)
  }

  // Filter personnel
  let filtered = allPersonnel
  if (deptFilter) {
    const deptId = parseInt(deptFilter, 10)
    if (!isNaN(deptId)) {
      filtered = filtered.filter((p) => p.category_id === deptId)
    }
  }

  if (searchQuery) {
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.position.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  // Group personnel by Category
  const groupedCategories: {
    category: any
    members: typeof allPersonnel
  }[] = []

  if (deptFilter || searchQuery) {
    // Show flat
    groupedCategories.push({
      category: {
        name: deptFilter
          ? categories.find((c) => c.id === parseInt(deptFilter, 10))?.name || 'บุคลากร'
          : `ผลการค้นหา "${searchQuery}"`,
      },
      members: filtered,
    })
  } else {
    // Group by category order
    for (const cat of categories) {
      const members = allPersonnel.filter((p) => p.category_id === cat.id)
      if (members.length > 0) {
        groupedCategories.push({
          category: cat,
          members,
        })
      }
    }
    // Also include any with null category
    const uncat = allPersonnel.filter((p) => !p.category_id)
    if (uncat.length > 0) {
      groupedCategories.push({
        category: { name: 'อื่นๆ' },
        members: uncat,
      })
    }
  }

  const formatImagePath = (path: string) => {
    if (path.startsWith('http://') || path.startsWith('https://')) return path
    return path.startsWith('/') ? path : `/${path}`
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          ทำเนียบบุคลากร
        </h1>
        <p className="text-sm text-slate-500 mt-1.5">
          คณะผู้บริหาร ครู และบุคลากรทางการศึกษา วิทยาลัยการอาชีพเชียงราย (รวมทั้งหมด {allPersonnel.length} ท่าน)
        </p>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-10">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          <Link
            href="/personnel"
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
              !deptFilter && !searchQuery
                ? `${theme.primaryBg} text-white shadow-sm`
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            ทั้งหมด
          </Link>
          {categories.map((cat) => {
            const active = deptFilter === String(cat.id)
            return (
              <Link
                key={cat.id}
                href={`/personnel?dept=${cat.id}`}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
                  active
                    ? `${theme.primaryBg} text-white shadow-sm`
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {cat.name}
              </Link>
            )
          })}
        </div>

        <form action="/personnel" method="GET" className="flex items-center gap-2 max-w-sm w-full">
          {deptFilter && <input type="hidden" name="dept" value={deptFilter} />}
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              name="q"
              defaultValue={searchQuery}
              placeholder="ค้นหาชื่อหรือตำแหน่ง..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
            />
          </div>
          <button
            type="submit"
            className={`px-4 py-2 ${theme.primaryBg} text-white rounded-xl text-xs sm:text-sm font-bold transition hover:opacity-90`}
          >
            ค้นหา
          </button>
        </form>
      </div>

      {/* Grouped Personnel Sections */}
      <div className="space-y-12">
        {groupedCategories.map((group, gIdx) => (
          <section key={gIdx} className="space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
              <Users className="w-5 h-5 text-orange-600" />
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                {group.category.name}
              </h2>
              <span className="text-xs text-slate-400 font-semibold bg-slate-100 px-2.5 py-0.5 rounded-full">
                {group.members.length} ท่าน
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {group.members.map((person) => {
                const duties = dutiesMap.get(person.id) || []

                return (
                  <div
                    key={person.id}
                    className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center group"
                  >
                    {/* Photo */}
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-orange-400/80 relative shadow-inner mb-4 group-hover:scale-105 transition duration-300">
                      {person.image_path ? (
                        <Image
                          src={formatImagePath(person.image_path)}
                          alt={person.name}
                          fill
                          className="object-cover object-top"
                          sizes="112px"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
                          <User className="w-10 h-10" />
                        </div>
                      )}
                    </div>

                    {/* Name & Position */}
                    <h3 className="font-extrabold text-slate-900 text-base leading-snug">
                      {person.name}
                    </h3>
                    <p className={`text-xs ${theme.primaryText} font-bold mt-1 leading-tight`}>
                      {person.position}
                    </p>

                    {/* Special Duties */}
                    {duties.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-1 mt-2">
                        {duties.map((d, dIdx) => (
                          <span
                            key={dIdx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-50 text-orange-700 text-[10px] font-semibold rounded-md border border-orange-200/50"
                          >
                            <Award className="w-3 h-3" />
                            <span>
                              {d.special_position || d.personnel_categories?.name}
                            </span>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Contact Info */}
                    {person.contact_info && (
                      <div className="mt-4 pt-3 border-t border-slate-100 w-full text-[11px] text-slate-500 font-mono truncate">
                        {person.contact_info}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        ))}

        {groupedCategories.length === 0 && (
          <div className="py-20 text-center text-slate-400 bg-white border border-dashed border-slate-200 rounded-3xl">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-base font-semibold">ไม่พบบุคลากรตามเงื่อนไขที่เลือก</p>
          </div>
        )}
      </div>
    </div>
  )
}
