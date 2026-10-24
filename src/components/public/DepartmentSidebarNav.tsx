import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { FolderTree, ChevronRight, ArrowRight, Users } from 'lucide-react';

interface DepartmentSidebarNavProps {
  activeMainDeptId?: number;
  activeDeptId?: number;
  activeSubDeptId?: number | null;
}

export default async function DepartmentSidebarNav({
  activeMainDeptId,
  activeDeptId,
  activeSubDeptId = null,
}: DepartmentSidebarNavProps) {
  const currentMainId = activeMainDeptId ?? activeDeptId ?? 0;

  const allCategories = await prisma.personnel_categories.findMany({
    orderBy: [{ order_num: 'asc' }, { id: 'asc' }],
  });

  const mainCategories = allCategories
    .filter((c) => !c.parent_id)
    .sort((a, b) => {
      const aIsExec = a.name.includes('ผู้บริหาร') ? 0 : 1;
      const bIsExec = b.name.includes('ผู้บริหาร') ? 0 : 1;
      if (aIsExec !== bIsExec) return aIsExec - bIsExec;
      const ordA = a.order_num ?? 999;
      const ordB = b.order_num ?? 999;
      if (ordA !== ordB) return ordA - ordB;
      return a.id - b.id;
    });
  const subCategories = allCategories.filter(
    (c) => c.parent_id === currentMainId
  );

  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 sticky top-28">
      <h3 className="text-lg font-extrabold text-slate-800 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
        <FolderTree className="w-5 h-5 text-orange-600" />
        <span>โครงสร้างฝ่ายงาน</span>
      </h3>

      <nav className="space-y-1.5">
        {mainCategories.map((nav) => {
          const isExec = nav.name.includes('ผู้บริหาร');
          const isMainActive =
            (nav.id === currentMainId && !activeSubDeptId) ||
            (isExec && currentMainId === 44);
          const isParentOfActiveSub =
            nav.id === currentMainId && Boolean(activeSubDeptId);
          const targetUrl = isExec ? '/executives' : `/personnel/dept/${nav.id}`;

          return (
            <div key={nav.id} className="space-y-1">
              <Link
                href={targetUrl}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  isMainActive
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                    : isParentOfActiveSub
                    ? 'bg-orange-50 text-orange-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-orange-600'
                }`}
              >
                <span className="truncate pr-2">{nav.name}</span>
                <ChevronRight
                  className={`w-4 h-4 transition-transform shrink-0 ${
                    isMainActive
                      ? 'text-orange-200'
                      : isParentOfActiveSub
                      ? 'text-orange-500 rotate-90'
                      : 'text-slate-300'
                  }`}
                />
              </Link>

              {nav.id === currentMainId && subCategories.length > 0 && (
                <div className="pl-4 pr-1 py-1 space-y-1 border-l-2 border-orange-100 ml-4 mt-1">
                  {subCategories.map((sub) => {
                    const isSubActive = sub.id === activeSubDeptId;
                    return (
                      <Link
                        key={sub.id}
                        href={`/personnel/sub-dept/${sub.id}`}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors group cursor-pointer ${
                          isSubActive
                            ? 'text-orange-600 font-bold bg-orange-50/80'
                            : 'text-slate-500 hover:text-orange-600 hover:bg-orange-50/50'
                        }`}
                      >
                        <span className="flex items-start gap-2 pr-2 text-left leading-snug flex-1">
                          <span
                            className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 transition-colors ${
                              isSubActive
                                ? 'bg-orange-600'
                                : 'bg-orange-300 group-hover:bg-orange-600'
                            }`}
                          ></span>
                          <span className="break-words">{sub.name}</span>
                        </span>
                        <ArrowRight
                          className={`w-3.5 h-3.5 transition-opacity shrink-0 ${
                            isSubActive
                              ? 'opacity-100 text-orange-600'
                              : 'opacity-0 group-hover:opacity-100 text-orange-400'
                          }`}
                        />
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="mt-6 pt-5 border-t border-slate-100">
        <Link
          href="/personnel"
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
        >
          <Users className="w-4 h-4" />
          <span>ดูทำเนียบบุคลากรรวมทั้งหมด</span>
        </Link>
      </div>
    </div>
  );
}
