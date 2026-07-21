/**
 * live-chat.ts
 * Headless Brevo Conversations bridge. The Brevo widget stays hidden;
 * the Jinni widget is the visitor-facing UI. Messages flow:
 *   visitor -> sendVisitorMessage -> Brevo inbox (agent replies there)
 *   agent/bot -> onNewMessage callback (layout.tsx) -> 'brevo:message' event
 */

type BrevoFn = (command: string, ...args: any[]) => void;

declare global {
  interface Window {
    BrevoConversations?: BrevoFn;
    BrevoConversationsID?: string;
  }
}

export type LiveMessage = {
  id: string;
  text: string;
  type: "agent" | "visitor" | "bot";
  createdAt: number;
};

export type LiveIdentity = {
  audience: "client" | "genie";
  fullName: string;
  email: string;
};

const IDENTITY_KEY = "jinni_live_identity_v1";
const THREAD_KEY = "jinni_live_thread_v1";
const MAX_THREAD = 100;

export function brevoAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.BrevoConversations === "function";
}

function brevo(command: string, ...args: any[]): boolean {
  if (!brevoAvailable()) {
    console.warn("[live-chat] BrevoConversations not loaded");
    return false;
  }
  try {
    window.BrevoConversations!(command, ...args);
    return true;
  } catch (e) {
    console.error("[live-chat] " + command + " failed", e);
    return false;
  }
}

export function getLiveIdentity(): LiveIdentity | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(IDENTITY_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (p && p.email && p.fullName) return p as LiveIdentity;
    return null;
  } catch {
    return null;
  }
}

export function hasActiveLiveChat(): boolean {
  return getLiveIdentity() !== null;
}

export function loadThread(): LiveMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(THREAD_KEY);
    if (!raw) return [];
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p.slice(-MAX_THREAD) : [];
  } catch {
    return [];
  }
}

export function saveThread(msgs: LiveMessage[]) {
  try {
    localStorage.setItem(THREAD_KEY, JSON.stringify(msgs.slice(-MAX_THREAD)));
  } catch {}
}

export function clearLiveChat() {
  try {
    localStorage.removeItem(IDENTITY_KEY);
    localStorage.removeItem(THREAD_KEY);
  } catch {}
}

/**
 * Registers the visitor with Brevo (right pane + contact sync) and stores
 * identity locally. Call once when the visitor submits the connect form.
 */
export function startLiveIdentity(
  identity: LiveIdentity,
  transcript: { role: string; content: string }[]
): boolean {
  const nameParts = identity.fullName.trim().split(/\s+/);
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ");

  const transcriptText = (transcript ?? [])
    .filter((m) => m.content && m.content.trim())
    .slice(-12)
    .map((m) => (m.role === "user" ? "Visitor" : "Jinni") + ": " + m.content.replace(/\s+/g, " ").trim())
    .join("\n")
    .slice(0, 4000);

  const ok = brevo("updateIntegrationData", {
    email: identity.email.trim().toLowerCase(),
    firstName: firstName,
    lastName: lastName,
    AUDIENCE: identity.audience,
    SOURCE: "jinni_widget",
    JINNI_TRANSCRIPT: transcriptText || "No prior Jinni messages.",
  });

  if (ok) {
    try {
      localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity));
    } catch {}
  }
  return ok;
}

export function sendVisitorMessage(text: string): boolean {
  return brevo("sendVisitorMessage", text);
}

export function startScenario(scenarioId: string): boolean {
  return brevo("startBotScenario", scenarioId);
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
