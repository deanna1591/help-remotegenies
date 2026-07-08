import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getPublishedArticles } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Same friendly labels as home page — keep in sync
const CATEGORY_LABELS: Record<string, { name: string; description: string }> = {
  "getting-started": { name: "Getting Started", description: "New here? Start with the basics of hiring on RemoteGenies." },
  billing: { name: "Billing & Credits", description: "Plans, credit deductions, invoicing, and payments." },
  credits: { name: "Credits & Free Balance", description: "How credits work, deductions, and free credit rules." },
  plans: { name: "Plans & Subscriptions", description: "Pay-as-you-go, Advanced, and Top-Tier plans." },
  budget: { name: "Budgeting", description: "Set budgets, estimate costs, and manage spend." },
  tiers: { name: "Genie Tiers", description: "Entry, Advanced, and Top-Tier — what each means." },
  "genie-rates": { name: "Genie Rates", description: "Hourly rates by experience tier." },
  tasks: { name: "Tasks & Bidding", description: "Post tasks, review bids, and hire the right Genie." },
  "task-posting": { name: "Posting Tasks", description: "How to post a task and get quality bids." },
  disputes: { name: "Disputes & Refunds", description: "Raising a dispute after task completion." },
  refunds: { name: "Refunds", description: "How refunds work and when you qualify." },
  account: { name: "Account & Security", description: "Profile, password, and account settings." },
  payments: { name: "Payments", description: "How payments work on RemoteGenies." },
  invoicing: { name: "Invoicing", description: "Invoices and billing history." },
  calculator: { name: "Cost Calculator", description: "Estimate what a task will cost." },
};

function slugToId(slug: string): string {
  return slug.toLowerCase();
}

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

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const slug = slugToId(params.slug);
  const articles = await getPublishedArticles();
  const matching = articles.filter((a) => (a.tags || []).some((t) => t.toLowerCase() === slug));
  if (matching.length === 0) notFound();

  const meta = CATEGORY_LABELS[slug] ?? { name: humanize(slug), description: `${matching.length} article${matching.length !== 1 ? "s" : ""} in this topic.` };

  return (
    <div className="min-h-screen bg-gradient-radial">
      <Header />
     <section className="py-8 sm:py-12 md:py-20">
        <div className="container-narrow animate-fade-up">
          <div className="mb-8">
            <Link href="/" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
              ← Back to all topics
            </Link>
          </div>
          <div className="mb-10">
            <div className="w-16 h-1.5 bg-gradient-primary rounded-full mb-5" />
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-ink tracking-tight mb-3">{meta.name}</h1>
            <p className="text-lg text-ink-muted">{meta.description}</p>
            <p className="text-sm text-ink-faint mt-2">{matching.length} article{matching.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="space-y-3">
            {matching.map((a) => (
              <Link
                key={a.id}
                href={`/article/${a.id}`}
                className="group block bg-white border border-gray-100 hover:border-primary/30 rounded-2xl p-6 shadow-card hover:shadow-card-hover transition"
              >
                <h3 className="font-semibold text-ink text-lg mb-2 group-hover:text-primary transition">{a.title || "(untitled)"}</h3>
                <p className="text-sm text-ink-muted leading-relaxed mb-3 line-clamp-2">{preview(a.content)}</p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(a.tags || []).filter((t) => !["client", "genie", "internal"].includes(t.toLowerCase())).slice(0, 3).map((t) => (
                    <span key={t} className="text-[11px] px-2 py-0.5 bg-gray-50 border border-gray-100 rounded-md text-ink-muted">{t}</span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
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
          <h2 className="text-2xl md:text-3xl font-bold text-ink mb-2 tracking-tight">Can&apos;t find what you need?</h2>
          <p className="text-ink-muted mb-6 max-w-md mx-auto">Ask Jinni directly — she&apos;s available 24/7 and gives sourced answers.</p>
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
