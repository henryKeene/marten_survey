interface SectionBannerProps {
  emoji: string;
  callout: string;
  body: string;
  /** Soft accent class for the banner's background tint. */
  tint?: "amber" | "forest" | "stone";
}

/**
 * Visual rhythm break between sections. Lives at the top of certain pages
 * to signal that the *interaction style* is changing — not a fact card,
 * but a small "now we're doing something different" moment.
 */
export function SectionBanner({ emoji, callout, body, tint = "forest" }: SectionBannerProps) {
  const tintClass =
    tint === "amber"
      ? "from-amber/20 to-stone-50 border-amber/30"
      : tint === "stone"
        ? "from-stone-100 to-stone-50 border-stone-200"
        : "from-forest-100 to-stone-50 border-forest-200";

  return (
    <aside
      className={`flex items-start gap-4 rounded-2xl border bg-gradient-to-br ${tintClass} p-5 shadow-sm`}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-3xl shadow-sm">
        <span aria-hidden="true">{emoji}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-wider text-forest-700">
          {callout}
        </p>
        <p className="mt-1 text-sm leading-snug text-stone-800">{body}</p>
      </div>
    </aside>
  );
}
