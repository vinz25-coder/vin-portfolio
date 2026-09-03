import { MessageCircle, Star, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useState } from "react";
import { Link } from "react-router-dom";

import {
  loadGuestbook,
  type GuestbookEntry,
  type GuestbookFilter,
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

export function FloatingChatWidget() {
  const { copy } = useLanguage();
  const panelId = useId();
  const titleId = `${panelId}-title`;
  const [isMobileViewport, setIsMobileViewport] = useState(getIsMobileViewport);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] =
    useState<Exclude<GuestbookFilter, "all">>("discussions");
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
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
        setState("idle");
      })
      .catch(() => {
        if (active) setState("error");
      });
    return () => {
      active = false;
    };
  }, [filter, isOpen]);

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
            className="floating-chat-panel chat-widget-panel fixed inset-x-2 flex w-auto origin-bottom-right flex-col overflow-hidden rounded-2xl border text-text-primary shadow-[0_1.5rem_4rem_color-mix(in_srgb,var(--color-accent-500)_18%,transparent)] min-[320px]:inset-x-3 sm:absolute sm:inset-x-auto sm:right-0"
          >
            <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3.5">
              <div>
                <p className="text-[0.625rem] font-bold tracking-[0.18em] text-accent-500 uppercase">
                  {copy.chat.guestbook}
                </p>
                <h2
                  id={titleId}
                  className="mt-0.5 font-display text-base font-semibold"
                >
                  {copy.chat.title}
                </h2>
              </div>
              <button
                type="button"
                aria-label={copy.chat.closeLabel}
                className="flex size-10 items-center justify-center rounded-xl border border-border text-text-secondary hover:border-accent-500 hover:text-accent-500 focus-visible:outline-2 focus-visible:outline-accent-500"
                onClick={() => setIsOpen(false)}
              >
                <X aria-hidden="true" size={19} />
              </button>
            </header>

            <div
              className="grid grid-cols-2 border-b border-border"
              role="tablist"
            >
              {(["discussions", "reviews"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={filter === value}
                  className="guestbook-preview-tab min-h-11 px-3 text-xs font-semibold"
                  onClick={() => setFilter(value)}
                >
                  {copy.chat[value]}
                </button>
              ))}
            </div>

            <div className="floating-chat-panel-body min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-2">
              {state === "loading" ? (
                <p className="py-8 text-center text-xs text-text-secondary">
                  {copy.chat.loading}
                </p>
              ) : state === "error" ? (
                <p
                  role="alert"
                  className="py-8 text-center text-xs text-text-secondary"
                >
                  {copy.chat.error}
                </p>
              ) : entries.length ? (
                <div>
                  {entries.map((entry) => (
                    <article
                      key={entry.id}
                      className="border-b border-border py-3 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        {entry.author.avatar_url ? (
                          <img
                            src={entry.author.avatar_url}
                            alt=""
                            className="size-7 rounded-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span
                            aria-hidden="true"
                            className="flex size-7 items-center justify-center rounded-full bg-accent-500/15 text-xs font-bold text-accent-500"
                          >
                            {entry.author.display_name.charAt(0)}
                          </span>
                        )}
                        <h3 className="truncate text-xs font-semibold">
                          {entry.author.display_name}
                        </h3>
                        {entry.rating ? (
                          <span
                            className="ml-auto flex items-center gap-1 text-xs text-accent-500"
                            aria-label={`${entry.rating} stars`}
                          >
                            <Star
                              aria-hidden="true"
                              size={12}
                              className="fill-current"
                            />
                            {entry.rating}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-text-secondary">
                        {entry.is_deleted
                          ? copy.guestbook.feed.deleted
                          : entry.body}
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-xs text-text-secondary">
                  {filter === "discussions"
                    ? copy.chat.emptyDiscussions
                    : copy.chat.emptyReviews}
                </p>
              )}
            </div>

            <div className="border-t border-border p-3">
              <Link
                to="/guestbook"
                className="flex min-h-11 items-center justify-center rounded-xl bg-accent-500 px-4 text-sm font-bold text-accent-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
                onClick={() => setIsOpen(false)}
              >
                {copy.chat.openGuestbook}
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
