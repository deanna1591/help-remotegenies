/**
 * brevo-handoff.ts
 * Hands a Jinni conversation off to a live Brevo Conversations agent.
 * Pushes the Jinni transcript into Brevo (visible in the agent's right pane),
 * then opens the Brevo chat widget.
 */

type BrevoFn = (command: string, ...args: any[]) => void;

declare global {
  interface Window {
    BrevoConversations?: BrevoFn;
    BrevoConversationsID?: string;
  }
}

export type HandoffContext = {
  transcript?: { role: string; content: string }[];
};

export function brevoAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.BrevoConversations === "function";
}

export function handoffToAgent(ctx: HandoffContext): boolean {
  if (!brevoAvailable()) {
    console.warn("[brevo-handoff] BrevoConversations not loaded yet");
    return false;
  }
  const brevo = window.BrevoConversations!;

  // Compact transcript for the agent's right pane (last 12 messages, bounded).
  const transcriptText = (ctx.transcript ?? [])
    .filter((m) => m.content && m.content.trim())
    .slice(-12)
    .map((m) => `${m.role === "user" ? "Visitor" : "Jinni"}: ${m.content.replace(/\s+/g, " ").trim()}`)
    .join("\n")
    .slice(0, 4000);

  try {
    brevo("updateIntegrationData", {
      JINNI_HANDOFF: "true",
      JINNI_TRANSCRIPT: transcriptText || "No prior Jinni messages.",
    });
  } catch (e) {
    console.error("[brevo-handoff] updateIntegrationData failed", e);
  }

  try {
    brevo("show");
    brevo("openChat", true);
  } catch (e) {
    console.error("[brevo-handoff] openChat failed", e);
    return false;
  }
  return true;
}

/**
 * Detects whether a user's message is asking to talk to a human agent.
 * Used for offer-first intent detection (we OFFER handoff, never auto-open).
 */
export function looksLikeHandoffRequest(text: string): boolean {
  const t = text.toLowerCase();
  const patterns = [
    /talk to (a |an )?(human|person|agent|rep|representative|someone|somebody)/,
    /speak (to|with) (a |an )?(human|person|agent|rep|representative|someone|somebody)/,
    /(live|real) (agent|person|human|support|chat)/,
    /chat with (a |an )?(human|person|agent|someone)/,
    /connect me (to|with)/,
    /can i (talk|speak|chat) to/,
    /(customer|human) support/,
    /contact (support|an agent|a human)/,
  ];
  return patterns.some((re) => re.test(t));
}
