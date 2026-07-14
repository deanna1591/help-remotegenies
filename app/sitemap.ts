import { getPublishedArticles } from "@/lib/supabase";
import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

const BASE = "https://help.remotegenies.co";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let articles: Awaited<ReturnType<typeof getPublishedArticles>> = [];
  try {
    articles = await getPublishedArticles();
  } catch (e) {
    console.error("[sitemap] failed to load articles:", e);
  }

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/submit-ticket`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  const articleRoutes: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${BASE}/article/${a.id}`,
    lastModified: new Date(a.updated_at || a.freshness_at || Date.now()),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...articleRoutes];
}
