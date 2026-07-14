import Link from "next/link";
import Image from "next/image";
import { getPublishedArticles, groupIntoCategories } from "@/lib/supabase";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Trending from "@/components/Trending";

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

export default async function HomePage({ searchParams }: { searchParams: { ticket?: string } }) {
  const articles = await getPublishedArticles();
  const HIDDEN_CATEGORY_TAGS = new Set(["client", "genie", "internal"]);
  const allCategories = groupIntoCategories(articles).filter(
    (c) => !HIDDEN_CATEGORY_TAGS.has(c.tag.toLowerCase())
  );
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
      {searchParams?.ticket === "success" && (
        <div className="container-wide pt-4">
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-2xl px-5 py-4 text-sm">
            ✓ Thanks! Your ticket has been submitted. Our team will get back to you as soon as possible.
          </div>
        </div>
      )}
      <Hero />
      <Categories categories={displayCategories} totalArticles={articles.length} />
      <Trending />
      <Footer />
    </div>
  );
}

function Hero() {
  return (
    <section className="py-12 sm:py-20 md:py-28">
      <div className="container-narrow text-center animate-fade-up">
        <div className="inline-flex items-center gap-2 bg-primary-soft border border-primary/10 text-primary text-xs font-medium px-3 py-1.5 rounded-full mb-6 max-w-[90%] mx-auto text-center leading-snug">
          <span className="w-1.5 h-1.5 bg-primary rounded-full" />
          Jinni has your back, day or night. Ask anything about RemoteGenies
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-ink mb-3 sm:mb-4 tracking-tight">How can we help?<span className="inline-block animate-wave origin-[70%_80%] ml-2">👋🏼</span></h1>
        <p className="text-base sm:text-lg text-ink-muted mb-10 max-w-2xl mx-auto">Learn how to delegate tasks, cut costs by up to 70%, and focus on growing your business — or how to thrive as a Genie on RemoteGenies.</p>
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
              <Link key={q} href={`/search?q=${encodeURIComponent(q)}`} className="px-3 py-1 rounded-full bg-primary-soft border border-primary/10 text-primary hover:bg-primary hover:text-white transition">{q}</Link>
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
            <Link key={cat.slug} href={`/category/${encodeURIComponent(cat.slug.toLowerCase().replace(/\s+/g, "-"))}`} className="group bg-white border border-gray-100 hover:border-primary/30 rounded-2xl p-6 shadow-card hover:shadow-card-hover transition">
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

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}