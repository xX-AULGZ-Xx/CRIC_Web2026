import React from 'react';
import StaticPageTemplate from '@/components/public/StaticPageTemplate';

export const dynamic = 'force-dynamic';

export default async function AboutPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string }>;
}) {
  const sp = await searchParams;
  const slug = sp.slug || 'about';
  return <StaticPageTemplate slug={slug} allowFallbackNotFoundCard={true} />;
}
