import React from 'react';
import Link from 'next/link';
import { Users, Home, ChevronRight } from 'lucide-react';
import prisma from '@/lib/prisma';
import { getSettings, isMaintenanceActive } from '@/lib/settings';
import { getSession } from '@/lib/auth';
import MaintenanceView from '@/components/public/MaintenanceView';
import PersonnelDirectoryClient, {
  PersonnelCardData,
  PositionCountItem,
  MainDepartmentItem,
} from '@/components/public/PersonnelDirectoryClient';

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

export default async function PersonnelPage({
  searchParams,
}: {
  searchParams: Promise<{ dept?: string }>;
}) {
  const settings = await getSettings();
  const session = await getSession();
  const sp = await searchParams;

  if (!session && isMaintenanceActive(settings, ['personnel.php', 'personnel'])) {
    return <MaintenanceView settings={settings} />;
  }

  const initialDeptId = sp.dept ? parseInt(sp.dept, 10) : null;

  const [rawPersonnel, curriculums, definedPositions, allCategories] =
    await Promise.all([
      prisma.personnel.findMany({
        where: { is_active: true },
        include: {
          personnel_categories: {
            include: {
              personnel_categories: true, // Parent category
            },
          },
          personnel_position_links: {
            include: {
              personnel_positions: true,
            },
          },
          personnel_special_duties: {
            orderBy: { id: 'asc' },
          },
        },
        orderBy: [{ order_num: 'asc' }, { id: 'asc' }],
      }),
      prisma.curriculums.findMany({
        select: { id: true, name: true },
      }),
      prisma.personnel_positions.findMany({
        orderBy: [{ order_num: 'asc' }, { id: 'asc' }],
      }),
      prisma.personnel_categories.findMany({
        orderBy: [{ order_num: 'asc' }, { id: 'asc' }],
      }),
    ]);

  const curriculumMap = new Map<number, string>();
  for (const c of curriculums) {
    curriculumMap.set(c.id, c.name);
  }

  // Build department hierarchy
  const mainDepts: MainDepartmentItem[] = allCategories
    .filter((c) => !c.parent_id)
    .sort((a, b) => {
      const aIsExec = a.name.includes('ผู้บริหาร') ? 0 : 1;
      const bIsExec = b.name.includes('ผู้บริหาร') ? 0 : 1;
      if (aIsExec !== bIsExec) return aIsExec - bIsExec;
      const ordA = a.order_num ?? 999;
      const ordB = b.order_num ?? 999;
      if (ordA !== ordB) return ordA - ordB;
      return a.id - b.id;
    })
    .map((main) => ({
      id: main.id,
      name: main.name,
      subDepartments: allCategories
        .filter((sub) => sub.parent_id === main.id)
        .map((sub) => ({ id: sub.id, name: sub.name })),
    }));

  // Transform personnel cards & count positions
  const posCounter = new Map<string, number>();
  for (const dp of definedPositions) {
    posCounter.set(dp.name.trim(), 0);
  }

  const personnelList: PersonnelCardData[] = rawPersonnel.map((person) => {
    const cat = person.personnel_categories;
    const parentCat = cat?.personnel_categories || null;
    const mainDeptName = parentCat ? parentCat.name : cat?.name || '';
    const subDeptName = parentCat ? cat?.name || '' : '';

    let deptTag = '';
    if (mainDeptName && subDeptName) {
      deptTag = `${mainDeptName} > ${subDeptName}`;
    } else if (mainDeptName) {
      deptTag = mainDeptName;
    } else if (subDeptName) {
      deptTag = subDeptName;
    }

    let formattedPosition = person.position || '';
    if (person.is_executive && !formattedPosition.includes('ผู้อำนวยการ')) {
      formattedPosition = 'ครู ทำหน้าที่รองผู้อำนวยการ';
      if (mainDeptName && !formattedPosition.includes(mainDeptName)) {
        if (mainDeptName.includes('ฝ่าย') || mainDeptName.includes('แผนก')) {
          formattedPosition = `${formattedPosition} ${mainDeptName}`.trim();
        }
      }
    } else if (
      formattedPosition.includes('รองผู้อำนวยการ') &&
      !formattedPosition.includes('รักษาการ')
    ) {
      if (
        (person.order_num || 0) > 10 &&
        !formattedPosition.includes('ทำหน้าที่')
      ) {
        formattedPosition = 'ทำหน้าที่รองผู้อำนวยการ';
      }
      if (mainDeptName && !formattedPosition.includes(mainDeptName)) {
        formattedPosition = `${formattedPosition}${mainDeptName}`.trim();
      }
    } else if (
      formattedPosition.includes('หัวหน้าแผนก') &&
      subDeptName &&
      !formattedPosition.includes(subDeptName)
    ) {
      formattedPosition = `หัวหน้า${subDeptName}`;
    }

    const allPosSet = new Set<string>();
    if (person.position && person.position.trim()) {
      allPosSet.add(person.position.trim());
    }
    for (const link of person.personnel_position_links) {
      if (link.personnel_positions?.name) {
        allPosSet.add(link.personnel_positions.name.trim());
      }
    }
    const allPositions = Array.from(allPosSet);

    if (allPositions.length > 0) {
      for (const pName of allPositions) {
        posCounter.set(pName, (posCounter.get(pName) || 0) + 1);
      }
    } else {
      posCounter.set('ไม่ระบุตำแหน่ง', (posCounter.get('ไม่ระบุตำแหน่ง') || 0) + 1);
    }

    const extraDuties = person.personnel_special_duties
      .map((d) => (d.special_position || '').trim())
      .filter((d) => d && d !== (person.special_duty || '').trim());

    const { email, phone } = parseContactInfo(person.contact_info);

    return {
      id: person.id,
      name: person.name,
      academic_standing: person.academic_standing,
      position: person.position,
      formattedPosition,
      special_duty: person.special_duty,
      extraDuties,
      allPositions,
      deptTag,
      mainDeptId: parentCat ? parentCat.id : cat?.id || null,
      subDeptId: parentCat ? cat?.id || null : null,
      curriculumName: person.curriculum_id
        ? curriculumMap.get(person.curriculum_id) || null
        : null,
      email,
      phone,
      image_path: person.image_path,
      is_head: Boolean(person.is_head),
      is_executive: Boolean(person.is_executive),
    };
  });

  // Sort with Executives first (Director -> Deputy -> Acting Deputy / Executive -> Others)
  personnelList.sort((a, b) => {
    const getPrio = (p: typeof a) => {
      const pos = (p.position || '').trim();
      if (pos.includes('ผู้อำนวยการ') && !pos.includes('รอง')) return 1;
      if (pos.includes('รองผู้อำนวยการ')) return 2;
      if (p.is_executive) return 3;
      return 4;
    };
    const prioA = getPrio(a);
    const prioB = getPrio(b);
    if (prioA !== prioB) return prioA - prioB;
    return a.id - b.id;
  });

  const positionCounts: PositionCountItem[] = Array.from(posCounter.entries())
    .filter(([, count]) => count > 0)
    .map(([name, count]) => ({ name, count }));

  return (
    <>
      {/* Page Header */}
      <section className="relative bg-slate-900 py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-950/80 via-slate-900 to-amber-950/80 z-0"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 z-0"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-500/20 border border-orange-400/30 text-orange-300 text-xs font-bold mb-4 uppercase tracking-wider backdrop-blur-sm">
            <Users className="w-3.5 h-3.5" /> Personnel Directory
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
            ทำเนียบบุคลากรทั้งหมด
          </h1>
          <p className="text-slate-300 max-w-2xl mx-auto text-base md:text-lg font-light">
            รายชื่อคณะผู้บริหาร ครู อาจารย์ และบุคลากรทางการศึกษาทั้งหมดของ{' '}
            {settings.site_name || 'สถานศึกษา'}
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
                  <span className="text-orange-300 font-medium">
                    ทำเนียบบุคลากรทั้งหมด
                  </span>
                </div>
              </li>
            </ol>
          </nav>
        </div>
      </section>

      <PersonnelDirectoryClient
        personnelList={personnelList}
        positionCounts={positionCounts}
        departments={mainDepts}
        initialDeptId={initialDeptId && !isNaN(initialDeptId) ? initialDeptId : null}
      />
    </>
  );
}
