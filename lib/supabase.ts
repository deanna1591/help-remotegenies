import { createClient, SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

/**
 * Read-only Supabase client using the anon key. RLS policies restrict what
 * can be read to published, client-audience content only.
 */
export function jinniPublicClient(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_JINNI_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_JINNI_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_JINNI_SUPABASE_URL or NEXT_PUBLIC_JINNI_SUPABASE_ANON_KEY"
    );
  }

  cached = createClient(url, key, {
    auth: { persistSession: false },
  });
  return cached;
}

export type PublishedArticle = {
  id: string;
  title: string | null;
  content: string;
  audiences: string[];
  tags: string[];
  freshness_at: string;
  updated_at: string;
};

/**
 * Fetch all published articles for the client audience.
 */
export async function getPublishedArticles(): Promise<PublishedArticle[]> {
  const { data, error } = await jinniPublicClient()
    .from("knowledge_chunks")
    .select("id, title, content, audiences, tags, freshness_at, updated_at")
    .eq("is_published", true)
    .eq("is_archived", false)
    .contains("audiences", ["client"])
    .order("freshness_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error("[getPublishedArticles] error:", error);
    return [];
  }
  return (data ?? []) as PublishedArticle[];
}

/**
 * Fetch a single published article by ID.
 */
export async function getArticleById(id: string): Promise<PublishedArticle | null> {
  const { data, error } = await jinniPublicClient()
    .from("knowledge_chunks")
    .select("id, title, content, audiences, tags, freshness_at, updated_at")
    .eq("id", id)
    .eq("is_published", true)
    .eq("is_archived", false)
    .maybeSingle();

  if (error) {
    console.error("[getArticleById] error:", error);
    return null;
  }
  return data as PublishedArticle | null;
}

/**
 * Group articles into categories based on tags. Returns top categories
 * ordered by article count.
 */
export function groupIntoCategories(articles: PublishedArticle[]) {
  const tagCounts = new Map<string, number>();
  for (const a of articles) {
    for (const tag of a.tags || []) {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    }
  }
  return Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([tag, count]) => ({ tag, count }));
}
