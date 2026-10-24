import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { normalizeImageUrl } from '@/lib/url-helper';
import PersonnelDetailsTabs from '@/components/public/PersonnelDetailsTabs';
import {
  ChevronRight,
  ArrowLeft,
  User,
  Star,
  Mail,
  Phone,
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
    if (!line) continue;
    if (line.includes('@')) {
      email = line;
    } else if (/[\d-]{9,}/.test(line)) {
      phone = line.replace(/(โทร\.?|เบอร์โทร\.?)/g, '').trim();
    }
  }
  return { email, phone };
}

export default async function PersonnelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const personId = parseInt(id, 10);
  if (isNaN(personId) || personId <= 0) {
    notFound();
  }

  const person = await prisma.personnel.findFirst({
    where: { id: personId, is_active: true },
    include: {
      personnel_categories: {
        include: {
          personnel_categories: true, // Parent main department
        },
      },
      personnel_position_links: {
        include: {
          personnel_positions: true,
        },
      },
      personnel_special_duties: {
        include: {
          personnel_categories: true,
        },
        orderBy: { id: 'asc' },
      },
    },
  });

  if (!person) {
    notFound();
  }

  let curriculumName: string | null = null;
  if (person.curriculum_id) {
    const curr = await prisma.curriculums.findUnique({
      where: { id: person.curriculum_id },
      select: { name: true },
    });
    curriculumName = curr?.name || null;
  }

  const cat = person.personnel_categories;
  const parentCat = cat?.personnel_categories || null;

  const mainDeptId = parentCat ? parentCat.id : cat?.id || null;
  const mainDeptName = parentCat ? parentCat.name : cat?.name || '';
  const subDeptId = parentCat ? cat?.id || null : null;
  const subDeptName = parentCat ? cat?.name || '' : '';

  let catDisplayName = '';
  if (parentCat && cat) {
    catDisplayName = `${parentCat.name} > ${cat.name}`;
  } else {
    catDisplayName = cat?.name || 'บุคลากรทั่วไป';
  }

  let pos = (person.position || '').trim();
  let deptSuffix = '';
  if (cat?.name && !pos.includes(cat.name)) {
    if (
      cat.name.includes('ฝ่าย') ||
      cat.name.includes('แผนก') ||
      cat.name.includes('งาน')
    ) {
      deptSuffix = ' ' + cat.name;
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
  const fullFormattedPosition = `${pos}${actingTitle}${deptSuffix}`;

  const { email, phone } = parseContactInfo(person.contact_info);

  let backLink = '/personnel';
  if (subDeptId) {
    backLink = `/personnel/sub-dept/${subDeptId}`;
  } else if (mainDeptId) {
    backLink = `/personnel/dept/${mainDeptId}`;
  }

  return (
    <>
      {/* Header Banner (Matching legacy PHP personnel_detail.php) */}
      <section className="relative bg-slate-900 py-12 md:py-16 text-white text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-950 via-slate-900 to-amber-950 z-0"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 z-0"></div>

        <div className="max-w-4xl mx-auto px-6 space-y-2 relative z-10">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
            บทบาทหน้าที่และความรับผิดชอบ
          </span>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">
            ประวัติและอำนาจหน้าที่บุคลากร
          </h1>
        </div>
      </section>

      {/* Content Container */}
      <section className="max-w-4xl mx-auto px-0 sm:px-6 py-4 sm:py-10 space-y-4 sm:space-y-6">
        {/* Breadcrumb */}
        <div className="px-4 sm:px-0 flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
          <Link href="/" className="hover:text-slate-700 transition-colors">
            หน้าหลัก
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <Link
            href="/personnel"
            className="hover:text-slate-700 transition-colors"
          >
            ทำเนียบบุคลากร
          </Link>
          {mainDeptId && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <Link
                href={`/personnel/dept/${mainDeptId}`}
                className="hover:text-slate-700 transition-colors"
              >
                {mainDeptName}
              </Link>
            </>
          )}
          {subDeptId && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <Link
                href={`/personnel/sub-dept/${subDeptId}`}
                className="hover:text-slate-700 transition-colors"
              >
                {subDeptName}
              </Link>
            </>
          )}
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-800 font-bold">{person.name}</span>
        </div>

        {/* Featured Detail Box */}
        <div className="bg-white border-0 sm:border border-slate-200 rounded-none sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-none sm:shadow-lg space-y-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
            {/* Profile Photo (w-56 h-64 rounded-2xl, object-top) */}
            <div className="w-56 h-64 rounded-2xl overflow-hidden shrink-0 border border-slate-200 bg-slate-50 shadow-sm relative group">
              {person.image_path ? (
                <img
                  src={normalizeImageUrl(person.image_path)}
                  alt={person.name}
                  className="w-full h-full object-cover object-top transition duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-100">
                  <User className="w-16 h-16" />
                </div>
              )}
              {Boolean(person.is_head || person.is_executive) && (
                <div
                  className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-lg border-2 border-white"
                  title="ผู้บริหาร / หัวหน้าหน่วยงาน"
                >
                  <Star className="w-5 h-5 text-white" />
                </div>
              )}
            </div>

            {/* Info Section */}
            <div className="flex-1 space-y-4 text-center md:text-left pt-2 min-w-0">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span className="text-[10px] font-bold bg-orange-50 text-orange-700 px-3 py-1 rounded-full uppercase shadow-xs">
                  {catDisplayName}
                </span>
                {curriculumName && (
                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full uppercase shadow-xs">
                    สาขา: {curriculumName}
                  </span>
                )}
                {person.special_duty && (
                  <span className="text-[10px] font-bold bg-amber-50 text-amber-800 px-3 py-1 rounded-full uppercase shadow-xs">
                    หน้าที่พิเศษ: {person.special_duty}
                  </span>
                )}
              </div>

              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">
                {person.name}
                {person.academic_standing
                  ? ` (${person.academic_standing})`
                  : ''}
              </h2>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-center md:justify-start gap-2.5 text-sm text-slate-800">
                  <span className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center shrink-0">
                    <ChevronRight className="w-3 h-3" />
                  </span>
                  <span className="font-bold">
                    ตำแหน่ง : {fullFormattedPosition}
                  </span>
                </div>

                {email && (
                  <div className="flex items-center justify-center md:justify-start gap-2.5 text-sm text-slate-600">
                    <Mail className="w-4 h-4 text-orange-600 shrink-0" />
                    <a
                      href={`mailto:${email}`}
                      className="hover:underline font-mono"
                    >
                      {email}
                    </a>
                  </div>
                )}

                {phone && (
                  <div className="flex items-center justify-center md:justify-start gap-2.5 text-sm text-slate-600">
                    <Phone className="w-4 h-4 text-orange-600 shrink-0" />
                    <span className="font-mono">{phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tab Switching Layout */}
          <div className="pt-4 border-t border-slate-100">
            <PersonnelDetailsTabs details={person.details} />
          </div>
        </div>

        {/* Back Button */}
        <div className="flex justify-center pt-4">
          <Link
            href={backLink}
            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition flex items-center gap-2 border border-slate-200 shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับหน้าทำเนียบบุคลากร</span>
          </Link>
        </div>
      </section>
    </>
  );
}
