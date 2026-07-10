"use client";

type Props = {
  label?: string;
  className?: string;
};

export default function AskJinniButton({ 
  label = "Chat with Jinni", 
  className = "inline-flex items-center gap-2 bg-gradient-primary text-white text-sm font-medium px-6 py-3 rounded-xl hover:opacity-95 transition"
}: Props) {
  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("jinni:open"));
        }
      }}
      className={className}
    >
      <span>{label}</span>
      <span className="text-white/90">→</span>
    </button>
  );
}