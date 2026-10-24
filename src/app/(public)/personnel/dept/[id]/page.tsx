import React from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getSettings } from '@/lib/settings';
import { normalizeImageUrl } from '@/lib/url-helper';
import PersonnelDetailsTabs from '@/components/public/PersonnelDetailsTabs';
import DepartmentSidebarNav from '@/components/public/DepartmentSidebarNav';
import {
  Building2,
  Users,
  Home,
  ChevronRight,
  ArrowRight,
  Phone,
  Mail,
  User,
  Briefcase,
  Star,
  Crown,
  GraduationCap,
  Layers,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

function parseContactInfo(raw: string | null | undefined): {
  email: string;
  phone: string;
} {
  let email = '';
  let phone = '';
  if (!raw) return { email, phone };
  const lines = raw.split(/\r?\n|,/).map((l) => l.trim());
  for (const line of lines) {
    if (line.includes('@')) {
      email = line;
    } else if (/[\d-]{9,}/.test(line)) {
      phone = line.replace(/(โทร\.?|เบอร์โทร\.?)/g, '').trim();
    }
  }
  return { email, phone };
}

export default async function PersonnelDeptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const deptId = parseInt(id, 10);
  if (isNaN(deptId) || deptId <= 0) {
    notFound();
  }

  const settings = await getSettings();

  const mainDept = await prisma.personnel_categories.findUnique({
    where: { id: deptId },
  });

  if (!mainDept) {
    notFound();
  }

  // If this category is actually a sub-department, redirect to /personnel/sub-dept/[id]
  if (mainDept.parent_id !== null) {
    redirect(`/personnel/sub-dept/${mainDept.id}`);
  }

  const subDepts = await prisma.personnel_categories.findMany({
    where: { parent_id: deptId },
    orderBy: [{ order_num: 'asc' }, { id: 'asc' }],
  });

  const subDeptMap = new Map<number, string>();
  for (const sd of subDepts) {
    subDeptMap.set(sd.id, sd.name);
  }

  const catIds = [deptId, ...subDepts.map((s) => s.id)];

  const allDeptPersonnel = await prisma.personnel.findMany({
    where: {
      is_active: true,
      category_id: { in: catIds },
    },
    orderBy: [{ order_num: 'asc' }, { id: 'asc' }],
  });

  // Format positions
  const formattedPersonnel = allDeptPersonnel.map((person) => {
    let pos = person.position || '';
    const isSub = person.category_id && person.category_id !== deptId;
    const subName =
      isSub && person.category_id ? subDeptMap.get(person.category_id) || '' : '';

    if (pos.includes('รองผู้อำนวยการ') && !pos.includes('รักษาการ')) {
      if ((person.order_num || 0) > 10 && !pos.includes('ทำหน้าที่')) {
        pos = 'ทำหน้าที่รองผู้อำนวยการ';
      }
      if (mainDept.name && !pos.includes(mainDept.name)) {
        pos = `${pos}${mainDept.name}`.trim();
      }
    } else if (
      pos.includes('หัวหน้าแผนก') &&
      subName &&
      !pos.includes(subName)
    ) {
      pos = `หัวหน้า${subName}`;
    }

    return {
      ...person,
      formattedPosition: pos,
      subDeptName: subName,
    };
  });

  // Group personnel
  let headOfDept = formattedPersonnel.find(
    (p) => p.category_id === deptId && Boolean(p.is_head)
  );

  if (!headOfDept) {
    headOfDept = formattedPersonnel.find(
      (p) =>
        p.category_id === deptId &&
        (p.position?.includes('รองผู้อำนวยการ') || p.is_executive)
    );
  }

  const remainingPersonnel = formattedPersonnel.filter(
    (p) => !headOfDept || p.id !== headOfDept.id
  );

  const directStaff = remainingPersonnel.filter(
    (p) => p.category_id === deptId
  );

  const subHeadsList = remainingPersonnel.filter(
    (p) => p.category_id !== deptId && Boolean(p.is_head)
  );

  const subStaffList = remainingPersonnel.filter(
    (p) => p.category_id !== deptId && !p.is_head
  );

  const staffGroups: {
    key: string;
    title: string;
    subtitle: string;
    staff: typeof formattedPersonnel;
  }[] = [];

  if (directStaff.length > 0) {
    staffGroups.push({
      key: 'main',
      title: `บุคลากรประจำ${mainDept.name}`,
      subtitle: `เจ้าหน้าที่และบุคลากรในสังกัดฝ่ายโดยตรง (${directStaff.length} คน)`,
      staff: directStaff,
    });
  }

  if (subHeadsList.length > 0) {
    staffGroups.push({
      key: 'sub_heads',
      title: 'หัวหน้าแผนกวิชา / หัวหน้างาน',
      subtitle: `ทำเนียบหัวหน้าแผนกในสังกัด (${subHeadsList.length} คน)`,
      staff: subHeadsList,
    });
  }

  if (subStaffList.length > 0) {
    staffGroups.push({
      key: 'sub_staff',
      title: 'บุคลากรประจำแผนกวิชา / งานในสังกัด',
      subtitle: `ครูและเจ้าหน้าที่ในแผนกต่างๆ (${subStaffList.length} คน)`,
      staff: subStaffList,
    });
  }

  const headContact = headOfDept
    ? parseContactInfo(headOfDept.contact_info)
    : { email: '', phone: '' };

  return (
    <>
      {/* Page Header */}
      <section className="relative bg-slate-900 py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-950 via-slate-900 to-amber-950 z-0"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 z-0"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-500/20 border border-orange-400/30 text-orange-300 text-xs font-bold mb-4 uppercase tracking-wider backdrop-blur-sm">
            <Building2 className="w-3.5 h-3.5" /> Department Structure
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
            {mainDept.name}
          </h1>
          <p className="text-slate-300 max-w-2xl mx-auto text-base md:text-lg font-light">
            โครงสร้างการบริหารงานและทำเนียบบุคลากรในสังกัด{' '}
            {settings.site_name || ''}
          </p>

          <nav className="flex justify-center mt-8" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3 bg-white/5 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-xs">
              <li className="inline-flex items-center">
                <Link
                  href="/"
                  className="text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <Home className="w-3.5 h-3.5" /> หน้าแรก
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 mx-1.5" />
                  <Link
                    href="/personnel"
                    className="text-slate-300 hover:text-white transition-colors"
                  >
                    ทำเนียบบุคลากร
                  </Link>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 mx-1.5" />
                  <span className="text-orange-300 font-medium">
                    {mainDept.name}
                  </span>
                </div>
              </li>
            </ol>
          </nav>
        </div>
      </section>

      {/* Main Content with Sidebar Layout */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 -mt-8 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Left Column (75%) */}
          <div className="lg:col-span-3 space-y-8">
            {/* Featured Head of Department Box */}
            {headOfDept && (
              <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative">
                <div className="h-32 bg-gradient-to-r from-orange-600 via-orange-700 to-amber-800 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                  <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>
                </div>

                <div className="px-6 sm:px-10 pb-10 relative">
                  <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 -mt-16 sm:-mt-20 mb-6">
                    {/* Portrait Photo (180x220px / 224x256px, object-top) */}
                    <div className="w-44 h-52 sm:w-48 sm:h-56 md:w-56 md:h-64 rounded-2xl p-1 bg-white shadow-xl shrink-0 relative z-10 border border-slate-200">
                      <div className="w-full h-full rounded-xl overflow-hidden bg-slate-100 relative">
                        {headOfDept.image_path ? (
                          <img
                            src={normalizeImageUrl(headOfDept.image_path)}
                            alt={headOfDept.name}
                            className="w-full h-full object-cover object-top"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-100">
                            <Briefcase className="w-16 h-16" />
                          </div>
                        )}
                      </div>
                      <div
                        className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-lg border-2 border-white"
                        title="ผู้บริหารประจำฝ่าย"
                      >
                        <Crown className="w-5 h-5 text-white" />
                      </div>
                    </div>

                    <div className="text-center sm:text-left flex-1 pt-2">
                      <span className="inline-block px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-bold mb-2 border border-orange-100">
                        ผู้บริหารประจำฝ่าย
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800">
                        {headOfDept.name}
                        {headOfDept.academic_standing
                          ? ` (${headOfDept.academic_standing})`
                          : ''}
                      </h2>
                      <p className="text-orange-600 font-bold text-base sm:text-lg mt-1">
                        {headOfDept.formattedPosition}
                      </p>
                    </div>
                  </div>

                  {/* Details Tabs */}
                  {headOfDept.details && (
                    <PersonnelDetailsTabs
                      details={headOfDept.details}
                      mode="compact"
                    />
                  )}

                  {/* Contact & Action Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-slate-100">
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                      {headContact.email && (
                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/60">
                          <Mail className="w-4 h-4 text-orange-500" />
                          <span className="text-xs font-mono">{headContact.email}</span>
                        </div>
                      )}
                      {headContact.phone && (
                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/60">
                          <Phone className="w-4 h-4 text-emerald-500" />
                          <span className="text-xs font-mono">{headContact.phone}</span>
                        </div>
                      )}
                    </div>

                    <Link
                      href={`/personnel/${headOfDept.id}`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all shadow-md shadow-orange-600/20 ml-auto cursor-pointer"
                    >
                      <span>ดูประวัติและอำนาจหน้าที่</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-Departments Cards Banner */}
            {subDepts.length > 0 && (
              <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 sm:p-8">
                <h3 className="text-lg font-extrabold text-slate-800 mb-4 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-orange-600" />
                  <span>งาน / แผนกวิชาในสังกัด ({subDepts.length})</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {subDepts.map((sub) => (
                    <Link
                      key={sub.id}
                      href={`/personnel/sub-dept/${sub.id}`}
                      className="group flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-orange-600 border border-slate-200/70 hover:border-orange-600 transition-all cursor-pointer"
                    >
                      <span className="text-xs sm:text-sm font-bold text-slate-700 group-hover:text-white truncate pr-2">
                        {sub.name}
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white shrink-0 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Grouped Staff Sections (Matching horizontal card layout) */}
            {staffGroups.map((group) => (
              <div
                key={group.key}
                className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 sm:p-8"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold shadow-2xs">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold text-slate-800">
                        {group.title}
                      </h3>
                      <p className="text-xs text-slate-500">{group.subtitle}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {group.staff.map((person) => {
                    const { email, phone } = parseContactInfo(
                       person.contact_info
                    );
                    const isSubHead =
                      group.key === 'sub_heads' && Boolean(person.is_head);

                    return (
                      <div
                        key={person.id}
                        className={`flex flex-col justify-between bg-white rounded-3xl p-5 transition duration-300 border ${
                          isSubHead
                            ? 'border-orange-300 shadow-sm bg-orange-50/10'
                            : 'border-slate-200/85 shadow-2xs hover:border-orange-300 hover:shadow-md'
                        }`}
                      >
                        <div className="flex">
                          {/* Profile Image (Portrait 110x135px, object-top) */}
                          <div className="w-[110px] h-[135px] rounded-2xl overflow-hidden shrink-0 border border-slate-200 bg-slate-50 relative group">
                            {person.image_path ? (
                              <img
                                src={normalizeImageUrl(person.image_path)}
                                alt={person.name}
                                loading="lazy"
                                className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-100">
                                <User className="w-10 h-10" />
                              </div>
                            )}
                          </div>

                          {/* Right: Info Panel */}
                          <div className="flex-1 flex flex-col justify-between pl-4 py-0.5">
                            <div>
                              {isSubHead && (
                                <span className="text-[9px] font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full inline-block mb-1.5 uppercase border border-orange-200">
                                  หัวหน้างาน / แผนก
                                </span>
                              )}

                              {group.key === 'sub_heads' &&
                                person.subDeptName && (
                                  <span className="text-[9px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full inline-block mb-1.5 uppercase ml-1">
                                    {person.subDeptName}
                                  </span>
                                )}

                              <h4 className="font-extrabold text-slate-900 text-sm md:text-base leading-snug tracking-tight">
                                {person.name}
                                {person.academic_standing
                                  ? ` (${person.academic_standing})`
                                  : ''}
                              </h4>

                              <div className="flex items-center gap-1.5 mt-1.5">
                                <GraduationCap className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                                <span className="text-[11px] font-bold text-slate-600 leading-normal">
                                  {person.formattedPosition}
                                </span>
                              </div>
                            </div>

                            {/* Contact Info */}
                            {(phone || email) && (
                              <div className="border-t border-dashed border-slate-200 pt-2 mt-2 space-y-1">
                                {phone && (
                                  <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                                    <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span className="font-mono">{phone}</span>
                                  </div>
                                )}
                                {email && (
                                  <a
                                    href={`mailto:${email}`}
                                    className="text-[10px] text-slate-500 hover:text-orange-600 flex items-center gap-1.5 transition truncate max-w-[140px]"
                                    title={email}
                                  >
                                    <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span className="font-mono truncate">
                                      {email}
                                    </span>
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Bottom Action Button */}
                        <div className="mt-4 pt-2 border-t border-slate-100 w-full">
                          <Link
                            href={`/personnel/${person.id}`}
                            className="w-full text-center py-2 px-4 bg-orange-600 hover:bg-orange-700 text-white text-[11px] font-bold rounded-xl transition shadow-xs block cursor-pointer"
                          >
                            อำนาจหน้าที่และความรับผิดชอบ
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Right Column: Sidebar Navigation (25%) */}
          <div className="lg:col-span-1">
            <DepartmentSidebarNav
              activeDeptId={deptId}
              activeSubDeptId={null}
            />
          </div>
        </div>
      </section>
    </>
  );
}
