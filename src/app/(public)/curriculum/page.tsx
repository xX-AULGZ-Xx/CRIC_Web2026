import React from 'react';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getSettings, isMaintenanceActive } from '@/lib/settings';
import { getSession } from '@/lib/auth';
import MaintenanceView from '@/components/public/MaintenanceView';
import CurriculumListClient from '@/components/public/CurriculumListClient';

export const dynamic = 'force-dynamic';

export const LEVEL_CONFIG: Record<
  string,
  {
    title: string;
    subtitle: string;
    badge_bg: string;
    badge_text: string;
    icon: string;
    gradient: string;
  }
> = {
  ปวช: {
    title: 'ระดับประกาศนียบัตรวิชาชีพ (ปวช.)',
    subtitle: 'Vocational Certificate (รับผู้สำเร็จการศึกษา ม.3 หรือเทียบเท่า)',
    badge_bg: 'bg-orange-600',
    badge_text: 'text-white',
    icon: 'fa-graduation-cap',
    gradient: 'from-orange-600 to-amber-600',
  },
  'ปวช.': {
    title: 'ระดับประกาศนียบัตรวิชาชีพ (ปวช.)',
    subtitle: 'Vocational Certificate (รับผู้สำเร็จการศึกษา ม.3 หรือเทียบเท่า)',
    badge_bg: 'bg-orange-600',
    badge_text: 'text-white',
    icon: 'fa-graduation-cap',
    gradient: 'from-orange-600 to-amber-600',
  },
  ปวส: {
    title: 'ระดับประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.)',
    subtitle:
      'High Vocational Certificate (รับผู้สำเร็จการศึกษา ปวช. หรือ ม.6 หรือเทียบเท่า)',
    badge_bg: 'bg-amber-600',
    badge_text: 'text-white',
    icon: 'fa-user-graduate',
    gradient: 'from-amber-600 to-orange-600',
  },
  'ปวส.': {
    title: 'ระดับประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.)',
    subtitle:
      'High Vocational Certificate (รับผู้สำเร็จการศึกษา ปวช. หรือ ม.6 หรือเทียบเท่า)',
    badge_bg: 'bg-amber-600',
    badge_text: 'text-white',
    icon: 'fa-user-graduate',
    gradient: 'from-amber-600 to-orange-600',
  },
  ปริญญาตรี: {
    title: 'ระดับปริญญาตรีสายเทคโนโลยีหรือสายปฏิบัติการ (ทล.บ.)',
    subtitle: 'Bachelor of Technology (ต่อเนื่อง 2 ปี สำหรับผู้จบ ปวส.)',
    badge_bg: 'bg-emerald-600',
    badge_text: 'text-white',
    icon: 'fa-award',
    gradient: 'from-emerald-600 to-teal-600',
  },
  หลักสูตรระยะสั้น: {
    title: 'หลักสูตรวิชาชีพระยะสั้น / ฝึกอบรม',
    subtitle: 'Short Course Training (สำหรับประชาชนทั่วไปและผู้สนใจพัฒนาทักษะ)',
    badge_bg: 'bg-purple-600',
    badge_text: 'text-white',
    icon: 'fa-certificate',
    gradient: 'from-purple-600 to-pink-600',
  },
};

export async function generateMetadata() {
  const settings = await getSettings();
  const academicYear = settings.ita_year || '2567';
  const siteName = settings.site_name || 'วิทยาลัยการอาชีพเชียงราย';
  const title =
    settings.curriculum_page_title ||
    `สาขาวิชาที่เปิดสอนในหลักสูตร ${academicYear}`;

  return {
    title: `${title} - ${siteName}`,
    description: `ข้อมูลหลักสูตรและสาขาวิชาที่เปิดทำการเรียนการสอนของ ${siteName}`,
  };
}

export default async function CurriculumListPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; level?: string; search?: string }>;
}) {
  const sp = await searchParams;

  if (sp.id && /^\d+$/.test(sp.id)) {
    redirect(`/curriculum/${sp.id}`);
  }

  const settings = await getSettings();
  const session = await getSession();

  if (!session && isMaintenanceActive(settings, ['curriculum.php', 'curriculum'])) {
    return <MaintenanceView settings={settings} />;
  }

  const allCurriculums = await prisma.curriculums.findMany({
    orderBy: [{ id: 'asc' }],
  });

  return (
    <CurriculumListClient
      curriculums={allCurriculums}
      settings={settings}
      initialLevel={sp.level || ''}
      initialSearch={sp.search || ''}
    />
  );
}
