import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

import {
  emptyPortfolioReactionSummary,
  loadPortfolioReactions,
  togglePortfolioReaction,
  type PortfolioReactionSummary,
  type PortfolioReactionType,
} from "../../data/guestbook";
import { useLanguage } from "../../hooks/useLanguage";

const reactions: { type: PortfolioReactionType; emoji: string }[] = [
  { type: "thumbs_up", emoji: "👍" },
  { type: "heart", emoji: "❤️" },
  { type: "fire", emoji: "🔥" },
  { type: "clap", emoji: "👏" },
  { type: "rocket", emoji: "🚀" },
];

export function PortfolioReactionBar({
  session,
  onRequireSignIn,
}: {
  session: Session | null;
  onRequireSignIn: () => void;
}) {
  const { copy } = useLanguage();
  const reactionCopy = copy.guestbook.portfolioReactions;
  const [summary, setSummary] = useState<PortfolioReactionSummary>(
    emptyPortfolioReactionSummary,
  );
  const [pending, setPending] = useState<PortfolioReactionType | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void loadPortfolioReactions()
      .then((result) => {
        if (active) setSummary(result);
      })
      .catch(() => {
        if (active) setError(reactionCopy.failed);
      });
    return () => {
      active = false;
    };
  }, [reactionCopy.failed, session]);

  const toggle = async (reaction: PortfolioReactionType) => {
    if (!session) {
      onRequireSignIn();
      return;
    }
    if (pending) return;
    setPending(reaction);
    setError("");
    try {
      const result = await togglePortfolioReaction(reaction);
      setSummary((current) => ({
        counts: { ...current.counts, [reaction]: result.count },
        my_reactions: result.active
          ? [...current.my_reactions, reaction]
          : current.my_reactions.filter((item) => item !== reaction),
      }));
    } catch {
      setError(reactionCopy.failed);
    } finally {
      setPending(null);
    }
  };

  return (
    <section
      aria-labelledby="portfolio-reactions-heading"
      className="guestbook-portfolio-reactions mt-4 rounded-2xl border border-border px-5 py-4 sm:px-6"
    >
      <h2
        id="portfolio-reactions-heading"
        className="text-xs font-semibold tracking-[0.2em] text-text-secondary uppercase"
      >
        {reactionCopy.heading}
      </h2>
      <div className="guestbook-portfolio-reaction-scroll -mx-3 mt-1 overflow-x-auto px-3 py-3">
        <div className="flex w-max items-center gap-2 sm:gap-3">
          {reactions.map(({ type, emoji }) => {
            const active = summary.my_reactions.includes(type);
            return (
              <button
                key={type}
                type="button"
                aria-label={reactionCopy.labels[type]}
                aria-pressed={active}
                disabled={pending !== null}
                className="guestbook-portfolio-reaction flex min-h-10 min-w-[4rem] items-center justify-center gap-1.5 rounded-full border border-transparent px-2 text-lg"
                onClick={() => void toggle(type)}
              >
                <span aria-hidden="true">{emoji}</span>
                <span className="min-w-[1ch] text-left text-sm font-semibold text-text-primary tabular-nums">
                  {summary.counts[type]}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      {error ? (
        <p role="alert" className="mt-3 text-xs text-accent-600">
          {error}
        </p>
      ) : null}
    </section>
  );
}
