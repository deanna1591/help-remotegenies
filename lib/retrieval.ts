import { jinniPublicClient } from "./supabase";
import { embed } from "./embed";

export type RetrievedChunk = {
  id: string;
  title: string | null;
  content: string;
  source_type: string;
  source_url: string | null;
  similarity: number;
  is_published: boolean;
  audiences: string[];
};

export async function retrieveForClient(query: string, limit = 6): Promise<RetrievedChunk[]> {
  const embedding = await embed(query);
  console.log("[retrieveForClient] query:", query, "embedding length:", embedding.length);

 const { data, error } = await jinniPublicClient().rpc("match_knowledge", {
    query_embedding: embedding,
    query_text: query,
    target_audience: null,
    required_tags: null,
    match_count: limit * 3,
  });

  console.log("[retrieveForClient] RPC returned:", { error, dataLength: data?.length, firstTitle: data?.[0]?.title });

  if (error) {
    console.error("[retrieveForClient] error:", error);
    return [];
  }

  const chunks = (data ?? []) as any[];
  if (chunks.length === 0) return [];

  const ids = chunks.map((c) => c.id);
  const { data: publishedData, error: pubErr } = await jinniPublicClient()
    .from("knowledge_chunks")
    .select("id, is_published")
    .in("id", ids);

  if (pubErr) {
    console.error("[retrieveForClient] published check error:", pubErr);
    return [];
  }

  const publishedIds = new Set(
    (publishedData ?? []).filter((r: any) => r.is_published === true).map((r: any) => r.id)
  );

  const results = chunks
    .filter((c) => publishedIds.has(c.id))
    .filter((c) => c.similarity >= 0.3)
    .slice(0, limit)
    .map((c) => ({
      id: c.id,
      title: c.title,
      content: c.content,
      source_type: c.source_type,
      source_url: c.source_url,
      similarity: c.similarity,
      is_published: true,
      audiences: c.audiences,
    }));

 console.log("[retrieveForClient] filtered results:", results.length, results.map(r => r.title));
  return results as RetrievedChunk[];
}

export async function retrieveLearningLessons(query: string, limit = 5): Promise<any[]> {
  try {
    const embedding = await embed(query);
    const { data, error } = await jinniPublicClient().rpc("match_learning_notes", {
      query_embedding: embedding,
      match_count: limit,
      min_similarity: 0.5,
    });
    if (error) {
      console.error("[retrieveLearningLessons] error:", error);
      return [];
    }
    return data ?? [];
  } catch (e) {
    console.error("[retrieveLearningLessons] failed:", e);
    return [];
  }
}

export async function retrieveUrls(query: string, audience: string | null = "client", limit = 5): Promise<any[]> {
  try {
    const embedding = await embed(query);
    const { data, error } = await jinniPublicClient().rpc("match_urls", {
      query_embedding: embedding,
      match_count: limit,
      target_audience: audience,
      min_similarity: 0.5,
    });
    if (error) {
      console.error("[retrieveUrls] error:", error);
      return [];
    }
    return data ?? [];
  } catch (e) {
    console.error("[retrieveUrls] failed:", e);
    return [];
  }
}

export function computeConfidence(chunks: RetrievedChunk[]): "high" | "medium" | "low" {
  if (chunks.length === 0) return "low";
  const best = chunks[0].similarity;
  if (best >= 0.75) return "high";
  if (best >= 0.6) return "medium";
  return "low";
}