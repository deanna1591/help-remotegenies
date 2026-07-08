import { createClient, SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

/**
 * Server-only Supabase client using the service role key.
 * Used for creating drafts from client question gaps (writes bypass RLS).
 */
function jinniServerClient(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_JINNI_SUPABASE_URL;
  const key = process.env.JINNI_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Jinni Supabase server env vars");
  cached = createClient(url, key, { auth: { persistSession: false } });
  return cached;
}

/**
 * Handle a low-confidence client question. Either creates a new draft
 * flagged for admin, or increments the "asked_count" on a similar existing draft.
 */
export async function handleQuestionGap(params: {
  question: string;
  retrievedContext: string;
  retrievalConfidence: string;
  claudeConfidence: string;
}) {
  try {
    const supabase = jinniServerClient();

    // Find existing question-gap drafts and semantic-dedupe by title overlap
    const { data: existingDrafts, error: draftsErr } = await supabase
      .from("knowledge_drafts")
      .select("id, proposed_title, review_notes, created_at")
      .eq("derived_from", "client_question_gap")
      .eq("status", "pending")
      .limit(50);

    if (draftsErr) {
      console.error("[gap] draft lookup error:", draftsErr);
    }

    const questionLower = params.question.toLowerCase().trim();
    const questionWords = new Set(questionLower.split(/\s+/).filter((w) => w.length > 3));

    const matchingDraft = (existingDrafts ?? []).find((d: any) => {
      const title = (d.proposed_title ?? "").toLowerCase();
      if (title === questionLower) return true;
      const titleWords = new Set(title.split(/\s+/).filter((w: string) => w.length > 3));
      let overlap = 0;
      for (const w of questionWords) if (titleWords.has(w)) overlap++;
      return overlap >= 3 && overlap / Math.max(questionWords.size, 1) >= 0.6;
    });

    if (matchingDraft) {
      const currentNotes = matchingDraft.review_notes ? safeParseJson(matchingDraft.review_notes) : {};
      const currentCount = currentNotes.asked_count ?? 1;
      const updated = {
        ...currentNotes,
        asked_count: currentCount + 1,
        last_asked_at: new Date().toISOString(),
      };
      await supabase
        .from("knowledge_drafts")
        .update({ review_notes: JSON.stringify(updated) })
        .eq("id", matchingDraft.id);
      return { action: "incremented", draftId: matchingDraft.id, askedCount: currentCount + 1 };
    }

    // Create new draft
    const metadata = {
      asked_count: 1,
      first_asked_at: new Date().toISOString(),
      last_asked_at: new Date().toISOString(),
      retrieval_confidence: params.retrievalConfidence,
      claude_confidence: params.claudeConfidence,
    };

    const rationale = `A client asked this question but our knowledge base didn't have a confident answer. This is a candidate for a new article. Retrieved context (may or may not be relevant):\n\n${params.retrievedContext.slice(0, 2000)}`;

    const { data: newDraft, error: insertErr } = await supabase
      .from("knowledge_drafts")
      .insert({
        draft_type: "create",
        proposed_title: params.question.slice(0, 200),
        proposed_content: `# ${params.question}\n\nDraft — admin to write this article.\n\nReview the retrieved context in the rationale for hints on Jira sources.`,
        proposed_audiences: ["client"],
        proposed_tags: [],
        derived_from: "client_question_gap",
        source_id: null,
        ai_rationale: rationale,
        review_notes: JSON.stringify(metadata),
        status: "pending",
      })
      .select("id")
      .single();

    if (insertErr) {
      console.error("[gap] draft creation error:", insertErr);
      return { action: "error", error: insertErr.message };
    }

    return { action: "created", draftId: newDraft?.id };
  } catch (e) {
    console.error("[gap] handler failed:", e);
    return { action: "error", error: (e as Error).message };
  }
}

function safeParseJson(str: string | null | undefined): any {
  if (!str) return {};
  try {
    return JSON.parse(str);
  } catch {
    return {};
  }
}
