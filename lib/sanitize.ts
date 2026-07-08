/**
 * Strip Jira ticket references from text.
 * These are internal-only and must never appear in client-facing content.
 */
export function stripJiraRefs(text: string): string {
  return text
    .replace(/\[source:\s*RG-\d+[^\]]*\]/gi, "")
    .replace(/\[RG-\d+\]/g, "")
    .replace(/\bRG-\d+\b/g, "")
    .replace(/\[source:\s*[^\]]+\]/gi, "")
    .replace(/\s+\./g, ".")
    .replace(/\s+,/g, ",")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Extract confidence marker from response, return {content, confidence}.
 */
export function extractConfidence(text: string): { content: string; confidence: "high" | "medium" | "low" | "unknown" } {
  const match = text.match(/\[\[CONFIDENCE:(high|medium|low)\]\]/i);
  if (!match) return { content: text.trim(), confidence: "unknown" };
  const confidence = match[1].toLowerCase() as "high" | "medium" | "low";
  const cleaned = text.replace(/\[\[CONFIDENCE:(high|medium|low)\]\]/gi, "").trim();
  return { content: cleaned, confidence };
}
