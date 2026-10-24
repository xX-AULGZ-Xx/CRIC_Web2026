import React from 'react';
import prisma from '@/lib/prisma';
import { getSettings, isMaintenanceActive } from '@/lib/settings';
import { getSession } from '@/lib/auth';
import MaintenanceView from '@/components/public/MaintenanceView';
import DynamicBlockRenderer from '@/components/public/DynamicBlockRenderer';
import HomePopupModal from '@/components/public/HomePopupModal';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const settings = await getSettings();
  const session = await getSession();

  if (!session && isMaintenanceActive(settings, ['index.php', 'home'])) {
    return <MaintenanceView settings={settings} />;
  }

  const homePage = await prisma.static_pages.findUnique({
    where: { slug: 'home' },
  });

  const defaultContent = `
<!-- block:home_sliders -->
<!-- block:quick_access -->
<!-- block:latest_news -->
<!-- block:executives -->
`;

  const content =
    homePage?.content && homePage.content.trim() !== ''
      ? homePage.content
      : defaultContent;

  const popupEnabled = settings.popup_enabled === '1';
  const popupImage = settings.popup_image || '';
  const popupLink = settings.popup_link || '';

  return (
    <>
      <DynamicBlockRenderer content={content} />
      {popupEnabled && popupImage && (
        <HomePopupModal
          popupImage={popupImage}
          popupLink={popupLink}
          siteName={settings.site_name || 'Announcement'}
        />
      )}
    </>
  );
}
