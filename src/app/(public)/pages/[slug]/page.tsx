import React from 'react';
import StaticPageTemplate from '@/components/public/StaticPageTemplate';

export const dynamic = 'force-dynamic';

export default async function PagesSlugRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <StaticPageTemplate slug={slug} allowFallbackNotFoundCard={false} />;
}
