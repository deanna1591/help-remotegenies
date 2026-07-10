import Link from "next/link";
import Image from "next/image";
import { getPublishedArticles, groupIntoCategories } from "@/lib/supabase";
import AskJinniButton from "@/components/AskJinniButton";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

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

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
