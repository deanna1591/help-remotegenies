import AskJinniButton from "./AskJinniButton";

export default function Trending() {
  return (
    <section className="py-16">
      <div className="container-wide">
        <div className="bg-surface-wash border border-primary/10 rounded-3xl p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-ink mb-2 tracking-tight">Can&apos;t find what you need?</h2>
          <p className="text-ink-muted mb-6 max-w-md mx-auto">Ask Jinni directly — she&apos;s available 24/7 and gives sourced answers. If she can&apos;t help, we&apos;ll connect you with a human.</p>
          <AskJinniButton />
        </div>
      </div>
    </section>
  );
}