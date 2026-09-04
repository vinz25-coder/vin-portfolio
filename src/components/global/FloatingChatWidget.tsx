import { ArrowUpRight, MessageCircle, Star, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import {
  loadGuestbook,
  type GuestbookEntry,
  type GuestbookFilter,
  type RatingSummary,
} from "../../data/guestbook";
import { useLanguage } from "../../hooks/useLanguage";
import { mobileViewportQuery } from "../../lib/media-queries";
import { chatWidgetMotion } from "../../motion/constants";

function getIsMobileViewport() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia(mobileViewportQuery).matches
  );
}

const emptyRating: RatingSummary = {
  average_rating: 0,
  total_reviews: 0,
  distribution: {},
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function formatRelativeTime(value: string, language: "en" | "id") {
  const elapsedSeconds = Math.max(
    1,
    Math.round((Date.now() - new Date(value).getTime()) / 1000),
  );
  const units = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ] as const;
  const [unit, seconds] =
    units.find(([, threshold]) => elapsedSeconds >= threshold) ??
    (["second", 1] as const);

  return new Intl.RelativeTimeFormat(language, { numeric: "auto" }).format(
    -Math.floor(elapsedSeconds / seconds),
    unit,
  );
}

export function FloatingChatWidget() {
  const { copy, language } = useLanguage();
  const { pathname } = useLocation();
  const panelId = useId();
  const titleId = `${panelId}-title`;
  const [isMobileViewport, setIsMobileViewport] = useState(getIsMobileViewport);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] =
    useState<Exclude<GuestbookFilter, "all">>("discussions");
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [rating, setRating] = useState<RatingSummary>(emptyRating);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const query = window.matchMedia(mobileViewportQuery);
    const update = () => setIsMobileViewport(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (pathname === "/guestbook") setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setState("loading");
    void loadGuestbook(filter, "newest", 3)
      .then((data) => {
        if (!active) return;
        setEntries(data.entries);
        setRating(data.rating);
        setState("idle");
      })
      .catch(() => {
        if (active) setState("error");
      });
    return () => {
      active = false;
    };
  }, [filter, isOpen]);

  if (pathname === "/guestbook") return null;

  return (
    <div className="floating-chat-root fixed right-3 bottom-3 z-[70] min-[320px]:right-5 sm:right-6 sm:bottom-6">
      <AnimatePresence>
        {isOpen ? (
          <motion.section
            id={panelId}
            role="dialog"
            aria-modal={isMobileViewport ? "true" : undefined}
            aria-labelledby={titleId}
            initial={{ opacity: 0, scale: chatWidgetMotion.closedScale }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: chatWidgetMotion.closedScale }}
            transition={{
              type: "spring",
              stiffness: chatWidgetMotion.stiffness,
              damping: chatWidgetMotion.damping,
            }}
            className="floating-chat-panel chat-widget-panel fixed inset-x-2 flex w-auto origin-bottom-right flex-col overflow-hidden rounded-2xl border text-text-primary shadow-[0_1.25rem_3rem_color-mix(in_srgb,var(--color-accent-500)_18%,transparent)] min-[320px]:inset-x-3 sm:absolute sm:inset-x-auto sm:right-0"
          >
            <header className="flex items-start justify-between gap-3 px-5 pt-5 pb-3.5">
              <div>
                <p className="text-[0.625rem] font-bold tracking-[0.16em] text-accent-500 uppercase">
                  {copy.chat.guestbook}
                </p>
                <h2
                  id={titleId}
                  className="mt-1.5 font-display text-lg font-bold tracking-[-0.025em] sm:text-xl"
                >
                  {copy.chat.title}
                </h2>
              </div>
              <button
                type="button"
                aria-label={copy.chat.closeLabel}
                className="-mt-1 -mr-1 flex size-9 items-center justify-center rounded-full text-text-secondary hover:text-accent-500 focus-visible:outline-2 focus-visible:outline-accent-500"
                onClick={() => setIsOpen(false)}
              >
                <X aria-hidden="true" size={19} />
              </button>
            </header>

            <div
              className="grid grid-cols-2 border-b border-border px-5"
              role="tablist"
            >
              {(["discussions", "reviews"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={filter === value}
                  className="guestbook-preview-tab min-h-12 px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent-500"
                  onClick={() => setFilter(value)}
                >
                  {copy.chat[value]}
                </button>
              ))}
            </div>

            <div className="floating-chat-panel-body min-h-0 flex-1 overflow-y-auto overscroll-contain">
              {state === "loading" ? (
                <p className="px-6 py-12 text-center text-sm text-text-secondary">
                  {copy.chat.loading}
                </p>
              ) : state === "error" ? (
                <p
                  role="alert"
                  className="px-6 py-12 text-center text-sm text-text-secondary"
                >
                  {copy.chat.error}
                </p>
              ) : entries.length ? (
                <div>
                  {filter === "reviews" ? (
                    <div className="guestbook-preview-rating flex items-center gap-3 border-b border-border px-5 py-4">
                      <strong className="font-display text-3xl leading-none font-bold tracking-[-0.04em]">
                        {Number(rating.average_rating).toFixed(1)}
                      </strong>
                      <div>
                        <div
                          className="flex gap-0.5 text-accent-500"
                          aria-label={`${Number(rating.average_rating).toFixed(1)} stars`}
                        >
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              aria-hidden="true"
                              size={14}
                              className={
                                star <= Math.round(rating.average_rating)
                                  ? "fill-current"
                                  : "text-text-secondary/35"
                              }
                            />
                          ))}
                        </div>
                        <p className="mt-1 text-xs text-text-secondary">
                          {rating.total_reviews} {copy.guestbook.rating.reviews}
                        </p>
                      </div>
                    </div>
                  ) : null}
                  {entries.map((entry) => (
                    <article
                      key={entry.id}
                      className="guestbook-preview-entry border-b border-border px-5 py-4 last:border-0"
                    >
                      <div className="flex gap-3">
                        {entry.author.avatar_url ? (
                          <img
                            src={entry.author.avatar_url}
                            alt=""
                            className="size-9 shrink-0 rounded-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span
                            aria-hidden="true"
                            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-500 text-[0.625rem] font-bold text-accent-ink"
                          >
                            {getInitials(entry.author.display_name)}
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start gap-2">
                            <h3 className="min-w-0 flex-1 truncate font-display text-sm font-semibold">
                              {entry.author.display_name}
                            </h3>
                            {entry.rating ? (
                              <span
                                className="flex shrink-0 gap-px text-accent-500"
                                aria-label={`${entry.rating} stars`}
                              >
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    aria-hidden="true"
                                    size={11}
                                    className={
                                      star <= entry.rating!
                                        ? "fill-current"
                                        : "text-text-secondary/35"
                                    }
                                  />
                                ))}
                              </span>
                            ) : (
                              <time
                                dateTime={entry.created_at}
                                className="shrink-0 text-xs text-text-secondary"
                              >
                                {formatRelativeTime(entry.created_at, language)}
                              </time>
                            )}
                          </div>
                          {entry.rating ? (
                            <time
                              dateTime={entry.created_at}
                              className="mt-0.5 block text-xs text-text-secondary"
                            >
                              {formatRelativeTime(entry.created_at, language)}
                            </time>
                          ) : null}
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-text-secondary">
                            {entry.is_deleted
                              ? copy.guestbook.feed.deleted
                              : entry.body}
                          </p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div>
                  {filter === "reviews" ? (
                    <div className="guestbook-preview-rating flex items-center gap-3 border-b border-border px-5 py-4">
                      <strong className="font-display text-3xl leading-none font-bold tracking-[-0.04em]">
                        {Number(rating.average_rating).toFixed(1)}
                      </strong>
                      <div>
                        <div className="flex gap-0.5 text-text-secondary/35" aria-hidden="true">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} size={14} />
                          ))}
                        </div>
                        <p className="mt-1 text-xs text-text-secondary">
                          {rating.total_reviews} {copy.guestbook.rating.reviews}
                        </p>
                      </div>
                    </div>
                  ) : null}
                  <p className="px-5 py-8 text-center text-xs text-text-secondary">
                  {filter === "discussions"
                    ? copy.chat.emptyDiscussions
                    : copy.chat.emptyReviews}
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-border p-4">
              <Link
                to="/guestbook"
                className="guestbook-preview-cta flex min-h-12 items-center justify-center gap-2 rounded-xl bg-accent-500 px-4 text-sm font-bold text-accent-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
                onClick={() => setIsOpen(false)}
              >
                {copy.chat.openGuestbook}
                <ArrowUpRight aria-hidden="true" size={16} />
              </Link>
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>

      {!isMobileViewport ? (
        <motion.button
          type="button"
          aria-label={isOpen ? copy.chat.closeLabel : copy.chat.openLabel}
          aria-expanded={isOpen}
          aria-controls={panelId}
          initial={{ opacity: 0, x: chatWidgetMotion.controlOffset }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: chatWidgetMotion.hoverScale }}
          whileTap={{ scale: chatWidgetMotion.pressedScale }}
          transition={{
            duration: chatWidgetMotion.interactionDuration,
            ease: chatWidgetMotion.ease,
          }}
          className="floating-chat-trigger relative ml-auto flex size-14 items-center justify-center overflow-hidden rounded-full border border-[color-mix(in_srgb,var(--color-accent-500)_48%,transparent)] bg-[linear-gradient(135deg,var(--color-accent-500),var(--color-accent-700))] text-accent-ink shadow-[0_0.75rem_2.5rem_color-mix(in_srgb,var(--color-accent-500)_32%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-500 sm:size-16 lg:size-14"
          onClick={() => setIsOpen((value) => !value)}
        >
          <span
            aria-hidden="true"
            className="absolute inset-1 rounded-full border border-[color-mix(in_srgb,var(--color-accent-100)_28%,transparent)]"
          />
          <MessageCircle
            aria-hidden="true"
            size={24}
            strokeWidth={1.7}
            className="relative z-10 sm:size-7 lg:size-6"
          />
        </motion.button>
      ) : null}
    </div>
  );
}
