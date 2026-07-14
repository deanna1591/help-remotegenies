"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Article = { id: string; title: string | null; tags?: string[] };

const HIDDEN_TAGS = new Set(["client", "genie", "internal"]);

function humanize(tag: string): string {
  return tag.split(/[-_]/).map((w) => (w[0]?.toUpperCase() ?? "") + w.slice(1)).join(" ");
}

/**
 * Groups articles by their first non-hidden tag (their "topic"), matching the
 * homepage's tag-based categorisation. An article with no usable tag falls
 * under "Other".
 */
function groupByTopic(articles: Article[]): { topic: string; items: Article[] }[] {
  const map = new Map<string, Article[]>();
  for (const a of articles) {
    const topicTag = (a.tags || []).find((t) => !HIDDEN_TAGS.has(t.toLowerCase()));
    const topic = topicTag ? humanize(topicTag) : "Other";
    if (!map.has(topic)) map.set(topic, []);
    map.get(topic)!.push(a);
  }
  return Array.from(map.entries())
    .map(([topic, items]) => ({ topic, items: items.sort((x, y) => (x.title || "").localeCompare(y.title || "")) }))
    .sort((a, b) => a.topic.localeCompare(b.topic));
}

export default function ArticleSidebar({
  articles,
  currentId,
}: {
  articles: Article[];
  currentId: string;
}) {
  const [query, setQuery] = useState("");
  const [openMobile, setOpenMobile] = useState(false);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? articles.filter((a) => (a.title || "").toLowerCase().includes(q))
      : articles;
    return groupByTopic(filtered);
  }, [articles, query]);

  const totalShown = groups.reduce((n, g) => n + g.items.length, 0);

  const list = (
    <div className="space-y-5">
      {/* Search */}
      <div className="relative">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search articles..."
          className="w-full bg-white border border-gray-200 focus:border-primary/50 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none transition placeholder:text-ink-faint"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
          width="15" height="15" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>

      {/* Grouped list */}
      {groups.length === 0 ? (
        <p className="text-sm text-ink-faint px-1">No articles match "{query}".</p>
      ) : (
        <nav className="space-y-5">
          {groups.map((g) => (
            <div key={g.topic}>
              <div className="text-xs font-semibold uppercase tracking-wide text-ink-faint mb-2 px-1">
                {g.topic}
              </div>
              <ul className="space-y-0.5">
                {g.items.map((a) => {
                  const active = a.id === currentId;
                  return (
                    <li key={a.id}>
                      <Link
                        href={`/article/${a.id}`}
                        className={
                          "block text-sm rounded-lg px-3 py-1.5 transition " +
                          (active
                            ? "bg-primary-soft text-primary-hover font-medium"
                            : "text-ink-muted hover:bg-gray-50 hover:text-ink")
                        }
                      >
                        {a.title || "(untitled)"}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile: collapsible toggle */}
      <div className="lg:hidden mb-6">
        <button
          onClick={() => setOpenMobile((v) => !v)}
          className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-ink"
        >
          <span>Browse all articles ({totalShown})</span>
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={"transition-transform " + (openMobile ? "rotate-180" : "")}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        {openMobile && (
          <div className="mt-3 bg-white border border-gray-100 rounded-2xl p-4 shadow-card">
            {list}
          </div>
        )}
      </div>

      {/* Desktop: sticky sidebar */}
      <aside className="hidden lg:block">
        <div className="sticky top-8 bg-white border border-gray-100 rounded-2xl p-5 shadow-card max-h-[calc(100vh-4rem)] overflow-y-auto">
          {list}
        </div>
      </aside>
    </>
  );
}
