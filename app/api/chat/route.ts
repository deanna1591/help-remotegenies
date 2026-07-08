import Anthropic from "@anthropic-ai/sdk";
import { retrieveForClient, retrieveLearningLessons, retrieveUrls, computeConfidence } from "@/lib/retrieval";
import { buildClientSystemPrompt, formatRetrievedForClient, formatLearningLessonsForClient, formatUrlRegistry } from "@/lib/prompt";
import { stripJiraRefs } from "@/lib/sanitize";
import { handleQuestionGap } from "@/lib/gap-detection";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let anthropicCached: Anthropic | null = null;
function anthropic(): Anthropic {
  if (anthropicCached) return anthropicCached;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("Missing ANTHROPIC_API_KEY in env");
  anthropicCached = new Anthropic({ apiKey: key });
  return anthropicCached;
}

const rateLimits = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const rec = rateLimits.get(ip);
  if (!rec || now > rec.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (rec.count >= RATE_LIMIT_MAX) return false;
  rec.count++;
  return true;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(ip)) return new Response("Rate limit exceeded.", { status: 429 });

  const body = await req.json();
  const messages: Array<{ role: "user" | "assistant"; content: string }> = body.messages ?? [];
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser) return new Response("No user message", { status: 400 });

  const cleanMessages = messages.map((m) => ({ role: m.role, content: stripJiraRefs(m.content) }));

  const [retrieved, lessons, urls] = await Promise.all([
    retrieveForClient(lastUser.content, 6),
    retrieveLearningLessons(lastUser.content, 5),
    retrieveUrls(lastUser.content, "client", 5),
  ]);

  const confidence = computeConfidence(retrieved);
  const context = formatRetrievedForClient(retrieved);
  const lessonText = formatLearningLessonsForClient(lessons);
  const urlText = formatUrlRegistry(urls);
  const system = buildClientSystemPrompt(context, lessonText, urlText);

  const citations = retrieved.map((c) => ({
    title: c.title,
    id: c.id,
    similarity: c.similarity,
    url: `/article/${c.id}`,
  }));

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const write = (obj: unknown) => controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      try {
        write({ type: "citations", value: citations });
        write({ type: "meta", value: { retrieval_confidence: confidence, chunks_found: retrieved.length } });
        const resp = anthropic().messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 1024,
          system,
          messages: cleanMessages.map((m) => ({ role: m.role, content: m.content })),
        });
        let buffer = "";
        for await (const event of resp) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            buffer += event.delta.text;
            // Send raw tokens; sanitization happens client-side on assembled message
            write({ type: "text", value: event.delta.text });
          }
        }
        const claudeConfidenceMatch = buffer.match(/\[\[CONFIDENCE:(high|medium|low)\]\]/i);
        const claudeConfidence = claudeConfidenceMatch?.[1]?.toLowerCase() ?? "unknown";

        write({
          type: "final_meta",
          value: {
            retrieval_confidence: confidence,
            claude_confidence: claudeConfidence,
            question: lastUser.content,
          },
        });

        // Gap detection: if either signal says low confidence, flag for admin
        const isLowConfidence =
          (confidence === "low" && claudeConfidence !== "high") ||
          (claudeConfidence === "low" && confidence !== "high");

        if (isLowConfidence) {
          const gapResult = await handleQuestionGap({
            question: lastUser.content,
            retrievedContext: context,
            retrievalConfidence: confidence,
            claudeConfidence,
          });
          write({ type: "gap_flagged", value: gapResult });
        }
      } catch (err) {
        write({ type: "text", value: "\n\nSomething went wrong. Try again, or email support@remotegenies.com." });
        console.error("[client chat] error:", err);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-cache" },
  });
}
