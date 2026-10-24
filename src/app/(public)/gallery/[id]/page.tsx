import { notFound } from 'next/navigation';
import { renderSingleAlbumView } from '../page';

export const dynamic = 'force-dynamic';

export default async function GalleryDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const albumId = parseInt(id, 10);
  if (isNaN(albumId) || albumId <= 0) {
    notFound();
  }
  return renderSingleAlbumView(albumId);
}
