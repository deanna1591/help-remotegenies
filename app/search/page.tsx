import Link from "next/link";
import Image from "next/image";
import { getPublishedArticles } from "@/lib/supabase";
import AskJinniButton from "@/components/AskJinniButton";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Trending from "@/components/Trending";

export const dynamic = "force-dynamic";

const HIDDEN_TAGS = new Set(["client", "genie", "internal"]);

function humanize(tag: string): string {
  return tag.split(/[-_]/).map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
}

function preview(md: string, maxChars = 180): string {
  const stripped = md
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[#*_>`~\[\]()!-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return stripped.length > maxChars ? stripped.slice(0, maxChars) + "..." : stripped;
}

function highlightExcerpt(content: string, query: string, maxChars = 220): string {
  const lower = content.toLowerCase();
  const needle = query.toLowerCase();
  const idx = lower.indexOf(needle);
  if (idx === -1) return preview(content, maxChars);
  const start = Math.max(0, idx - 60);
  const excerpt = content.slice(start, start + maxChars);
  return (start > 0 ? "..." : "") + preview(excerpt, maxChars);
}

function scoreArticle(article: any, query: string): number {
  const q = query.toLowerCase();
  const title = (article.title || "").toLowerCase();
  const content = article.content.toLowerCase();
  const tags = (article.tags || []).map((t: string) => t.toLowerCase());
  let score = 0;
  if (title === q) score += 100;
  else if (title.includes(q)) score += 50;
  if (tags.some((t: string) => t === q)) score += 30;
  if (tags.some((t: string) => t.includes(q))) score += 10;
  const contentMatches = (content.match(new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;
  score += Math.min(contentMatches * 5, 40);
  const words = q.split(/\s+/).filter((w) => w.length > 2);
  for (const word of words) {
    if (title.includes(word)) score += 3;
    if (content.includes(word)) score += 1;
  }
  return score;
}

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const query = (searchParams.q || "").trim();
  const articles = await getPublishedArticles();

  const results = query
    ? articles
        .map((a) => ({ article: a, score: scoreArticle(a, query) }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 25)
        .map((x) => x.article)
    : [];

  return (
    <div className="min-h-screen bg-gradient-radial">
      <Header />
      <section className="py-12 md:py-16">
        <div className="container-narrow animate-fade-up">
          <div className="mb-6">
            <Link href="/" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
              ← Back to help center
            </Link>
          </div>

          <form action="/search" method="GET" className="mb-10">
            <div className="flex items-center gap-2 bg-white shadow-hero border border-gray-100 hover:border-primary/30 focus-within:border-primary/50 rounded-2xl p-2 transition">
              <div className="pl-3 text-ink-faint">
                <SearchIcon />
              </div>
              <input
                name="q"
                type="search"
                defaultValue={query}
                placeholder='Try "how do I post a task"'
                className="flex-1 bg-transparent px-2 py-3 text-base outline-none placeholder:text-ink-faint"
              />
              <button type="submit" className="bg-gradient-primary text-white text-sm font-medium px-5 py-3 rounded-xl hover:opacity-95 transition">Search</button>
            </div>
          </form>

          {!query ? (
            <EmptySearch />
          ) : results.length === 0 ? (
            <NoResults query={query} />
          ) : (
            <ResultsList results={results} query={query} />
          )}
        </div>
      </section>
      <Trending />
      <Footer />
    </div>
  );
}

function ResultsList({ results, query }: { results: any[]; query: string }) {
  return (
    <div>
      <p className="text-sm text-ink-muted mb-5">
        {results.length} result{results.length !== 1 ? "s" : ""} for <span className="text-ink font-medium">&quot;{query}&quot;</span>
      </p>
      <div className="space-y-3">
        {results.map((a) => {
          const cleanTags = (a.tags || []).filter((t: string) => !HIDDEN_TAGS.has(t.toLowerCase()));
          return (
            <Link
              key={a.id}
              href={`/article/${a.id}`}
              className="group block bg-white border border-gray-100 hover:border-primary/30 rounded-2xl p-6 shadow-card hover:shadow-card-hover transition"
            >
              <h3 className="font-semibold text-ink text-lg mb-2 group-hover:text-primary transition">{a.title || "(untitled)"}</h3>
              <p className="text-sm text-ink-muted leading-relaxed mb-3 line-clamp-2">{highlightExcerpt(a.content, query)}</p>
              <div className="flex items-center gap-1.5 flex-wrap">
                {cleanTags.slice(0, 3).map((t: string) => (
                  <span key={t} className="text-[11px] px-2 py-0.5 bg-gray-50 border border-gray-100 rounded-md text-ink-muted">{humanize(t)}</span>
                ))}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function NoResults({ query }: { query: string }) {
  return (
    <div className="text-center py-16 bg-white border border-gray-100 rounded-3xl">
      <h2 className="text-xl font-bold text-ink mb-2">No results for &quot;{query}&quot;</h2>
      <p className="text-ink-muted mb-6 max-w-md mx-auto">Try different keywords, or ask Jinni directly — she might know.</p>
      <button type="button" className="inline-flex items-center gap-2 bg-gradient-primary text-white text-sm font-medium px-6 py-3 rounded-xl hover:opacity-95 transition">
        <span>Ask Jinni</span>
        <span className="text-white/90">→</span>
      </button>
    </div>
  );
}

function EmptySearch() {
  return (
    <div className="text-center py-10">
      <p className="text-ink-muted">Type a question above to search.</p>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
