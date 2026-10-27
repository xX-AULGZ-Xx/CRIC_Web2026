import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { getSettings, isMaintenanceActive } from '@/lib/settings';
import { getSession } from '@/lib/auth';
import { normalizeImageUrl } from '@/lib/url-helper';
import MaintenanceView from '@/components/public/MaintenanceView';
import {
  Shield,
  Crown,
  Star,
  Phone,
  Mail,
  Home,
  ChevronRight,
  Users,
  Briefcase,
  User,
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

export default async function ExecutivesPage() {
  const settings = await getSettings();
  const session = await getSession();

  if (!session && isMaintenanceActive(settings, ['executives.php', 'executives'])) {
    return <MaintenanceView settings={settings} />;
  }

  const rawExecs = await prisma.personnel.findMany({
    where: {
      is_active: true,
      OR: [
        { is_executive: true },
        { position: { contains: 'ผู้อำนวยการ' } },
        { position: { contains: 'รองผู้อำนวยการ' } },
        { personnel_categories: { name: { contains: 'ผู้บริหาร' } } },
      ],
    },
    include: {
      personnel_categories: {
        include: {
          personnel_categories: true, // Parent main department
        },
      },
    },
    orderBy: [{ order_num: 'asc' }, { id: 'asc' }],
  });

  const formattedExecs = rawExecs.map((person) => {
    let pos = person.position || '';
    const cat = person.personnel_categories;
    const parentCat = cat?.personnel_categories || null;
    const mainDeptName = parentCat ? parentCat.name : cat?.name || '';
    const subDeptName = parentCat ? cat?.name || '' : '';

    let deptDisplay = '';
    if (mainDeptName && subDeptName) {
      deptDisplay = `${mainDeptName} (${subDeptName})`;
    } else if (mainDeptName) {
      deptDisplay = mainDeptName;
    }

    const isDirector =
      person.order_num === 1 ||
      (pos.includes('ผู้อำนวยการ') && !pos.includes('รอง'));

    if (!isDirector) {
      const isActingDeputy = !pos.includes('รองผู้อำนวยการ');
      if (isActingDeputy) {
        pos = 'ครู ทำหน้าที่รองผู้อำนวยการ';
      }
      if (mainDeptName && !pos.includes(mainDeptName)) {
        if (mainDeptName.includes('ฝ่าย') || mainDeptName.includes('แผนก')) {
          pos = `${pos} ${mainDeptName}`.trim();
        }
      }
    }

    return {
      ...person,
      formattedPosition: pos,
      deptDisplay,
    };
  });

  let directors = formattedExecs.filter((p) => p.order_num === 1);
  if (directors.length === 0) {
    directors = formattedExecs.filter(
      (p) =>
        (p.position || '').includes('ผู้อำนวยการ') &&
        !(p.position || '').includes('รอง')
    );
  }
  const directorIds = new Set(directors.map((d) => d.id));
  const deputies = formattedExecs.filter((p) => !directorIds.has(p.id));

  return (
    <>
      {/* Page Header Banner */}
      <section className="relative bg-slate-900 py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-950/40 via-slate-900 to-amber-950/50 z-0"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 z-0"></div>

        <div className="max-w-4xl mx-auto px-6 text-center text-white relative z-10 space-y-4">
          <div className="w-16 h-16 bg-amber-500 text-white rounded-3xl mx-auto flex items-center justify-center shadow-lg transform rotate-3">
            <Shield className="w-10 h-10 transform -rotate-3 text-white" />
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            ทำเนียบผู้บริหาร
          </h1>
          <p className="text-slate-300 max-w-xl mx-auto text-sm md:text-base font-light">
            โครงสร้างสายการบังคับบัญชาและคณะผู้บริหารวิทยาลัย {settings.site_name || 'สถานศึกษา'}
          </p>

          <nav className="flex justify-center mt-6" aria-label="Breadcrumb">
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
                    บุคลากร
                  </Link>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 mx-1.5" />
                  <span className="text-amber-300 font-medium">
                    ทำเนียบผู้บริหาร
                  </span>
                </div>
              </li>
            </ol>
          </nav>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 -mt-12 relative z-20">
        {formattedExecs.length > 0 ? (
          <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-slate-100 p-6 sm:p-12 md:p-16">
            {/* Tier 1: Director */}
            {directors.length > 0 && (
              <div className="mb-16 relative">
                <div className="flex justify-center">
                  {directors.map((director) => {
                    const { email, phone } = parseContactInfo(
                      director.contact_info
                    );
                    const fullDisplayName = `${director.name}${
                      director.academic_standing
                        ? ` (${director.academic_standing})`
                        : ''
                    }`;

                    return (
                      <div
                        key={director.id}
                        className="bg-gradient-to-br from-amber-50/20 to-white border-2 border-amber-300/80 rounded-3xl p-6 md:p-8 shadow-xl hover:shadow-2xl transition duration-300 max-w-2xl w-full space-y-6 relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>

                        <div className="flex flex-col sm:flex-row items-center gap-6 md:gap-8 relative z-10">
                          {/* Profile Photo (Portrait 180x220px, object-top prevents cut heads) */}
                          <div className="w-44 h-52 md:w-48 md:h-56 rounded-2xl overflow-hidden shrink-0 border border-amber-200 bg-slate-50 relative group shadow-md">
                            {director.image_path ? (
                              <img
                                src={normalizeImageUrl(director.image_path)}
                                alt={director.name}
                                loading="lazy"
                                className="w-full h-full object-cover object-top transition duration-300 group-hover:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-100">
                                <User className="w-16 h-16" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 space-y-3.5 text-center sm:text-left pt-2">
                            <span className="text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-full inline-flex items-center gap-1.5 uppercase shadow-xs">
                              <Crown className="w-3.5 h-3.5 text-amber-600" />
                              <span>ผู้อำนวยการ</span>
                            </span>

                            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                              {fullDisplayName}
                            </h2>

                            <div className="text-sm font-bold text-amber-600">
                              {director.formattedPosition}
                            </div>

                            {/* Contact Info */}
                            {(email || phone) && (
                              <div className="pt-2 text-xs text-slate-500 space-y-1">
                                {phone && (
                                  <div className="flex items-center justify-center sm:justify-start gap-1.5">
                                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="font-mono">{phone}</span>
                                  </div>
                                )}
                                {email && (
                                  <a
                                    href={`mailto:${email}`}
                                    className="flex items-center justify-center sm:justify-start gap-1.5 text-slate-500 hover:text-amber-600 transition"
                                  >
                                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="font-mono">{email}</span>
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Bottom Action Button */}
                        <div className="pt-2 border-t border-slate-100">
                          <Link
                            href={`/personnel/${director.id}`}
                            className="w-full text-center py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition shadow-md shadow-amber-500/10 block cursor-pointer"
                          >
                            อำนาจหน้าที่และความรับผิดชอบ
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {deputies.length > 0 && (
                  <div className="hidden lg:block w-0.5 h-12 bg-gradient-to-b from-amber-400 to-rose-300 mx-auto mt-6"></div>
                )}
              </div>
            )}

            {/* Tier 2: Deputy Directors */}
            {deputies.length > 0 && (
              <div>
                <div className="text-center mb-10">
                  <span className="px-4 py-1.5 rounded-full bg-rose-50 text-rose-700 font-extrabold text-xs uppercase tracking-wider border border-rose-100 shadow-2xs">
                    คณะรองผู้อำนวยการฝ่ายบริหาร
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6 max-w-5xl mx-auto">
                  {deputies.map((person) => {
                    const { email, phone } = parseContactInfo(
                      person.contact_info
                    );
                    const fullDisplayName = `${person.name}${
                      person.academic_standing
                        ? ` (${person.academic_standing})`
                        : ''
                    }`;

                    return (
                      <div
                        key={person.id}
                        className="flex flex-col justify-between bg-white rounded-3xl p-5 transition duration-300 border border-rose-200/90 shadow-[0_4px_20px_rgba(225,29,72,0.06)] bg-rose-50/10 hover:border-rose-400 hover:shadow-lg"
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
                              <span className="text-[9px] font-bold bg-rose-50 text-rose-700 px-2.5 py-0.5 rounded-full inline-block mb-1.5 uppercase border border-rose-100">
                                {person.is_executive && !person.position?.includes('รองผู้อำนวยการ')
                                  ? 'ครู ทำหน้าที่รองผู้อำนวยการ'
                                  : 'รองผู้อำนวยการ'}
                              </span>

                              <h3 className="font-extrabold text-slate-900 text-sm md:text-base leading-snug tracking-tight">
                                {fullDisplayName}
                              </h3>

                              <div className="flex items-center gap-1.5 mt-1.5">
                                <Star className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <span className="text-[11px] font-bold text-emerald-600 leading-normal">
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
                                    className="text-[10px] text-slate-500 hover:text-rose-600 flex items-center gap-1.5 transition truncate max-w-[150px]"
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
                            className="w-full text-center py-2 px-4 bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-bold rounded-xl transition shadow-xs block cursor-pointer"
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

            <div className="mt-16 pt-8 border-t border-slate-100 text-center">
              <Link
                href="/personnel"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-orange-600 font-bold text-sm transition-colors cursor-pointer border border-slate-200/60"
              >
                <Users className="w-4 h-4" />
                <span>ดูทำเนียบบุคลากรทั้งหมดในสถานศึกษา</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-xl max-w-xl mx-auto">
            <Users className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-bold text-slate-700">
              ยังไม่มีข้อมูลทำเนียบผู้บริหาร
            </h3>
            <p className="text-slate-500 text-sm mt-2">
              ผู้ดูแลระบบกำลังอยู่ระหว่างการปรับปรุงข้อมูล
            </p>
          </div>
        )}
      </section>
    </>
  );
}
