import React from 'react';
import prisma from '@/lib/prisma';
import { getSettings, isMaintenanceActive } from '@/lib/settings';
import { getSession } from '@/lib/auth';
import MaintenanceView from '@/components/public/MaintenanceView';
import ComplaintsClient, {
  PublicComplaintThreadItem,
} from '@/components/public/ComplaintsClient';

export const dynamic = 'force-dynamic';

function formatDateEnShort(date: Date | null | undefined, includeTime = false): string {
  if (!date) return '';
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const base = `${String(d.getDate()).padStart(2, '0')} ${
    months[d.getMonth()] || ''
  } ${d.getFullYear()}`;
  if (!includeTime) return base;
  return `${base}, ${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes()
  ).padStart(2, '0')}`;
}

function maskReporterName(name: string | null | undefined): string {
  if (!name || !name.trim()) return 'ผู้ไม่ประสงค์ออกนาม';
  const trimmed = name.trim();
  const firstChar = Array.from(trimmed)[0] || '';
  return `${firstChar}*** (สงวนนามตาม PDPA)`;
}

export default async function ComplaintsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; ticket?: string }>;
}) {
  const settings = await getSettings();
  const session = await getSession();
  const sp = await searchParams;

  if (
    !session &&
    isMaintenanceActive(settings, ['complaint.php', 'complaints', 'complaint'])
  ) {
    return <MaintenanceView settings={settings} />;
  }

  const rawRecent = await prisma.complaints.findMany({
    orderBy: { created_at: 'desc' },
    take: 20,
    select: {
      id: true,
      ticket_number: true,
      type: true,
      title: true,
      description: true,
      status: true,
      status_note: true,
      reporter_name: true,
      created_at: true,
      updated_at: true,
    },
  });

  const recentComplaints: PublicComplaintThreadItem[] = rawRecent.map((r) => ({
    id: r.id,
    ticket_number: r.ticket_number,
    type: r.type,
    title: r.title,
    description: r.description,
    status: r.status,
    status_note: r.status_note,
    masked_reporter: maskReporterName(r.reporter_name),
    created_at_formatted: formatDateEnShort(r.created_at, false),
    updated_at_formatted: formatDateEnShort(r.updated_at, true),
  }));

  const initialTab =
    sp.tab === 'track' || Boolean(sp.ticket) ? 'track' : 'submit';

  return (
    <>
      {/* Page Header */}
      <section className="relative bg-slate-900 py-10 sm:py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-950 via-slate-900 to-orange-950 z-0"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 z-0"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-300 text-xs font-bold mb-3 sm:mb-4 uppercase tracking-wider backdrop-blur-sm">
            <i className="fa-solid fa-shield-halved"></i> Whistleblower &amp;
            Complaint Center
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-3 sm:mb-4">
            ศูนย์รับเรื่องร้องเรียนและแจ้งเบาะแส
          </h1>
          <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base md:text-lg font-light px-2">
            ช่องทางแจ้งเบาะแสการทุจริตและประพฤติมิชอบ หรือร้องเรียนการให้บริการของ{' '}
            {settings.site_name || 'สถานศึกษา'} (ข้อมูลผู้แจ้งจะถูกเก็บเป็นความลับสูงสุด)
          </p>
        </div>
      </section>

      <ComplaintsClient
        siteName={settings.site_name || 'สถานศึกษา'}
        recentComplaints={recentComplaints}
        initialTab={initialTab}
        initialTicket={sp.ticket || ''}
      />
    </>
  );
}
