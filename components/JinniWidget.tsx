"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Citation = { title: string | null; id: string; similarity: number; url: string };
type FinalMeta = { retrieval_confidence: string; claude_confidence: string; question: string };
type GapResult = { action: string; askedCount?: number; draftId?: string };

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  finalMeta?: FinalMeta;
  gapFlagged?: GapResult;
  feedback?: "positive" | "negative" | null;
  feedbackSaved?: boolean;
};

const STORAGE_KEY = "jinni_widget_messages_v1";
const MAX_STORED = 30;

function loadStoredMessages(): Message[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(-MAX_STORED) : [];
  } catch {
    return [];
  }
}

function saveStoredMessages(messages: Message[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_STORED)));
  } catch {}
}

export default function JinniWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMessages(loadStoredMessages());
    setHasLoaded(true);
  }, []);
  useEffect(() => {
    function handleOpenEvent() {
      setIsOpen(true);
    }
    window.addEventListener("jinni:open", handleOpenEvent);
    return () => window.removeEventListener("jinni:open", handleOpenEvent);
  }, []);
  useEffect(() => {
    if (hasLoaded) saveStoredMessages(messages);
  }, [messages, hasLoaded]);

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, messages]);

  const clearHistory = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  async function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: trimmed };
    const assistantMsg: Message = { id: crypto.randomUUID(), role: "assistant", content: "" };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setIsStreaming(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (!res.ok || !res.body) throw new Error("Chat error: " + res.status);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n").filter(Boolean)) {
          try {
            const evt = JSON.parse(line);
            if (evt.type === "text") {
              accumulated += evt.value;
              setMessages((prev) => prev.map((m) => (m.id === assistantMsg.id ? { ...m, content: accumulated } : m)));
            } else if (evt.type === "citations") {
              setMessages((prev) => prev.map((m) => (m.id === assistantMsg.id ? { ...m, citations: evt.value } : m)));
            } else if (evt.type === "final_meta") {
              setMessages((prev) => prev.map((m) => (m.id === assistantMsg.id ? { ...m, finalMeta: evt.value } : m)));
            } else if (evt.type === "gap_flagged") {
              setMessages((prev) => prev.map((m) => (m.id === assistantMsg.id ? { ...m, gapFlagged: evt.value } : m)));
            }
          } catch {}
        }
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => prev.map((m) => (m.id === assistantMsg.id ? { ...m, content: "Something went wrong. Try again, or email support@remotegenies.com." } : m)));
    } finally {
      setIsStreaming(false);
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

 function stripInternalMarkers(text: string): string {
    return text
      .replace(/\[\[CONFIDENCE:(high|medium|low)\]\]/gi, "")
      .replace(/\[source:\s*RG-\d+[^\]]*\]/gi, "")
      .replace(/\[RG-\d+\]/g, "")
      .replace(/\bRG-\d+\b/g, "")
      .replace(/\[source:\s*[^\]]+\]/gi, "")
      .replace(/\s+([.,;:!?])/g, "$1")
      .trim();
  }

  return (
    <>
    <button
        onClick={() => setIsOpen(true)}
        className={"fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center gap-2 bg-gradient-primary text-white px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl shadow-hero hover:shadow-lg hover:-translate-y-0.5 transition-all " + (isOpen ? "opacity-0 pointer-events-none" : "opacity-100")}
        aria-label="Chat with Jinni"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span className="text-sm font-medium">Ask Jinni</span>
      </button>

    <div className={"fixed z-50 bg-white shadow-2xl border border-gray-200 flex flex-col overflow-hidden transition-all origin-bottom-right " + (isExpanded ? "inset-0 sm:inset-auto sm:bottom-4 sm:right-4 sm:top-4 sm:w-[900px] sm:h-[calc(100vh-2rem)] rounded-none sm:rounded-3xl" : "inset-0 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[440px] sm:h-[640px] max-h-none sm:max-h-[720px] rounded-none sm:rounded-3xl") + " " + (isOpen ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none")}>
        <header className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-primary text-white">
          <div className="flex items-center gap-2.5">
          <img src="/jinni-avatar.png" alt="Jinni" className="w-8 h-8 rounded-lg object-cover bg-white" />
            <div>
              <div className="text-sm font-semibold leading-tight">Jinni</div>
              <div className="text-xs text-white/80 leading-tight">Ask me anything</div>
            </div>
          </div>
         <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                onClick={clearHistory}
                className="text-xs text-white/80 hover:text-white px-2 py-1 rounded hover:bg-white/10 transition"
                title="Clear conversation"
              >
                Clear
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-white/80 hover:text-white w-8 h-8 rounded-lg hover:bg-white/10 transition hidden sm:flex items-center justify-center"
              aria-label={isExpanded ? "Minimize chat" : "Expand chat"}
              title={isExpanded ? "Minimize" : "Expand"}
            >
              {isExpanded ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="4 14 10 14 10 20" />
                  <polyline points="20 10 14 10 14 4" />
                  <line x1="14" y1="10" x2="21" y2="3" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 3 21 3 21 9" />
                  <polyline points="9 21 3 21 3 15" />
                  <line x1="21" y1="3" x2="14" y2="10" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </svg>
              )}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white w-8 h-8 rounded-lg hover:bg-white/10 transition flex items-center justify-center"
              aria-label="Close chat"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4 bg-surface-wash/40">
          {messages.length === 0 ? (
            <EmptyState onQuickAsk={(q) => setInput(q)} />
          ) : (
            <div className="space-y-4">
              {messages.map((m) => (
                <MessageBubble
                  key={m.id}
                  message={m}
                  stripInternalMarkers={stripInternalMarkers}
                  onFeedbackSaved={(id, kind) => setMessages((prev) => prev.map((mm) => (mm.id === id ? { ...mm, feedback: kind, feedbackSaved: true } : mm)))}
                />
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 bg-white p-3">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Type your question..."
              rows={1}
              disabled={isStreaming}
              className="flex-1 resize-none bg-gray-50 rounded-xl px-3 py-2.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-primary/30 max-h-32"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isStreaming}
              className="bg-gradient-primary text-white w-10 h-10 rounded-xl disabled:opacity-40 hover:opacity-95 transition flex items-center justify-center shrink-0"
              aria-label="Send"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
          <p className="text-[10px] text-ink-faint text-center mt-2">Jinni answers from our knowledge base. Not sure? She'll flag it for our team.</p>
        </div>
      </div>
    </>
  );
}

function EmptyState({ onQuickAsk }: { onQuickAsk: (q: string) => void }) {
  const suggestions = [
    "How do I post a task?",
    "How do the tiers work?",
    "How do free credits work?",
    "How do I raise a dispute?",
  ];
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-4">
     <img src="/jinni-avatar.png" alt="Jinni" className="w-14 h-14 rounded-2xl object-cover mb-3 shadow-hero" />
      <h3 className="font-semibold text-ink mb-1">Hi, I'm Jinni</h3>
      <p className="text-sm text-ink-muted mb-6 max-w-xs">Ask me anything about RemoteGenies. I answer from our knowledge base 24/7.</p>
      <div className="space-y-2 w-full max-w-xs">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => onQuickAsk(s)}
            className="w-full text-left text-sm px-4 py-2.5 bg-white border border-gray-100 hover:border-primary/30 hover:text-primary rounded-xl transition"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  stripInternalMarkers,
  onFeedbackSaved,
}: {
  message: Message;
  stripInternalMarkers: (t: string) => string;
  onFeedbackSaved: (id: string, kind: "positive" | "negative") => void;
}) {
  const [showCorrection, setShowCorrection] = useState(false);
  const [correction, setCorrection] = useState("");
  const [reasonCat, setReasonCat] = useState("wrong_info");
  const [busy, setBusy] = useState(false);

  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="bg-gradient-primary text-white rounded-2xl rounded-br-md px-4 py-2.5 max-w-[85%] text-sm whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    );
  }

const displayContent = stripInternalMarkers(message.content);
  const gap = message.gapFlagged;
  const hasRelatedArticles = (message.citations?.filter((c) => c.similarity > 0.5) ?? []).length > 0;
  const hasSubstantiveAnswer = displayContent.length > 200;
  const wasGapFlagged = gap && (gap.action === "created" || gap.action === "incremented") && !hasRelatedArticles && !hasSubstantiveAnswer;
  async function submitFeedback(kind: "positive" | "negative", correctionText?: string) {
    setBusy(true);
    try {
      // Feedback logging not yet implemented — placeholder for future admin-review queue
      onFeedbackSaved(message.id, kind);
      setShowCorrection(false);
      setCorrection("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex gap-2.5">
     <img src="/jinni-avatar.png" alt="Jinni" className="w-8 h-8 rounded-lg object-cover shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="prose prose-sm max-w-none prose-p:my-2 prose-p:leading-relaxed prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-1.5 prose-h2:text-base prose-h3:text-sm prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-table:text-xs prose-th:bg-gray-50 prose-th:font-semibold prose-th:px-2 prose-th:py-1.5 prose-th:border prose-th:border-gray-100 prose-td:px-2 prose-td:py-1.5 prose-td:border prose-td:border-gray-100 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-[11px] prose-code:before:content-none prose-code:after:content-none prose-blockquote:border-l-primary prose-blockquote:bg-primary-soft/40 prose-blockquote:py-1 prose-blockquote:px-3 prose-blockquote:rounded-r prose-blockquote:not-italic">
          {displayContent ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
              a: ({ href, children, ...rest }) => {
                  const url = href || "";
                  const isExternal = url.startsWith("http") || url.startsWith("mailto:");
                  return (
                    <a
                      href={url}
                      target={isExternal ? "_blank" : undefined}
                      rel={isExternal ? "noopener noreferrer" : undefined}
                      className="inline-flex items-center gap-1 bg-gradient-primary text-white text-[13px] font-medium px-3 py-1 rounded-full hover:opacity-95 transition no-underline my-0.5"
                      {...rest}
                    >
                      <span>{children}</span>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-80">
                        <line x1="7" y1="17" x2="17" y2="7" />
                        <polyline points="7 7 17 7 17 17" />
                      </svg>
                    </a>
                  );
                },
              }}
            >
              {displayContent}
            </ReactMarkdown>
          ) : (
            <span className="text-ink-faint">...</span>
          )}
        </div>

       {message.citations && message.citations.filter((c) => c.similarity > 0.5).length > 0 && (
          <div className="mt-3 pt-2 border-t border-gray-100">
            <div className="text-[10px] uppercase tracking-wider text-ink-faint font-semibold mb-2">Related articles</div>
            <div className="flex flex-wrap gap-1.5">
              {message.citations.filter((c) => c.similarity > 0.5).slice(0, 3).map((c) => (
                <Link
                  key={c.id}
                  href={c.url}
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-gradient-primary text-white rounded-full hover:opacity-95 transition no-underline max-w-full"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-90">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <span className="truncate">{c.title || "Read article"}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {wasGapFlagged && (
          <div className="mt-3 bg-primary-soft/60 border border-primary/10 rounded-xl p-3 text-xs">
            <div className="font-semibold text-primary mb-0.5">📋 Flagged for our team</div>
            <p className="text-ink-muted mb-2">Our team will write a proper article for this. In the meantime, want to email support?</p>
            <a href="mailto:support@remotegenies.com" className="inline-block text-xs font-medium text-primary hover:underline">Email support@remotegenies.com →</a>
          </div>
        )}

        {displayContent && !message.feedback && !showCorrection && (
          <div className="mt-2 flex items-center gap-1">
            <button
              onClick={() => submitFeedback("positive")}
              disabled={busy}
              className="text-xs px-2 py-1 hover:bg-gray-100 rounded text-ink-faint hover:text-ink transition"
              title="Helpful"
            >
              👍
            </button>
            <button
              onClick={() => setShowCorrection(true)}
              disabled={busy}
              className="text-xs px-2 py-1 hover:bg-gray-100 rounded text-ink-faint hover:text-ink transition"
              title="Not helpful"
            >
              👎
            </button>
          </div>
        )}

        {message.feedback && (
          <div className="mt-2 text-xs text-ink-faint italic">
            {message.feedback === "positive" ? "Thanks — glad this was helpful." : "Thanks — we'll review this."}
          </div>
        )}

        {showCorrection && (
          <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
            <div className="text-xs font-semibold text-amber-900 mb-2">What was wrong?</div>
            <select
              value={reasonCat}
              onChange={(e) => setReasonCat(e.target.value)}
              className="w-full text-xs border border-amber-300 rounded-md px-2 py-1.5 bg-white mb-2"
              disabled={busy}
            >
              <option value="wrong_info">Wrong information</option>
              <option value="missing_info">Missing information</option>
              <option value="confusing">Confusing</option>
              <option value="not_relevant">Not what I asked</option>
              <option value="other">Other</option>
            </select>
            <textarea
              value={correction}
              onChange={(e) => setCorrection(e.target.value)}
              placeholder="What should the answer be? (optional)"
              rows={2}
              disabled={busy}
              className="w-full text-xs border border-amber-300 rounded-md px-2 py-1.5 bg-white mb-2 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => submitFeedback("negative", correction)}
                disabled={busy}
                className="flex-1 text-xs bg-primary text-white px-3 py-1.5 rounded-md font-medium disabled:opacity-50 hover:opacity-95"
              >
                Send
              </button>
              <button
                onClick={() => { setShowCorrection(false); setCorrection(""); }}
                disabled={busy}
                className="text-xs bg-white border border-gray-300 text-ink px-3 py-1.5 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
