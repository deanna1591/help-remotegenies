export type ScenarioOption = {
  label: string;
  action:
    | { type: "goto"; step: string }
    | { type: "handoff" }
    | { type: "ask"; text: string };
};

export type ScenarioStep = {
  id: string;
  bot: string; // markdown; links render as gradient pills
  options?: ScenarioOption[];
};

export const SCENARIO_START = "start";

export const SCENARIO: Record<string, ScenarioStep> = {
  start: {
    id: "start",
    bot: `Hi 👋 I'm Jinni! What brings you to RemoteGenies today?`,
    options: [
      { label: "I want to hire", action: { type: "goto", step: "hire" } },
      { label: "I'm a Genie (freelancer)", action: { type: "goto", step: "genie" } },
      { label: "Talk to an agent", action: { type: "handoff" } },
    ],
  },
  hire: {
    id: "hire",
    bot: `You're in the right place!

We help businesses hire pre-vetted Filipino freelancers \u2014 delegate tasks and cut costs by up to 70%.`,
    options: [
      { label: "📞 Book a 15-min call", action: { type: "goto", step: "book_call" } },
      { label: "How it works", action: { type: "goto", step: "how_it_works" } },
      { label: "Talk to an agent", action: { type: "handoff" } },
    ],
  },
  book_call: {
    id: "book_call",
    bot: `**Let's get your first task moving!**

[👉 Book a 15-min call](https://www.remotegenies.com/book-a-call)`,
    options: [
      { label: "How it works", action: { type: "goto", step: "how_it_works" } },
      { label: "Talk to an agent", action: { type: "handoff" } },
    ],
  },
  how_it_works: {
    id: "how_it_works",
    bot: `**It's simple:**

1. Post a task
2. Skilled Genies bid
3. You choose who to hire
4. A coordinator keeps everything on track`,
    options: [
      { label: "📞 Book a 15-min call", action: { type: "goto", step: "book_call" } },
      { label: "How do I post a task?", action: { type: "ask", text: "How do I post a task?" } },
      { label: "Talk to an agent", action: { type: "handoff" } },
    ],
  },
  genie: {
    id: "genie",
    bot: `Got it 👋 Are you already a registered Genie?`,
    options: [
      { label: "Yes, I have an account", action: { type: "goto", step: "genie_registered" } },
      { label: "Not yet", action: { type: "goto", step: "genie_apply" } },
    ],
  },
  genie_apply: {
    id: "genie_apply",
    bot: `Applications are reviewed before approval.

[👉 Start your Genie application](https://app.remotegenies.com/register?member_type=genie)`,
    options: [
      { label: "I have a question", action: { type: "goto", step: "genie_registered" } },
      { label: "Talk to an agent", action: { type: "handoff" } },
    ],
  },
  genie_registered: {
    id: "genie_registered",
    bot: `What do you need help with?`,
    options: [
      { label: "Finding tasks to bid on", action: { type: "ask", text: "How do I find tasks to bid on as a Genie?" } },
      { label: "Account or profile help", action: { type: "ask", text: "How do I manage my Genie account and profile?" } },
      { label: "Payments or payouts", action: { type: "ask", text: "How do Genie payments and payouts work?" } },
      { label: "Talk to an agent", action: { type: "handoff" } },
    ],
  },
};
