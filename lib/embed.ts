import OpenAI from "openai";

let cached: OpenAI | null = null;

function openai(): OpenAI {
  if (cached) return cached;
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("Missing OPENAI_API_KEY in env");
  cached = new OpenAI({ apiKey: key });
  return cached;
}

/**
 * Embed a text with OpenAI text-embedding-3-large (1024 dimensions).
 * Must match what Jinni's corpus was embedded with.
 */
export async function embed(text: string): Promise<number[]> {
  const trimmed = text.slice(0, 8000);
  const res = await openai().embeddings.create({
    model: "text-embedding-3-large",
    input: trimmed,
    dimensions: 1024,
  });
  return res.data[0].embedding;
}
