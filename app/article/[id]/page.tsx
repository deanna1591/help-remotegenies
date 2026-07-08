import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getArticleById, getPublishedArticles } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const HIDDEN_TAGS = new Set(["client", "genie", "internal"]);

function preview(md: string, maxChars = 140): string {
  const stripped = md
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[#*_>`~\[\]()!-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return stripped.length > maxChars ? stripped.slice(0, maxChars) + "..." : stripped;
}

function humanize(tag: string): string {
  return tag.split(/[-_]/).map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
}

export default async function ArticlePage({ params }: { params: { id: string } }) {
  const article = await getArticleById(params.id);
  if (!article) notFound();

  const all = await getPublishedArticles();
  const articleTags = new Set((article.tags || []).map((t) => t.toLowerCase()));
  const related = all
    .filter((a) => a.id !== article.id)
    .map((a) => ({
      article: a,
      overlap: (a.tags || []).filter((t) => articleTags.has(t.toLowerCase())).length,
    }))
    .filter((x) => x.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, 3)
    .map((x) => x.article);

  const cleanTags = (article.tags || []).filter((t) => !HIDDEN_TAGS.has(t.toLowerCase()));

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

          <article className="bg-white border border-gray-100 rounded-3xl p-8 md:p-12 shadow-hero">
            <header className="mb-8 pb-8 border-b border-gray-100">
              <h1 className="text-3xl md:text-4xl font-bold text-ink tracking-tight mb-4">{article.title || "(untitled)"}</h1>
              <div className="flex items-center gap-3 text-sm text-ink-faint">
                <span>Updated {new Date(article.freshness_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                {cleanTags.length > 0 && (
                  <>
                    <span>·</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {cleanTags.slice(0, 4).map((t) => (
                        <Link key={t} href={`/category/${t.toLowerCase()}`} className="text-xs px-2 py-0.5 bg-primary-soft text-primary rounded-md hover:opacity-80 transition">{humanize(t)}</Link>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </header>

            <div className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-ink prose-headings:tracking-tight prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-3 prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-2 prose-p:text-ink prose-p:leading-relaxed prose-a:text-primary prose-a:font-medium hover:prose-a:opacity-80 prose-strong:text-ink prose-strong:font-semibold prose-code:bg-gray-50 prose-code:text-ink prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none prose-blockquote:border-l-primary prose-blockquote:bg-primary-soft/30 prose-blockquote:not-italic prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:text-ink prose-table:text-sm prose-th:bg-gray-50 prose-th:font-semibold prose-th:px-4 prose-th:py-2 prose-th:border prose-th:border-gray-200 prose-td:px-4 prose-td:py-2 prose-td:border prose-td:border-gray-100 prose-ul:my-3 prose-ol:my-3 prose-li:my-0.5 prose-img:rounded-xl">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  a: ({ href, children, ...rest }) => {
                    const url = href || "";
                    const isExternal = url.startsWith("http") || url.startsWith("mailto:");
                    return (
                      
                        href={url}
                        target={isExternal ? "_blank" : undefined}
                        rel={isExternal ? "noopener noreferrer" : undefined}
                        className="inline-flex items-center gap-1.5 bg-gradient-primary text-white text-sm font-medium px-3.5 py-1.5 rounded-full hover:opacity-95 transition no-underline my-1"
                        {...rest}
                      >
                        <span>{children}</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-80">
                          <line x1="7" y1="17" x2="17" y2="7" />
                          <polyline points="7 7 17 7 17 17" />
                        </svg>
                      </a>
                    );
                  },
                }}
              >
                {article.content}
              </ReactMarkdown>
            </div>
          </article>

          {related.length > 0 && (
            <section className="mt-12">
              <h2 className="text-xl font-bold text-ink mb-5 tracking-tight">Related articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {related.map((r) => (
                  <Link
                    key={r.id}
                    href={`/article/${r.id}`}
                    className="group bg-white border border-gray-100 hover:border-primary/30 rounded-2xl p-5 shadow-card hover:shadow-card-hover transition"
                  >
                    <h3 className="font-semibold text-ink text-sm mb-2 group-hover:text-primary transition line-clamp-2">{r.title || "(untitled)"}</h3>
                    <p className="text-xs text-ink-muted line-clamp-2 leading-relaxed">{preview(r.content, 100)}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </section>
      <Trending />
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="container-wide flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="RemoteGenies" width={32} height={32} className="rounded-md" />
          <span className="font-semibold text-ink">
            RemoteGenies <span className="text-ink-muted font-normal">Help Center</span>
          </span>
        </Link>
        <nav className="flex items-center gap-3">
          <a href="https://app.remotegenies.com" className="text-sm text-ink-muted hover:text-ink transition">Go to app</a>
          <a href="https://app.remotegenies.com/login" className="text-sm font-medium bg-white border border-gray-200 hover:border-primary hover:text-primary text-ink px-4 py-2 rounded-xl transition">Log in</a>
        </nav>
      </div>
    </header>
  );
}

function Trending() {
  return (
    <section className="py-16">
      <div className="container-wide">
        <div className="bg-surface-wash border border-primary/10 rounded-3xl p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-ink mb-2 tracking-tight">Still stuck?</h2>
          <p className="text-ink-muted mb-6 max-w-md mx-auto">Ask Jinni — she's available 24/7 and gives sourced answers.</p>
          <button type="button" className="inline-flex items-center gap-2 bg-gradient-primary text-white text-sm font-medium px-6 py-3 rounded-xl hover:opacity-95 transition">
            <span>Chat with Jinni</span>
            <span className="text-white/90">→</span>
          </button>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-gray-100 py-10 mt-10">
      <div className="container-wide flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-ink-muted">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="RemoteGenies" width={20} height={20} className="rounded" />
          <span>© {new Date().getFullYear()} RemoteGenies</span>
        </div>
        <nav className="flex items-center gap-6">
          <a href="https://remotegenies.com" className="hover:text-ink transition">Home</a>
          <a href="https://app.remotegenies.com" className="hover:text-ink transition">Platform</a>
          <a href="mailto:support@remotegenies.com" className="hover:text-ink transition">Contact</a>
        </nav>
      </div>
    </footer>
  );
}
