import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { embed } from "@/lib/embed";

let cached: SupabaseClient | null = null;

function jinniServerClient(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_JINNI_SUPABASE_URL;
  const key = process.env.JINNI_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Jinni Supabase server env vars");
  cached = createClient(url, key, { auth: { persistSession: false } });
  return cached;
}

// Inputs that should NEVER trigger gap detection — audience clarifications,
// greetings, acknowledgements, and other non-questions.
const TRIVIAL_INPUTS = new Set([
  "genie", "genies", "client", "clients", "freelancer", "freelancers",
  "hi", "hello", "hey", "yo", "sup", "hiya",
  "thanks", "thank you", "ty", "thx", "cheers",
  "yes", "no", "yeah", "nope", "yep", "ok", "okay", "k", "sure",
  "bye", "goodbye", "cool", "nice", "great", "good", "got it", "gotcha",
]);

/**
 * Decide whether a user message is a real, answerable question worth
 * flagging as a knowledge gap. Filters out greetings, one-word replies,
 * audience clarifications, and other non-questions.
 */
function isRealQuestion(raw: string): boolean {
  const q = raw.toLowerCase().trim().replace(/[?!.]+$/, "");
  if (!q) return false;
  if (TRIVIAL_INPUTS.has(q)) return false;
  const words = q.split(/\s+/).filter(Boolean);
  // Too short to be a substantive question
  if (words.length < 3) return false;
  if (q.length < 12) return false;
  return true;
}

/**
 * Handle a low-confidence question. Before creating a draft, cross-checks:
 *  1. Is this a real question (not "genie", "hi", etc.)?
 *  2. Is it already answered in published knowledge_chunks?
 *  3. Is there already a draft (pending OR approved) covering it?
 * Only creates a new draft if all checks pass. Otherwise increments an
 * existing draft's asked_count or skips entirely.
 */
export async function handleQuestionGap(params: {
  question: string;
  retrievedContext: string;
  retrievalConfidence: string;
  claudeConfidence: string;
}) {
  try {
    // GUARD 1 — skip trivial / non-question inputs
    if (!isRealQuestion(params.question)) {
      return { action: "skipped", reason: "not_a_question" };
    }

    const supabase = jinniServerClient();
    const questionEmbedding = await embed(params.question);

    // GUARD 2 — already answered in published knowledge? Cross-check via embedding.
    const { data: existingChunks, error: chunkErr } = await supabase.rpc("match_knowledge", {
      query_embedding: questionEmbedding,
      query_text: params.question,
      target_audience: null,
      required_tags: null,
      match_count: 3,
    });
    if (chunkErr) {
      console.error("[gap] knowledge cross-check error:", chunkErr);
    } else if (existingChunks && existingChunks.length > 0) {
      // If a published chunk is a strong semantic match, this is already covered.
      const top = existingChunks[0] as any;
      const isPublishedStrongMatch = top.similarity >= 0.82;
      if (isPublishedStrongMatch) {
        // Verify it's actually published (RPC returns unpublished too via service role)
        const { data: pubCheck } = await supabase
          .from("knowledge_chunks")
          .select("id, is_published")
          .eq("id", top.id)
          .single();
        if (pubCheck?.is_published) {
          return { action: "skipped", reason: "already_in_knowledge_base", matchedChunkId: top.id };
        }
      }
    }

    // GUARD 3 — already a draft (pending OR approved) covering this?
    const { data: existingDrafts, error: draftsErr } = await supabase
      .from("knowledge_drafts")
      .select("id, proposed_title, review_notes, status, created_at")
      .eq("derived_from", "client_question_gap")
      .in("status", ["pending", "approved"])
      .limit(100);

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
      // If it's an approved draft, the article is coming — don't increment, just skip.
      if (matchingDraft.status === "approved") {
        return { action: "skipped", reason: "already_drafted_and_approved", draftId: matchingDraft.id };
      }
      // Pending draft — bump asked_count.
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

    // All guards passed — create a new draft.
    const metadata = {
      asked_count: 1,
      first_asked_at: new Date().toISOString(),
      last_asked_at: new Date().toISOString(),
      retrieval_confidence: params.retrievalConfidence,
      claude_confidence: params.claudeConfidence,
    };

    const rationale = `A user asked this question but our knowledge base didn't have a confident answer. This is a candidate for a new article. Retrieved context (may or may not be relevant):\n\n${params.retrievedContext.slice(0, 2000)}`;

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