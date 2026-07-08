import Link from "next/link";
import Image from "next/image";
import { getPublishedArticles, groupIntoCategories } from "@/lib/supabase";

export const dynamic = "force-dynamic";

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
  "getting-started-clients": { name: "Getting Started (Clients)", description: "First steps for clients." },
  payments: { name: "Payments", description: "How payments work on RemoteGenies." },
  invoicing: { name: "Invoicing", description: "Invoices and billing history." },
  calculator: { name: "Cost Calculator", description: "Estimate what a task will cost." },
};

const TRENDING_QUERIES = [
  "How do I post a task?",
  "How do the tiers work?",
  "How to invite a Genie",
  "How free credits work",
];

export default async function HomePage() {
  const articles = await getPublishedArticles();
  const HIDDEN_CATEGORY_TAGS = new Set(["client", "genie", "internal"]);
  const allCategories = groupIntoCategories(articles).filter(
    (c) => !HIDDEN_CATEGORY_TAGS.has(c.tag.toLowerCase())
  );

  // Take the top 6 categories that have labels defined, else use tag itself
  const displayCategories = allCategories.slice(0, 6).map(({ tag, count }) => {
    const meta = CATEGORY_LABELS[tag] ?? {
      name: tag.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" "),
      description: `${count} article${count !== 1 ? "s" : ""} in this topic.`,
    };
    return { slug: tag, name: meta.name, description: meta.description, count };
  });

  return (
    <div className="min-h-screen bg-gradient-radial">
      <Header />
      <Hero />
      <Categories categories={displayCategories} totalArticles={articles.length} />
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

function Hero() {
  return (
   <section className="py-12 sm:py-20 md:py-28">
      <div className="container-narrow text-center animate-fade-up">
        <div className="inline-flex items-center gap-2 bg-primary-soft border border-primary/10 text-primary text-xs font-medium px-3 py-1 rounded-full mb-6">
          <span className="w-1.5 h-1.5 bg-primary rounded-full" />
          24/7 answers from Jinni, our AI assistant
        </div>
       <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-ink mb-3 sm:mb-4 tracking-tight">How can we help?</h1>
        <p className="text-lg text-ink-muted mb-10 max-w-xl mx-auto">Search the knowledge base or ask Jinni directly. Answers grounded in the platform, not guesswork.</p>
        <form action="/search" method="GET" className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 bg-white shadow-hero border border-gray-100 hover:border-primary/30 focus-within:border-primary/50 rounded-2xl p-2 transition">
            <div className="pl-3 text-ink-faint">
              <SearchIcon />
            </div>
            <input name="q" type="search" placeholder='Try "how do I post a task"' className="flex-1 bg-transparent px-2 py-3 text-base outline-none placeholder:text-ink-faint" />
            <button type="submit" className="bg-gradient-primary text-white text-sm font-medium px-5 py-3 rounded-xl hover:opacity-95 transition">Search</button>
          </div>
          <div className="flex items-center justify-center flex-wrap gap-2 mt-4 text-xs text-ink-muted">
            <span>Popular:</span>
            {TRENDING_QUERIES.map((q) => (
              <Link key={q} href={`/search?q=${encodeURIComponent(q)}`} className="hover:text-primary transition underline decoration-transparent hover:decoration-current">{q}</Link>
            ))}
          </div>
        </form>
      </div>
    </section>
  );
}

function Categories({ categories, totalArticles }: { categories: { slug: string; name: string; description: string; count: number }[]; totalArticles: number }) {
  if (categories.length === 0) {
    return (
      <section className="py-12">
        <div className="container-wide text-center py-10">
          <h2 className="text-2xl font-bold text-ink mb-2 tracking-tight">Knowledge base is being built</h2>
          <p className="text-ink-muted">Articles will appear here soon. In the meantime, chat with Jinni above.</p>
        </div>
      </section>
    );
  }
  return (
    <section className="py-12">
      <div className="container-wide">
        <div className="flex items-baseline justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-ink tracking-tight">Browse by topic</h2>
            <p className="text-sm text-ink-muted mt-1">{totalArticles} article{totalArticles !== 1 ? "s" : ""} across all topics</p>
          </div>
          <Link href="/categories" className="text-sm text-primary font-medium hover:underline">View all →</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <Link key={cat.slug} href={`/category/${cat.slug}`} className="group bg-white border border-gray-100 hover:border-primary/30 rounded-2xl p-6 shadow-card hover:shadow-card-hover transition">
              <div className="w-10 h-1 bg-gradient-primary rounded-full mb-4" />
              <h3 className="font-semibold text-ink text-lg mb-1 group-hover:text-primary transition">{cat.name}</h3>
              <p className="text-sm text-ink-muted mb-4 leading-relaxed">{cat.description}</p>
              <span className="text-xs text-ink-faint">{cat.count} article{cat.count !== 1 ? "s" : ""}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function Trending() {
  return (
    <section className="py-16">
      <div className="container-wide">
        <div className="bg-surface-wash border border-primary/10 rounded-3xl p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-ink mb-2 tracking-tight">Can&apos;t find what you need?</h2>
          <p className="text-ink-muted mb-6 max-w-md mx-auto">Ask Jinni directly — she&apos;s available 24/7 and gives sourced answers. If she can&apos;t help, we&apos;ll connect you with a human.</p>
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

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
