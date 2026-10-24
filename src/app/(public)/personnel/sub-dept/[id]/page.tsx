import React from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getSettings, isMaintenanceActive } from '@/lib/settings';
import { getSession } from '@/lib/auth';
import { normalizeImageUrl } from '@/lib/url-helper';
import PersonnelDetailsTabs from '@/components/public/PersonnelDetailsTabs';
import DepartmentSidebarNav from '@/components/public/DepartmentSidebarNav';
import MaintenanceView from '@/components/public/MaintenanceView';
import {
  Layers,
  Home,
  ChevronRight,
  ArrowRight,
  Phone,
  Mail,
  User,
  Users,
  Star,
  Building2,
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

export default async function PersonnelSubDeptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const subDeptId = parseInt(id, 10);
  if (isNaN(subDeptId) || subDeptId <= 0) {
    notFound();
  }

  const settings = await getSettings();
  const session = await getSession();

  if (
    !session &&
    isMaintenanceActive(settings, [
      'personnel_sub_dept.php',
      'personnel',
      'personnel_sub_dept',
    ])
  ) {
    return <MaintenanceView settings={settings} />;
  }

  const subDept = await prisma.personnel_categories.findUnique({
    where: { id: subDeptId },
    include: {
      personnel_categories: true, // Parent main department
    },
  });

  if (!subDept) {
    notFound();
  }

  if (subDept.parent_id === null) {
    redirect(`/personnel/dept/${subDept.id}`);
  }

  const mainDeptId = subDept.parent_id;
  const mainDeptName = subDept.personnel_categories?.name || '';

  // Fetch personnel in this sub-department (primary OR special duty where category_id = subDeptId)
  const [rawPersonnel, curriculums, positions] = await Promise.all([
    prisma.personnel.findMany({
      where: {
        is_active: true,
        OR: [
          { category_id: subDeptId },
          { personnel_special_duties: { some: { category_id: subDeptId } } },
        ],
      },
      include: {
        personnel_categories: true,
        personnel_special_duties: {
          include: {
            personnel_categories: true,
          },
        },
      },
    }),
    prisma.curriculums.findMany(),
    prisma.personnel_positions.findMany(),
  ]);

  const curriculumMap = new Map<number, string>(
    curriculums.map((c) => [c.id, c.name])
  );
  const positionOrderMap = new Map<string, number>(
    positions.map((p) => [p.name.trim(), p.order_num ?? 9999])
  );

  const checkIsHeadHere = (person: (typeof rawPersonnel)[0]) => {
    if (person.category_id === subDeptId && Boolean(person.is_head)) {
      return true;
    }
    return person.personnel_special_duties.some(
      (d) => d.category_id === subDeptId && Boolean(d.is_head)
    );
  };

  const sortedPersonnel = [...rawPersonnel].sort((a, b) => {
    const aHead = checkIsHeadHere(a) ? 1 : 2;
    const bHead = checkIsHeadHere(b) ? 1 : 2;
    if (aHead !== bHead) return aHead - bHead;

    const aPosOrder = a.position
      ? positionOrderMap.get(a.position.trim()) ?? 9999
      : 9999;
    const bPosOrder = b.position
      ? positionOrderMap.get(b.position.trim()) ?? 9999
      : 9999;
    if (aPosOrder !== bPosOrder) return aPosOrder - bPosOrder;

    const aOrder = a.order_num ?? 9999;
    const bOrder = b.order_num ?? 9999;
    if (aOrder !== bOrder) return aOrder - bOrder;

    return a.id - b.id;
  });

  let featuredPerson: (typeof sortedPersonnel)[0] | null = null;
  let otherStaff: typeof sortedPersonnel = [];

  if (sortedPersonnel.length > 0) {
    const headIndex = sortedPersonnel.findIndex((p) => checkIsHeadHere(p));
    if (headIndex !== -1) {
      featuredPerson = sortedPersonnel[headIndex];
      otherStaff = sortedPersonnel.filter((_, idx) => idx !== headIndex);
    } else {
      featuredPerson = sortedPersonnel[0];
      otherStaff = sortedPersonnel.slice(1);
    }
  }

  function formatPersonnelPosition(
    person: (typeof rawPersonnel)[0],
    defaultDeptName: string
  ) {
    const pos = (person.position || '').trim();
    const catName = person.personnel_categories?.name || defaultDeptName;
    let deptSuffix = '';
    if (catName && !pos.includes(catName)) {
      if (
        catName.includes('ฝ่าย') ||
        catName.includes('แผนก') ||
        catName.includes('งาน')
      ) {
        deptSuffix = ' ' + catName;
      }
    }

    let isActingDeputy = Boolean(person.is_executive);
    if (!isActingDeputy && person.personnel_special_duties?.length) {
      for (const d of person.personnel_special_duties) {
        if (d.personnel_categories?.name?.includes('ผู้บริหาร')) {
          isActingDeputy = true;
          break;
        }
      }
    }

    const actingTitle = isActingDeputy ? ' (ครู ทำหน้าที่รองผู้อำนวยการ)' : '';
    return `${pos}${actingTitle}${deptSuffix}`;
  }

  const featuredHeadContact = featuredPerson
    ? parseContactInfo(featuredPerson.contact_info)
    : { email: '', phone: '' };

  return (
    <>
      {/* Page Header */}
      <section className="relative bg-slate-900 py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-950 via-slate-900 to-amber-950 z-0"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 z-0"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-500/20 border border-orange-400/30 text-orange-300 text-xs font-bold mb-4 uppercase tracking-wider backdrop-blur-sm">
            <Layers className="w-3.5 h-3.5" /> Department Structure
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
            {subDept.name}
          </h1>
          <p className="text-slate-300 max-w-2xl mx-auto text-base md:text-lg font-light">
            สังกัด: {mainDeptName}
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
                  <Link
                    href={`/personnel/dept/${mainDeptId}`}
                    className="text-slate-300 hover:text-white transition-colors"
                  >
                    {mainDeptName}
                  </Link>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 mx-1.5" />
                  <span className="text-orange-300 font-medium">
                    {subDept.name}
                  </span>
                </div>
              </li>
            </ol>
          </nav>
        </div>
      </section>

      {/* Main Content with Sidebar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 -mt-8 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Left Column (75%) */}
          <div className="lg:col-span-3 space-y-8">
            {/* Empty State */}
            {!featuredPerson && otherStaff.length === 0 && (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 shadow-sm">
                <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <span className="font-medium text-slate-600 block text-base">
                  ยังไม่มีข้อมูลบุคลากรในสังกัดแผนกย่อยนี้
                </span>
                <p className="text-slate-400 text-xs mt-1">
                  ระบบกำลังรอการอัปเดตข้อมูลจากผู้ดูแลระบบ
                </p>
              </div>
            )}

            {/* Featured Head Box */}
            {featuredPerson && (
              <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative">
                <div className="h-32 bg-gradient-to-r from-orange-600 via-orange-700 to-amber-800 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                  <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>
                </div>

                <div className="px-6 sm:px-10 pb-8 relative">
                  <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 -mt-16 sm:-mt-20 mb-6">
                    {/* Portrait Photo (180x220px / 192x224px, object-top) */}
                    <div className="w-44 h-52 sm:w-48 sm:h-56 md:w-56 md:h-64 rounded-2xl p-1 bg-white shadow-xl shrink-0 relative z-10 border border-slate-200">
                      <div className="w-full h-full rounded-xl overflow-hidden bg-slate-100 relative group">
                        {featuredPerson.image_path ? (
                          <img
                            src={normalizeImageUrl(featuredPerson.image_path)}
                            alt={featuredPerson.name}
                            className="w-full h-full object-cover object-top transition duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-100">
                            <User className="w-16 h-16" />
                          </div>
                        )}
                      </div>
                      {checkIsHeadHere(featuredPerson) && (
                        <div
                          className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-lg border-2 border-white"
                          title="หัวหน้าหน่วยงาน"
                        >
                          <Star className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </div>

                    <div className="text-center sm:text-left flex-1 pt-2">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                        {checkIsHeadHere(featuredPerson) && (
                          <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-100">
                            หัวหน้าแผนก / หน่วยงาน
                          </span>
                        )}
                        {featuredPerson.curriculum_id &&
                          curriculumMap.has(featuredPerson.curriculum_id) && (
                            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full uppercase shadow-xs">
                              สาขา: {curriculumMap.get(featuredPerson.curriculum_id)}
                            </span>
                          )}
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800">
                        {featuredPerson.name}
                        {featuredPerson.academic_standing
                          ? ` (${featuredPerson.academic_standing})`
                          : ''}
                      </h2>
                      <p className="text-orange-600 font-bold text-base sm:text-lg mt-1">
                        {formatPersonnelPosition(featuredPerson, subDept.name)}
                      </p>
                    </div>
                  </div>

                  {/* Details Tabs */}
                  {featuredPerson.details && (
                    <div className="mt-4 mb-6">
                      <PersonnelDetailsTabs
                        details={featuredPerson.details}
                        mode="compact"
                      />
                    </div>
                  )}

                  {/* Contact & Action Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-slate-100">
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                      {featuredHeadContact.email && (
                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/60">
                          <Mail className="w-4 h-4 text-orange-500" />
                          <a
                            href={`mailto:${featuredHeadContact.email}`}
                            className="text-xs font-mono hover:text-orange-600 transition"
                          >
                            {featuredHeadContact.email}
                          </a>
                        </div>
                      )}
                      {featuredHeadContact.phone && (
                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/60">
                          <Phone className="w-4 h-4 text-emerald-500" />
                          <span className="text-xs font-mono">
                            {featuredHeadContact.phone}
                          </span>
                        </div>
                      )}
                    </div>

                    <Link
                      href={`/personnel/${featuredPerson.id}`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all shadow-md shadow-orange-600/20 ml-auto cursor-pointer"
                    >
                      <span>ดูประวัติและอำนาจหน้าที่</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Other Staff Grid (Matching 2-col horizontal card layout) */}
            {otherStaff.length > 0 && (
              <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold shadow-2xs">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-800">
                      บุคลากรในสังกัด
                    </h3>
                    <p className="text-xs text-slate-500">
                      {subDept.name} ({otherStaff.length} คน)
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5" id="personnel-grid">
                  {otherStaff.map((person) => {
                    const isHead = checkIsHeadHere(person);
                    const { email, phone } = parseContactInfo(
                      person.contact_info
                    );
                    const formattedPos = formatPersonnelPosition(
                      person,
                      subDept.name
                    );

                    const cardClasses = isHead
                      ? 'border border-rose-350 shadow-[0_4px_20px_rgba(225,29,72,0.06)] bg-rose-50/5 hover:border-rose-400'
                      : 'border border-slate-200/85 shadow-2xs hover:border-orange-300 hover:shadow-md';
                    const posTextClasses = isHead
                      ? 'text-rose-600'
                      : 'text-slate-600';

                    return (
                      <div
                        key={person.id}
                        className={`personnel-card flex flex-col justify-between bg-white rounded-3xl p-5 transition duration-300 ${cardClasses}`}
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
                          <div className="flex-1 flex flex-col justify-between pl-4 py-0.5 min-w-0">
                            <div>
                              <div className="flex flex-wrap gap-1 mb-1.5">
                                <span className="text-[9px] font-bold bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full inline-block uppercase">
                                  {person.personnel_categories?.name ||
                                    subDept.name}
                                </span>
                                {person.curriculum_id &&
                                  curriculumMap.has(person.curriculum_id) && (
                                    <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full inline-block uppercase">
                                      สาขา:{' '}
                                      {curriculumMap.get(person.curriculum_id)}
                                    </span>
                                  )}
                                {person.personnel_special_duties
                                  ?.filter((d) => d.category_id === subDeptId)
                                  .map((duty) => (
                                    <span
                                      key={duty.id}
                                      className="text-[9px] font-bold bg-orange-50 text-orange-800 px-2 py-0.5 rounded-full inline-block uppercase"
                                    >
                                      {duty.is_head && (
                                        <span className="mr-1 text-[8px] bg-rose-500 text-white px-1.5 py-0.2 rounded-md font-extrabold inline-block align-middle">
                                          หัวหน้า
                                        </span>
                                      )}
                                      หน้าที่พิเศษ:{' '}
                                      {duty.personnel_categories?.name}
                                    </span>
                                  ))}
                              </div>

                              <h4 className="font-extrabold text-slate-900 text-sm md:text-base leading-snug tracking-tight truncate">
                                {person.name}
                                {person.academic_standing
                                  ? ` (${person.academic_standing})`
                                  : ''}
                              </h4>

                              <div className="flex items-center gap-1.5 mt-1.5">
                                {isHead ? (
                                  <Star className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                ) : (
                                  <User className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                                )}
                                <span
                                  className={`text-[11px] font-bold ${posTextClasses} leading-normal truncate`}
                                >
                                  {formattedPos}
                                  {isHead && (
                                    <span className="ml-1 px-1.5 py-0.5 text-[8px] bg-rose-50 text-rose-700 font-extrabold rounded-md border border-rose-100 shrink-0 inline-block">
                                      หัวหน้าแผนกย่อย
                                    </span>
                                  )}
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
            )}
          </div>

          {/* Right Sidebar (25%) */}
          <div className="lg:col-span-1">
            <DepartmentSidebarNav
              activeDeptId={mainDeptId}
              activeSubDeptId={subDept.id}
            />
          </div>
        </div>
      </section>
    </>
  );
}
