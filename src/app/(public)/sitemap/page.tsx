import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { getSettings } from '@/lib/settings';
import { normalizeLinkUrl } from '@/lib/url-helper';

export const dynamic = 'force-dynamic';

export default async function SitemapPage() {
  const settings = await getSettings();

  const [navbars, staticPages, newsCategories, curriculums, departments] =
    await Promise.all([
      prisma.navbars.findMany({
        where: { is_active: true },
        orderBy: [{ order_num: 'asc' }, { id: 'asc' }],
      }),
      prisma.static_pages.findMany({
        orderBy: { id: 'asc' },
        select: { id: true, slug: true, title: true },
      }),
      prisma.news_categories.findMany({
        orderBy: { id: 'asc' },
      }),
      prisma.curriculums.findMany({
        orderBy: [{ level: 'asc' }, { id: 'asc' }],
        select: { id: true, name: true, level: true },
      }),
      prisma.personnel_categories.findMany({
        orderBy: [{ order_num: 'asc' }, { id: 'asc' }],
      }),
    ]);

  // Build 3-level navbar tree
  const parentNavs = navbars.filter((n) => !n.parent_id || n.parent_id === 0);
  const childMap = new Map<number, typeof navbars>();
  for (const n of navbars) {
    if (n.parent_id && n.parent_id !== 0) {
      const list = childMap.get(n.parent_id) || [];
      list.push(n);
      childMap.set(n.parent_id, list);
    }
  }

  // Build department hierarchy
  const mainDepts = departments.filter((d) => !d.parent_id);
  const subDeptMap = new Map<number, typeof departments>();
  for (const d of departments) {
    if (d.parent_id) {
      const list = subDeptMap.get(d.parent_id) || [];
      list.push(d);
      subDeptMap.set(d.parent_id, list);
    }
  }

  return (
    <>
      {/* Page Header */}
      <section className="relative bg-slate-900 py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-950/80 via-slate-900 to-amber-950/80 z-0"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 z-0"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/20 border border-orange-400/30 text-orange-300 text-xs font-bold mb-4 uppercase tracking-wider backdrop-blur-sm">
            <i className="fa-solid fa-sitemap"></i> Website Directory
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
            แผนผังเว็บไซต์ (Sitemap)
          </h1>
          <p className="text-slate-300 max-w-2xl mx-auto text-base md:text-lg font-light">
            โครงสร้างเมนูและสารบัญหน้าเว็บทั้งหมดของ{' '}
            {settings.site_name || 'วิทยาลัยการอาชีพศีขรภูมิ'}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 -mt-8 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 1. Main Navigation Tree */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/40 border border-slate-100">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center text-lg shadow-sm">
                <i className="fa-solid fa-compass"></i>
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-800">
                  โครงสร้างเมนูหลัก (Navigation Menu)
                </h2>
                <p className="text-xs text-slate-500">
                  รายการเมนูหลักและเมนูย่อยทั้งหมดของเว็บไซต์
                </p>
              </div>
            </div>

            <ul className="space-y-4">
              {parentNavs.map((parent) => {
                const children = childMap.get(parent.id) || [];
                const href = normalizeLinkUrl(parent.url);
                return (
                  <li
                    key={parent.id}
                    className="bg-slate-50/70 rounded-2xl p-4 border border-slate-100"
                  >
                    <Link
                      href={href}
                      className="font-bold text-slate-800 hover:text-orange-600 transition-colors flex items-center gap-2 text-sm"
                    >
                      <i
                        className={`fa-solid ${
                          parent.icon || 'fa-circle-chevron-right'
                        } text-orange-600 w-5 text-center`}
                      ></i>
                      <span>{parent.label}</span>
                    </Link>

                    {children.length > 0 && (
                      <ul className="mt-3 pl-6 space-y-2 border-l-2 border-orange-100 ml-2.5">
                        {children.map((child) => {
                          const subChildren = childMap.get(child.id) || [];
                          return (
                            <li key={child.id}>
                              <Link
                                href={normalizeLinkUrl(child.url)}
                                className="text-xs font-semibold text-slate-600 hover:text-orange-600 transition-colors flex items-center gap-2 py-0.5"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                                <span>{child.label}</span>
                              </Link>
                              {subChildren.length > 0 && (
                                <ul className="mt-1.5 pl-4 space-y-1 border-l border-slate-200 ml-1">
                                  {subChildren.map((sub) => (
                                    <li key={sub.id}>
                                      <Link
                                        href={normalizeLinkUrl(sub.url)}
                                        className="text-[11px] text-slate-500 hover:text-orange-600 transition-colors flex items-center gap-1.5 py-0.5"
                                      >
                                        <i className="fa-solid fa-angle-right text-[9px] text-slate-400"></i>
                                        <span>{sub.label}</span>
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Right Column Stack */}
          <div className="space-y-8">
            {/* 2. Static Pages & Core Services */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/40 border border-slate-100">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-lg shadow-sm">
                  <i className="fa-solid fa-file-lines"></i>
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-800">
                    หน้าข้อมูลสถานศึกษา &amp; ระบบบริการ
                  </h2>
                  <p className="text-xs text-slate-500">
                    หน้าข้อมูลพื้นฐานและช่องทางบริการออนไลน์
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link
                  href="/"
                  className="p-3 rounded-xl bg-slate-50 hover:bg-orange-50 text-slate-700 hover:text-orange-600 text-xs font-bold transition-colors flex items-center gap-2 border border-slate-100"
                >
                  <i className="fa-solid fa-house text-orange-500"></i> หน้าแรก
                  (Home)
                </Link>
                <Link
                  href="/executives"
                  className="p-3 rounded-xl bg-slate-50 hover:bg-orange-50 text-slate-700 hover:text-orange-600 text-xs font-bold transition-colors flex items-center gap-2 border border-slate-100"
                >
                  <i className="fa-solid fa-user-tie text-orange-500"></i>{' '}
                  ทำเนียบผู้บริหาร
                </Link>
                <Link
                  href="/personnel"
                  className="p-3 rounded-xl bg-slate-50 hover:bg-orange-50 text-slate-700 hover:text-orange-600 text-xs font-bold transition-colors flex items-center gap-2 border border-slate-100"
                >
                  <i className="fa-solid fa-users text-orange-500"></i>{' '}
                  ทำเนียบบุคลากร
                </Link>
                <Link
                  href="/curriculum"
                  className="p-3 rounded-xl bg-slate-50 hover:bg-orange-50 text-slate-700 hover:text-orange-600 text-xs font-bold transition-colors flex items-center gap-2 border border-slate-100"
                >
                  <i className="fa-solid fa-graduation-cap text-orange-500"></i>{' '}
                  หลักสูตรที่เปิดสอน
                </Link>
                <Link
                  href="/ita"
                  className="p-3 rounded-xl bg-slate-50 hover:bg-orange-50 text-slate-700 hover:text-orange-600 text-xs font-bold transition-colors flex items-center gap-2 border border-slate-100"
                >
                  <i className="fa-solid fa-scale-balanced text-amber-500"></i>{' '}
                  การประเมินคุณธรรม ITA
                </Link>
                <Link
                  href="/gallery"
                  className="p-3 rounded-xl bg-slate-50 hover:bg-orange-50 text-slate-700 hover:text-orange-600 text-xs font-bold transition-colors flex items-center gap-2 border border-slate-100"
                >
                  <i className="fa-solid fa-images text-purple-500"></i>{' '}
                  อัลบั้มภาพกิจกรรม
                </Link>
                <Link
                  href="/downloads"
                  className="p-3 rounded-xl bg-slate-50 hover:bg-orange-50 text-slate-700 hover:text-orange-600 text-xs font-bold transition-colors flex items-center gap-2 border border-slate-100"
                >
                  <i className="fa-solid fa-cloud-arrow-down text-emerald-500"></i>{' '}
                  ศูนย์ดาวน์โหลดเอกสาร
                </Link>
                <Link
                  href="/complaints"
                  className="p-3 rounded-xl bg-slate-50 hover:bg-orange-50 text-slate-700 hover:text-orange-600 text-xs font-bold transition-colors flex items-center gap-2 border border-slate-100"
                >
                  <i className="fa-solid fa-shield-halved text-rose-500"></i>{' '}
                  ศูนย์รับเรื่องร้องเรียน
                </Link>

                {staticPages
                  .filter((sp) => sp.slug !== 'home')
                  .map((sp) => (
                    <Link
                      key={sp.id}
                      href={sp.slug === 'about' ? '/about' : `/${sp.slug}`}
                      className="p-3 rounded-xl bg-slate-50 hover:bg-orange-50 text-slate-700 hover:text-orange-600 text-xs font-bold transition-colors flex items-center gap-2 border border-slate-100"
                    >
                      <i className="fa-regular fa-file-lines text-slate-400"></i>
                      <span className="truncate">{sp.title}</span>
                    </Link>
                  ))}
              </div>
            </div>

            {/* 3. News Categories */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/40 border border-slate-100">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center text-lg shadow-sm">
                  <i className="fa-solid fa-newspaper"></i>
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-800">
                    หมวดหมู่ข่าวประชาสัมพันธ์
                  </h2>
                  <p className="text-xs text-slate-500">
                    ข่าวสารและประกาศแยกตามหมวดหมู่
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2.5">
                <Link
                  href="/news"
                  className="px-4 py-2 rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white text-xs font-bold transition-colors"
                >
                  ข่าวทั้งหมด
                </Link>
                {newsCategories.map((nc) => (
                  <Link
                    key={nc.id}
                    href={`/news?category=${encodeURIComponent(nc.slug)}`}
                    className="px-4 py-2 rounded-xl bg-slate-50 text-slate-700 hover:bg-orange-600 hover:text-white text-xs font-bold transition-colors border border-slate-200/60"
                  >
                    {nc.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* 4. Curriculums */}
            {curriculums.length > 0 && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/40 border border-slate-100">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center text-lg shadow-sm">
                    <i className="fa-solid fa-graduation-cap"></i>
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-800">
                      หลักสูตรที่เปิดสอน ({curriculums.length})
                    </h2>
                    <p className="text-xs text-slate-500">
                      สาขาวิชาที่เปิดทำการเรียนการสอน
                    </p>
                  </div>
                </div>

                <ul className="space-y-2">
                  {curriculums.map((curr) => (
                    <li key={curr.id}>
                      <Link
                        href={`/curriculum/${curr.id}`}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-xs font-semibold text-slate-700 hover:text-orange-600 transition-colors"
                      >
                        <span className="truncate pr-2">{curr.name}</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-600 text-[10px] font-bold shrink-0">
                          {curr.level}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 5. Departments & Sub-Departments */}
            {mainDepts.length > 0 && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/40 border border-slate-100">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center text-lg shadow-sm">
                    <i className="fa-solid fa-building-user"></i>
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-800">
                      โครงสร้างฝ่ายบริหารและแผนกวิชา
                    </h2>
                    <p className="text-xs text-slate-500">
                      ฝ่ายบริหาร งาน และแผนกวิชาในสถานศึกษา
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {mainDepts.map((dept) => {
                    const subs = subDeptMap.get(dept.id) || [];
                    return (
                      <div
                        key={dept.id}
                        className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100"
                      >
                        <Link
                          href={`/personnel/dept/${dept.id}`}
                          className="text-sm font-bold text-slate-800 hover:text-orange-600 transition-colors flex items-center gap-2"
                        >
                          <i className="fa-solid fa-folder-tree text-orange-600"></i>
                          <span>{dept.name}</span>
                        </Link>
                        {subs.length > 0 && (
                          <div className="mt-2.5 pl-6 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {subs.map((sub) => (
                              <Link
                                key={sub.id}
                                href={`/personnel/sub-dept/${sub.id}`}
                                className="text-xs text-slate-600 hover:text-orange-600 transition-colors flex items-center gap-1.5 truncate"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-300 shrink-0"></span>
                                <span className="truncate">{sub.name}</span>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
