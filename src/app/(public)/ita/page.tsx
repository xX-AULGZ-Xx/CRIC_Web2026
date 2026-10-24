import React from 'react';
import prisma from '@/lib/prisma';
import { getSettings, isMaintenanceActive } from '@/lib/settings';
import { getSession } from '@/lib/auth';
import MaintenanceView from '@/components/public/MaintenanceView';
import ItaAccordionClient, {
  ItaMainTopicItem,
} from '@/components/public/ItaAccordionClient';

export const dynamic = 'force-dynamic';

export default async function ItaPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; search?: string }>;
}) {
  const settings = await getSettings();
  const session = await getSession();
  const sp = await searchParams;

  if (!session && isMaintenanceActive(settings, ['ita.php', 'ita'])) {
    return <MaintenanceView settings={settings} />;
  }

  const rawMainTopics = await prisma.ita_main_topics.findMany({
    include: {
      ita_sub_topics: {
        orderBy: [{ order_no: 'asc' }, { id: 'asc' }],
        include: {
          ita_tables: {
            orderBy: [{ order_no: 'asc' }, { id: 'asc' }],
            include: {
              ita_items: {
                orderBy: [{ order_no: 'asc' }, { id: 'asc' }],
                include: {
                  ita_links: {
                    orderBy: { id: 'asc' },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: [{ year: 'desc' }, { order_no: 'asc' }, { id: 'asc' }],
  });

  const yearSet = new Set<string>();
  for (const m of rawMainTopics) {
    if (m.year) yearSet.add(String(m.year));
  }
  const availableYears = Array.from(yearSet).sort((a, b) =>
    b.localeCompare(a)
  );

  if (availableYears.length === 0) {
    availableYears.push('2569');
  }

  const initialYear =
    sp.year && availableYears.includes(sp.year)
      ? sp.year
      : availableYears[0] || '2569';

  const coverBanners: Record<string, string> = {
    default: settings['ita_cover_banner'] || 'ita_cover_banner.png',
  };
  const coverBadges: Record<string, string> = {};

  for (const y of availableYears) {
    coverBanners[y] =
      settings[`ita_cover_banner_${y}`] ||
      settings['ita_cover_banner'] ||
      '';
    coverBadges[y] = settings[`ita_badge_${y}`] || '';
  }

  const itaTree: ItaMainTopicItem[] = rawMainTopics.map((m) => ({
    id: m.id,
    year: String(m.year),
    title: m.name,
    name: m.name,
    description: null,
    sub_topics: m.ita_sub_topics.map((s) => ({
      id: s.id,
      code: s.code || '',
      name: s.name,
      title: s.code ? `${s.code} ${s.name}` : s.name,
      tables: s.ita_tables.map((tb) => ({
        id: tb.id,
        title: tb.name,
        items: tb.ita_items.map((it) => ({
          id: it.id,
          o_number: it.item_code || null,
          title: it.info_detail || it.item_code || '',
          description: it.element_detail || null,
          links: it.ita_links.map((lk) => ({
            id: lk.id,
            label: lk.link_name || null,
            url: lk.url || null,
            link_type: lk.link_type || 'url',
          })),
        })),
      })),
    })),
  }));

  return (
    <ItaAccordionClient
      itaTree={itaTree}
      availableYears={availableYears}
      initialYear={initialYear}
      coverBanners={coverBanners}
      coverBadges={coverBadges}
      siteName={settings.site_name || 'วิทยาลัยการอาชีพเชียงราย'}
    />
  );
}
