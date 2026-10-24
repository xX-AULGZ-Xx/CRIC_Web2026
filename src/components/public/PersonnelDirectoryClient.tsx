'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { normalizeImageUrl } from '@/lib/url-helper';
import {
  Users,
  Network,
  Briefcase,
  Crown,
  Star,
  GraduationCap,
  Phone,
  Mail,
  Search,
  X,
  ArrowUpRight,
  User,
  Shield,
} from 'lucide-react';

export interface PersonnelCardData {
  id: number;
  name: string;
  academic_standing: string | null;
  position: string | null;
  formattedPosition: string;
  special_duty: string | null;
  extraDuties: string[];
  allPositions: string[];
  deptTag: string;
  mainDeptId: number | null;
  subDeptId: number | null;
  curriculumName: string | null;
  email: string;
  phone: string;
  image_path: string | null;
  is_head: boolean;
  is_executive: boolean;
}

export interface PositionCountItem {
  name: string;
  count: number;
}

export interface MainDepartmentItem {
  id: number;
  name: string;
  subDepartments: { id: number; name: string }[];
}

interface PersonnelDirectoryClientProps {
  personnelList: PersonnelCardData[];
  positionCounts: PositionCountItem[];
  departments: MainDepartmentItem[];
  initialDeptId?: number | null;
}

export default function PersonnelDirectoryClient({
  personnelList,
  positionCounts,
  departments,
  initialDeptId = null,
}: PersonnelDirectoryClientProps) {
  const [selectedPosition, setSelectedPosition] = useState<string>('all');
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(
    initialDeptId
  );
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredList = useMemo(() => {
    return personnelList.filter((person) => {
      const matchesPos =
        selectedPosition === 'all' ||
        person.allPositions.includes(selectedPosition);
      const matchesDept =
        !selectedDeptId ||
        person.mainDeptId === selectedDeptId ||
        person.subDeptId === selectedDeptId;

      if (!matchesPos || !matchesDept) return false;

      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;

      const searchableText = [
        person.name,
        person.academic_standing,
        person.formattedPosition,
        person.deptTag,
        person.curriculumName,
        person.special_duty,
        ...person.extraDuties,
        ...person.allPositions,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(q);
    });
  }, [personnelList, selectedPosition, selectedDeptId, searchQuery]);

  const totalCount = personnelList.length;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 -mt-8 relative z-20">
      {/* Main Container Card */}
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 md:p-10 mb-8">
        {/* Department Quick Links Bar */}
        {departments.length > 0 && (
          <div className="mb-8 pb-6 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Network className="w-4 h-4 text-orange-600" />
                โครงสร้างฝ่ายบริหารและแผนกวิชา
              </h2>
              <Link
                href="/executives"
                className="text-xs font-bold text-orange-600 hover:text-orange-800 inline-flex items-center gap-1.5 bg-orange-50 px-3.5 py-1.5 rounded-full transition-colors self-start sm:self-auto border border-orange-100"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>ทำเนียบผู้บริหาร</span>
              </Link>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedDeptId(null)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  selectedDeptId === null
                    ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                ทุกฝ่ายงาน
              </button>
              {departments.map((dept) => (
                <div key={dept.id} className="inline-flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedDeptId(
                        selectedDeptId === dept.id ? null : dept.id
                      )
                    }
                    className={`px-3.5 py-2 rounded-l-xl text-xs font-bold transition-all border cursor-pointer ${
                      selectedDeptId === dept.id
                        ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-orange-50 hover:text-orange-600'
                    }`}
                  >
                    {dept.name}
                  </button>
                  <Link
                    href={`/personnel/dept/${dept.id}`}
                    title={`ดูหน้าโครงสร้าง ${dept.name}`}
                    className="px-2.5 py-2 rounded-r-xl text-xs font-bold bg-orange-50 text-orange-600 border border-l-0 border-slate-200 hover:bg-orange-600 hover:text-white transition-colors flex items-center justify-center"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Position Stats & Filter Pills */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {/* Total Pill */}
            <button
              type="button"
              onClick={() => setSelectedPosition('all')}
              className={`pos-filter-btn group flex items-center gap-2.5 px-4 py-2.5 rounded-2xl font-bold text-sm transition-all shadow-xs cursor-pointer ${
                selectedPosition === 'all'
                  ? 'bg-orange-600 text-white shadow-orange-600/20'
                  : 'bg-slate-50 hover:bg-orange-50 text-slate-700 hover:text-orange-600 border border-slate-200/80'
              }`}
            >
              <Users
                className={`w-4 h-4 ${
                  selectedPosition === 'all'
                    ? 'text-orange-200'
                    : 'text-slate-400 group-hover:text-orange-500'
                }`}
              />
              <span>ทั้งหมด</span>
              <span
                className={`px-2 py-0.5 rounded-lg text-xs font-extrabold transition-colors ${
                  selectedPosition === 'all'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200/70 group-hover:bg-orange-100 text-slate-600 group-hover:text-orange-700'
                }`}
              >
                {totalCount}
              </span>
            </button>

            {positionCounts.map((pos) => {
              const isSelected = selectedPosition === pos.name;
              return (
                <button
                  key={pos.name}
                  type="button"
                  onClick={() => setSelectedPosition(pos.name)}
                  className={`pos-filter-btn group flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-sm transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-orange-600 text-white shadow-xs shadow-orange-600/20'
                      : 'bg-slate-50 hover:bg-orange-50 text-slate-700 hover:text-orange-600 border border-slate-200/80'
                  }`}
                >
                  <span>{pos.name}</span>
                  <span
                    className={`px-2 py-0.5 rounded-lg text-xs font-extrabold transition-colors ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200/70 group-hover:bg-orange-100 text-slate-600 group-hover:text-orange-700'
                    }`}
                  >
                    {pos.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Input */}
        <div className="max-w-xl mx-auto mb-10 relative">
          <div className="relative flex items-center w-full h-12 rounded-2xl focus-within:shadow-md focus-within:border-orange-500 bg-slate-50 border border-slate-200 overflow-hidden transition-all">
            <div className="grid place-items-center h-full w-12 text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              id="personnel-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อบุคลากร, ตำแหน่ง หรือ แผนกวิชา..."
              className="peer h-full w-full outline-none text-sm text-slate-700 pr-4 bg-transparent font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-4 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Unified Personnel Grid (Matching Legacy PHP horizontal card layout) */}
        {filteredList.length > 0 ? (
          <div
            id="personnel-grid"
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            {filteredList.map((person) => {
              const posLower = (person.position || '').toLowerCase();
              const isDirector =
                posLower.includes('ผู้อำนวยการ') && !posLower.includes('รอง');
              const isDeputy =
                posLower.includes('รองผู้อำนวยการ') || person.is_executive;

              let cardClasses =
                'border border-slate-200/85 shadow-xs hover:border-orange-300 hover:shadow-md';
              let posTextClasses = 'text-slate-500';
              let btnClasses = 'bg-orange-600 hover:bg-orange-700';

              if (isDirector) {
                cardClasses =
                  'border border-amber-300 shadow-[0_4px_20px_rgba(245,158,11,0.06)] bg-amber-50/15 hover:border-amber-400';
                posTextClasses = 'text-amber-600';
                btnClasses = 'bg-amber-500 hover:bg-amber-600';
              } else if (isDeputy) {
                cardClasses =
                  'border border-rose-300 shadow-[0_4px_20px_rgba(225,29,72,0.06)] bg-rose-50/15 hover:border-rose-400';
                posTextClasses = 'text-emerald-600';
                btnClasses = 'bg-rose-500 hover:bg-rose-600';
              }

              const fullDisplayName = `${person.name}${
                person.academic_standing ? ` (${person.academic_standing})` : ''
              }`;

              return (
                <div
                  key={person.id}
                  className={`personnel-card flex flex-col justify-between bg-white rounded-3xl p-5 transition duration-300 ${cardClasses}`}
                >
                  <div className="flex">
                    {/* Left: Portrait Profile Photo (110x135px, object-top prevents cut heads) */}
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
                        {/* Executive / Acting Deputy Tag */}
                        {person.is_executive && !isDirector && (
                          <span className="text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full inline-block mb-1.5 uppercase">
                            ครู ทำหน้าที่รองผู้อำนวยการ
                          </span>
                        )}

                        {/* Department Tag */}
                        {person.deptTag && (
                          <span className="text-[9px] font-bold bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full inline-block mb-1.5 uppercase mr-1">
                            {person.deptTag}
                          </span>
                        )}

                        {/* Curriculum Tag */}
                        {person.curriculumName && (
                          <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full inline-block mb-1.5 uppercase mr-1">
                            สาขา: {person.curriculumName}
                          </span>
                        )}

                        {/* Special Duty Tag */}
                        {person.special_duty && (
                          <span className="text-[9px] font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full inline-block mb-1.5 uppercase mr-1">
                            หน้าที่พิเศษ: {person.special_duty}
                          </span>
                        )}

                        {person.extraDuties.map((ed, idx) => (
                          <span
                            key={idx}
                            className="text-[9px] font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full inline-block mb-1.5 uppercase mr-1"
                          >
                            หน้าที่พิเศษ: {ed}
                          </span>
                        ))}

                        {/* Name */}
                        <h3 className="font-extrabold text-slate-900 text-sm md:text-base leading-snug tracking-tight mt-0.5">
                          {fullDisplayName}
                        </h3>

                        {/* Position */}
                        <div className="flex items-center gap-1.5 mt-1.5">
                          {isDirector ? (
                            <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          ) : isDeputy ? (
                            <Star className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          ) : (
                            <GraduationCap className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                          )}
                          <span
                            className={`text-[11px] font-bold ${posTextClasses} leading-normal`}
                          >
                            {person.formattedPosition}
                          </span>
                        </div>
                      </div>

                      {/* Contact Info */}
                      {(person.phone || person.email) && (
                        <div className="border-t border-dashed border-slate-200 pt-2 mt-2 space-y-1">
                          {person.phone && (
                            <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="font-mono">{person.phone}</span>
                            </div>
                          )}
                          {person.email && (
                            <a
                              href={`mailto:${person.email}`}
                              className="text-[10px] text-slate-500 hover:text-orange-600 flex items-center gap-1.5 transition truncate max-w-[150px]"
                              title={person.email}
                            >
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="font-mono truncate">
                                {person.email}
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
                      className={`w-full text-center py-2 px-4 ${btnClasses} text-white text-[11px] font-bold rounded-xl transition shadow-xs block`}
                    >
                      อำนาจหน้าที่และความรับผิดชอบ
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-slate-100">
            <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-medium text-slate-500">
              ไม่พบบุคลากรที่ตรงกับเงื่อนไขการค้นหา
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
