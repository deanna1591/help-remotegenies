import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import OpenAI from "openai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_JINNI_SUPABASE_URL!,
  process.env.JINNI_SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { persistSession: false },
    realtime: { transport: ws as any },
  }
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function embed(text: string): Promise<number[]> {
  const res = await openai.embeddings.create({
    model: "text-embedding-3-large",
    input: text.slice(0, 8000),
    dimensions: 1024,
  });
  return res.data[0].embedding;
}

const SEED = [
  {
    concept: "home marketing site",
    url: "https://www.remotegenies.com",
    title: "RemoteGenies — Hire Pre-Vetted Filipino Freelancers",
    description: "The main marketing homepage. Overview of what RemoteGenies does, testimonials, top-level intro to hiring Genies.",
    audiences: ["client", "genie"],
  },
  {
    concept: "pricing plans",
    url: "https://www.remotegenies.com/pricing",
    title: "Pricing — RemoteGenies",
    description: "Plan details, credit pricing, subscription tiers. Pay-As-You-Go, Advanced, Top-Tier plan options with rates. Includes reference to 20 dollar free credits for new clients.",
    audiences: ["client"],
  },
  {
    concept: "how it works",
    url: "https://www.remotegenies.com/how-it-works",
    title: "How It Works — RemoteGenies",
    description: "Explains the platform flow: describe your project, get matched with Genies, hire and work with a dedicated coordinator, payment held in escrow. High-level product tour.",
    audiences: ["client", "genie"],
  },
  {
    concept: "about the company",
    url: "https://www.remotegenies.com/about",
    title: "About — RemoteGenies",
    description: "Company mission, story, values. Filipino talent focus, education sponsorship for every 200 hours worked.",
    audiences: ["client", "genie"],
  },
  {
    concept: "general FAQ",
    url: "https://www.remotegenies.com/faq-general",
    title: "FAQ General — RemoteGenies",
    description: "Frequently asked questions covering general topics for both clients and Genies. Overview of common questions about the platform.",
    audiences: ["client", "genie"],
  },
  {
    concept: "FAQ for clients",
    url: "https://www.remotegenies.com/faq-client",
    title: "FAQ for Clients — RemoteGenies",
    description: "Frequently asked questions specifically for clients hiring on RemoteGenies. Billing, credits, tasks, Genies, disputes.",
    audiences: ["client"],
  },
  {
    concept: "FAQ for Genies freelancers",
    url: "https://www.remotegenies.com/faq-genies",
    title: "FAQ for Genies — RemoteGenies",
    description: "Frequently asked questions for freelancers, called Genies — registration, vetting process, payments, task invitations, payout process.",
    audiences: ["genie"],
  },
  {
    concept: "legal terms privacy user agreement",
    url: "https://www.remotegenies.com/legal",
    title: "Legal — RemoteGenies",
    description: "Terms of Service, Privacy Policy, User Agreement, Acceptable Use Policy, and all legal documents governing use of RemoteGenies.",
    audiences: ["client", "genie"],
  },
  {
    concept: "sign in login existing user",
    url: "https://app.remotegenies.com/sign-in",
    title: "Sign In — RemoteGenies",
    description: "Login page for existing clients and Genies. Same URL for both user types — the app determines which type based on account.",
    audiences: ["client", "genie"],
  },
  {
    concept: "register sign up create account as client",
    url: "https://app.remotegenies.com/register?member_type=client",
    title: "Register as Client — RemoteGenies",
    description: "Client signup page. Create a client account to start hiring Genies. New clients receive 20 dollars in free credits on registration.",
    audiences: ["client"],
  },
  {
    concept: "apply register as genie freelancer",
    url: "https://app.remotegenies.com/register?member_type=genie",
    title: "Apply as Genie — RemoteGenies",
    description: "Genie application. Filipino freelancers apply here. Includes profile creation, skill assessment, internal review — typically 3-5 business days.",
    audiences: ["genie"],
  },
  {
    concept: "dashboard home logged in",
    url: "https://app.remotegenies.com/",
    title: "Dashboard — RemoteGenies",
    description: "Personal dashboard for logged-in users. Same URL for both clients and Genies — the app adapts based on account type. Clients see their tasks and credit balance, Genies see invitations and wallet.",
    audiences: ["client", "genie"],
  },
  {
    concept: "post a new task create task add task",
    url: "https://app.remotegenies.com/",
    title: "Post a Task — Client Dashboard",
    description: "To post a task, log in and click the Add Task button on your dashboard — it opens as a pop-up form. Once posted, you can view your tasks at the tasks list URL.",
    audiences: ["client"],
  },
  {
    concept: "my tasks task list view all tasks",
    url: "https://app.remotegenies.com/task",
    title: "My Tasks — RemoteGenies",
    description: "View your list of posted tasks and their statuses: Open for Bids, Draft, In Progress, Review, Completed, Disputed. Manage each task, view bids, review Genies, track progress.",
    audiences: ["client"],
  },
  {
    concept: "help center knowledge base support",
    url: "https://help.remotegenies.co",
    title: "Help Center — RemoteGenies",
    description: "Customer-facing help center with articles about pricing, tasks, disputes, payments, and all client-side operations. Also includes the Jinni chat widget for 24 by 7 assistance.",
    audiences: ["client", "genie"],
  },
  {
    concept: "contact support email",
    url: "mailto:info@remotegenies.com",
    title: "Contact Support",
    description: "Contact RemoteGenies support team via email. Use this for anything Jinni cannot answer, dispute escalation, or account issues.",
    audiences: ["client", "genie"],
  },
];

async function main() {
  console.log("Seeding URL registry with", SEED.length, "entries...\n");

  for (const [i, item] of SEED.entries()) {
    console.log(`[${i + 1}/${SEED.length}] ${item.concept}`);
    const embedText = `${item.concept} ${item.title || ""} ${item.description || ""}`;

    try {
      const embedding = await embed(embedText);

      const { data, error } = await supabase
        .from("url_registry")
        .upsert(
          {
            concept: item.concept,
            url: item.url,
            title: item.title,
            description: item.description,
            audiences: item.audiences,
            source: "manual",
            is_active: true,
            needs_verification: false,
            embedding,
          },
          { onConflict: "url" }
        )
        .select("id")
        .single();

      if (error) {
        console.error(`   ERROR: ${error.message}`);
      } else {
        console.log(`   -> ${data?.id}`);
      }
    } catch (e) {
      console.error(`   FAILED: ${(e as Error).message}`);
    }
  }

  const { count } = await supabase.from("url_registry").select("*", { count: "exact", head: true });
  console.log(`\nDone. url_registry now has ${count} rows.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
