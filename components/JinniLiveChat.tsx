"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  brevoAvailable,
  startLiveIdentity,
  sendVisitorMessage,
  getLiveIdentity,
  loadThread,
  saveThread,
  clearLiveChat,
  type LiveMessage,
  type LiveIdentity,
} from "@/lib/live-chat";

const URL_RE = /(https?:\/\/[^\s<>"]+)/g;
const IMG_RE = /\.(png|jpe?g|gif|webp)(\?[^\s]*)?$/i;

function RichBody({ text, light }: { text: string; light?: boolean }) {
  const parts = text.split(URL_RE);
  return (
    <>
      {parts.map((p, i) => {
        if (!/^https?:\/\//.test(p)) return <span key={i}>{p}</span>;
        if (IMG_RE.test(p)) {
          return (
            <a key={i} href={p} target="_blank" rel="noopener noreferrer" className="block my-1">
              <img src={p} alt="attachment" className="max-h-48 max-w-full rounded-lg border border-black/10" />
            </a>
          );
        }
        return (
          <a key={i} href={p} target="_blank" rel="noopener noreferrer"
            className={(light ? "text-white underline" : "text-primary underline") + " break-all"}>
            {p}
          </a>
        );
      })}
    </>
  );
}

export default function JinniLiveChat({
  transcript,
  defaultMessage,
  onExit,
}: {
  transcript: { role: string; content: string }[];
  defaultMessage: string;
  onExit: () => void;
}) {
  const [identity, setIdentity] = useState<LiveIdentity | null>(null);
  const [msgs, setMsgs] = useState<LiveMessage[]>([]);
  const [input, setInput] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const [audience, setAudience] = useState<"client" | "genie">("client");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [firstMessage, setFirstMessage] = useState(defaultMessage);

  const seenIdsRef = useRef<Set<string>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);

  // Restore identity + thread on mount
  useEffect(() => {
    const id = getLiveIdentity();
    if (id) {
      setIdentity(id);
      setAudience(id.audience);
    }
    const stored = loadThread();
    stored.forEach((m) => seenIdsRef.current.add(m.id));
    setMsgs(stored);
    setHasLoaded(true);
  }, []);

  useEffect(() => {
    if (hasLoaded) saveThread(msgs);
  }, [msgs, hasLoaded]);

  // Receive messages from the hidden Brevo widget (agent, bot, and echoes of
  // our own visitor sends). Dedupe echoes against optimistic local messages.
  useEffect(() => {
    function onBrevoMessage(e: Event) {
      const m = (e as CustomEvent).detail as { id?: string; text?: string; type?: string; createdAt?: number };
      if (!m || !m.id || !m.text) return;
      const msgId = m.id;
      const msgText = m.text;
      const msgAt = m.createdAt || Date.now();
      if (seenIdsRef.current.has(msgId)) return;
      const type = m.type === "agent" || m.type === "bot" ? m.type : "visitor";
      seenIdsRef.current.add(msgId);
      setMsgs((prev) => {
        if (type === "visitor") {
          const idx = prev.findIndex((p) => p.id.startsWith("local-") && p.text === msgText);
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = { id: msgId, text: msgText, type, createdAt: msgAt };
            return next;
          }
        }
        return [...prev, { id: msgId, text: msgText, type, createdAt: msgAt }];
      });
    }
    window.addEventListener("brevo:message", onBrevoMessage);
    return () => window.removeEventListener("brevo:message", onBrevoMessage);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  function appendLocalVisitor(text: string) {
    setMsgs((prev) => [
      ...prev,
      { id: "local-" + crypto.randomUUID(), text, type: "visitor", createdAt: Date.now() },
    ]);
  }

  function handleStart() {
    setFormError(null);
    const name = fullName.trim();
    const mail = email.trim();
    const msg = firstMessage.trim();
    if (!name) return setFormError("Please enter your name.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) return setFormError("Please enter a valid email.");
    if (!msg) return setFormError("Please tell us what you need help with.");
    if (!brevoAvailable()) {
      setFormError("Live chat is still loading. Please try again in a moment, or email support@remotegenies.com.");
      return;
    }

    const id: LiveIdentity = { audience, fullName: name, email: mail };
    const ok = startLiveIdentity(id, transcript);
    if (!ok) {
      setFormError("Could not start the chat. Please try again or email support@remotegenies.com.");
      return;
    }
    setIdentity(id);
    if (sendVisitorMessage(msg)) {
      appendLocalVisitor(msg);
    }
  }

  function handleSend() {
    const body = input.trim();
    if (!body) return;
    if (sendVisitorMessage(body)) {
      appendLocalVisitor(body);
      setInput("");
    }
  }

  function handleEnd() {
    clearLiveChat();
    onExit();
  }

  if (!identity) {
    return (
      <div className="flex-1 overflow-y-auto px-5 py-5 bg-surface-wash/40">
        <h3 className="font-semibold text-ink mb-1">Connect with our team</h3>
        <p className="text-sm text-ink-muted mb-4">
          Leave your details so we can follow up by email if you step away.
        </p>

        <div className="flex gap-2 mb-3">
          {(["client", "genie"] as const).map((a) => (
            <button
              key={a}
              onClick={() => setAudience(a)}
              className={
                "flex-1 text-sm font-medium px-3 py-2 rounded-xl border transition " +
                (audience === a
                  ? "bg-gradient-primary text-white border-transparent"
                  : "bg-white border-gray-200 text-ink-muted hover:border-primary/30")
              }
            >
              {a === "client" ? "I'm a client" : "I'm a Genie"}
            </button>
          ))}
        </div>

        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Your name"
          className="w-full text-sm bg-white border border-gray-200 rounded-xl px-3 py-2.5 mb-2 outline-none focus:ring-2 focus:ring-primary/30"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          type="email"
          className="w-full text-sm bg-white border border-gray-200 rounded-xl px-3 py-2.5 mb-2 outline-none focus:ring-2 focus:ring-primary/30"
        />
        <textarea
          value={firstMessage}
          onChange={(e) => setFirstMessage(e.target.value)}
          placeholder="What do you need help with?"
          rows={3}
          className="w-full text-sm bg-white border border-gray-200 rounded-xl px-3 py-2.5 mb-2 outline-none focus:ring-2 focus:ring-primary/30 resize-none"
        />

        {formError && <p className="text-xs text-red-600 mb-2">{formError}</p>}

        <button
          onClick={handleStart}
          className="w-full bg-gradient-primary text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-95 transition"
        >
          Start chat
        </button>
        <button
          onClick={onExit}
          className="w-full text-xs text-ink-faint hover:text-ink mt-2 py-1"
        >
          Back to Jinni
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto px-4 py-4 bg-surface-wash/40">
        <div className="text-center mb-3">
          <span className="inline-block text-[11px] text-ink-muted bg-white border border-gray-100 rounded-full px-3 py-1">
            You are connected. If you leave, we will follow up at {identity.email}.
          </span>
        </div>
        <div className="space-y-3">
          {msgs.map((m) =>
            m.type === "visitor" ? (
              <div key={m.id} className="flex justify-end">
                <div className="bg-gradient-primary text-white rounded-2xl rounded-br-md px-4 py-2.5 max-w-[85%] text-sm whitespace-pre-wrap">
                  <RichBody text={m.text} light />
                </div>
              </div>
            ) : (
              <div key={m.id} className="flex flex-col items-start">
                <span className="text-[10px] text-ink-faint mb-0.5 ml-1">
                  {m.type === "bot" ? "Jinni assistant" : "RemoteGenies team"}
                </span>
                <div className="bg-white border border-gray-100 text-ink rounded-2xl rounded-bl-md px-4 py-2.5 max-w-[85%] text-sm whitespace-pre-wrap">
                  <RichBody text={m.text} />
                </div>
              </div>
            )
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-gray-100 bg-white p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 resize-none bg-gray-50 rounded-xl px-3 py-2.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-primary/30 max-h-32"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="bg-gradient-primary text-white w-10 h-10 rounded-xl disabled:opacity-40 hover:opacity-95 transition flex items-center justify-center shrink-0"
            aria-label="Send"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <button
          onClick={handleEnd}
          className="w-full text-[11px] text-ink-faint hover:text-ink mt-2"
        >
          End chat and return to Jinni
        </button>
      </div>
    </>
  );
}
