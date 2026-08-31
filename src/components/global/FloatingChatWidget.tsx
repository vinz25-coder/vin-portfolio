import {
  LockKeyhole,
  LogIn,
  MessageCircle,
  MoreHorizontal,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useState } from "react";

import { useLanguage } from "../../hooks/useLanguage";
import { mobileViewportQuery } from "../../lib/media-queries";
import { chatWidgetMotion } from "../../motion/constants";

export const OPEN_MOBILE_GUESTBOOK_EVENT = "open-mobile-guestbook";

const headerButtonClassName =
  "flex size-10 shrink-0 items-center justify-center rounded-[0.75rem] border border-border bg-[color-mix(in_srgb,var(--color-surface)_32%,transparent)] text-text-secondary transition-colors duration-150 hover:border-accent-500 hover:text-accent-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500";

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
  const menuId = useId();
  const loginNoteId = useId();
  const titleId = `${panelId}-title`;
  const previewTitleId = `${panelId}-preview-title`;
  const replyId = `${panelId}-reply`;
  const [isOpen, setIsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(getIsMobileViewport);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      return undefined;
    }

    const mobileViewportMedia = window.matchMedia(mobileViewportQuery);
    const updateViewport = () => {
      setIsMobileViewport(mobileViewportMedia.matches);
    };

    updateViewport();
    mobileViewportMedia.addEventListener("change", updateViewport);

    return () => {
      mobileViewportMedia.removeEventListener("change", updateViewport);
    };
  }, []);

  useEffect(() => {
    const openFromMobileNavigation = () => {
      if (getIsMobileViewport()) {
        setIsMenuOpen(false);
        setIsOpen(true);
      }
    };

    window.addEventListener(
      OPEN_MOBILE_GUESTBOOK_EVENT,
      openFromMobileNavigation,
    );

    return () =>
      window.removeEventListener(
        OPEN_MOBILE_GUESTBOOK_EVENT,
        openFromMobileNavigation,
      );
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setIsMenuOpen(false);
      return undefined;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  const closePanel = () => {
    setIsMenuOpen(false);
    setIsOpen(false);
  };

  const togglePanel = () => {
    if (isOpen) {
      setIsMenuOpen(false);
    }

    setIsOpen((current) => !current);
  };

  return (
    <div className="floating-chat-root fixed right-3 bottom-3 z-[70] min-[320px]:right-5 sm:right-6 sm:bottom-6">
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            id={panelId}
            role="dialog"
            aria-labelledby={titleId}
            initial={{
              opacity: 0,
              scale: chatWidgetMotion.closedScale,
              transformOrigin: "bottom right",
            }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{
              opacity: 0,
              scale: chatWidgetMotion.closedScale,
            }}
            transition={{
              type: "spring",
              stiffness: chatWidgetMotion.stiffness,
              damping: chatWidgetMotion.damping,
            }}
            className="floating-chat-panel chat-widget-panel fixed inset-x-2 flex w-auto flex-col overflow-hidden rounded-[1rem] border text-text-primary shadow-[0_1.5rem_4rem_color-mix(in_srgb,var(--color-accent-500)_18%,transparent)] min-[320px]:inset-x-3 sm:absolute sm:inset-x-auto sm:right-0"
          >
            <header className="relative flex shrink-0 items-center justify-between gap-3 border-b border-[color-mix(in_srgb,var(--color-text-primary)_12%,transparent)] px-4 py-3.5">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h2 id={titleId} className="text-sm font-semibold">
                  {copy.chat.title}
                </h2>
                <span className="rounded-full border border-accent-500/40 bg-[color-mix(in_srgb,var(--color-accent-500)_14%,transparent)] px-2 py-1 text-[0.625rem] font-semibold tracking-[0.08em] text-accent-500 uppercase">
                  {copy.chat.comingSoon}
                </span>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  aria-label={
                    isMenuOpen
                      ? copy.chat.closeMenuLabel
                      : copy.chat.openMenuLabel
                  }
                  aria-expanded={isMenuOpen}
                  aria-controls={menuId}
                  className={headerButtonClassName}
                  onClick={() => setIsMenuOpen((current) => !current)}
                >
                  <MoreHorizontal aria-hidden="true" size={20} />
                </button>
                <button
                  type="button"
                  aria-label={copy.chat.closeLabel}
                  className={headerButtonClassName}
                  onClick={closePanel}
                >
                  <X aria-hidden="true" size={20} />
                </button>
              </div>

              <AnimatePresence>
                {isMenuOpen ? (
                  <motion.div
                    id={menuId}
                    role="menu"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{
                      duration: chatWidgetMotion.interactionDuration,
                      ease: chatWidgetMotion.ease,
                    }}
                    className="absolute top-[3.75rem] right-4 z-10 min-w-44 rounded-[0.75rem] border border-border bg-surface p-1.5 shadow-[0_0.75rem_2rem_color-mix(in_srgb,var(--color-text-primary)_10%,transparent)]"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      disabled
                      aria-disabled="true"
                      className="flex w-full cursor-not-allowed items-center justify-between gap-3 rounded-[0.625rem] px-3 py-2.5 text-left text-xs text-text-secondary opacity-55"
                    >
                      <span>{copy.chat.guestbook}</span>
                      <span className="text-[0.625rem] text-accent-500">
                        {copy.chat.guestbookUnavailable}
                      </span>
                    </button>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </header>

            <div className="floating-chat-panel-body min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4">
              <section aria-labelledby={previewTitleId}>
                <h3
                  id={previewTitleId}
                  className="text-xs font-semibold text-text-primary"
                >
                  {copy.chat.previewTitle}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-text-secondary">
                  {copy.chat.previewBody}
                </p>
                <div aria-hidden="true" className="mt-4 space-y-2.5">
                  <span className="block h-8 w-3/4 rounded-[0.75rem] bg-[color-mix(in_srgb,var(--color-text-primary)_7%,transparent)]" />
                  <span className="ml-auto block h-8 w-2/3 rounded-[0.75rem] bg-[color-mix(in_srgb,var(--color-accent-500)_12%,transparent)]" />
                  <span className="block h-8 w-1/2 rounded-[0.75rem] bg-[color-mix(in_srgb,var(--color-text-primary)_7%,transparent)]" />
                </div>
              </section>

              <div>
                <label
                  htmlFor={replyId}
                  className="text-xs font-medium text-text-secondary"
                >
                  {copy.chat.replyLabel}
                </label>
                <div className="mt-2 flex items-end gap-2">
                  <textarea
                    id={replyId}
                    disabled
                    rows={2}
                    placeholder={copy.chat.replyPlaceholder}
                    className="min-h-14 min-w-0 flex-1 cursor-not-allowed resize-none rounded-[0.75rem] border border-border bg-[color-mix(in_srgb,var(--color-surface)_30%,transparent)] px-3 py-2 text-xs text-text-secondary opacity-65 placeholder:text-text-secondary focus-visible:outline-2 focus-visible:outline-accent-500"
                  />
                  <button
                    type="button"
                    disabled
                    aria-label={copy.chat.sendLabel}
                    className="flex size-12 shrink-0 cursor-not-allowed items-center justify-center rounded-[0.75rem] border border-border text-text-secondary opacity-45"
                  >
                    <Send aria-hidden="true" size={18} />
                  </button>
                </div>
              </div>

              <div className="rounded-[0.875rem] border border-border bg-[color-mix(in_srgb,var(--color-surface)_28%,transparent)] p-3">
                <div className="flex items-center gap-2 text-xs font-medium text-text-primary">
                  <LockKeyhole
                    aria-hidden="true"
                    size={16}
                    className="text-accent-500"
                  />
                  <span>{copy.chat.loginUnavailable}</span>
                </div>
                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  aria-describedby={loginNoteId}
                  className="mt-3 flex min-h-12 w-full cursor-not-allowed items-center justify-center gap-2 rounded-[0.75rem] border border-border bg-[color-mix(in_srgb,var(--color-text-primary)_7%,transparent)] px-4 text-sm font-semibold text-text-primary opacity-60"
                >
                  <LogIn aria-hidden="true" size={18} />
                  {copy.chat.loginGoogle}
                </button>
                <p
                  id={loginNoteId}
                  className="mt-3 flex items-start gap-2 text-[0.6875rem] leading-relaxed text-text-secondary"
                >
                  <ShieldCheck
                    aria-hidden="true"
                    size={15}
                    className="mt-0.5 shrink-0 text-accent-500"
                  />
                  <span>{copy.chat.privacy}</span>
                </p>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {!isMobileViewport ? (
        <motion.div
          key="chat-controls"
          initial={{ opacity: 0, x: chatWidgetMotion.controlOffset }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: chatWidgetMotion.interactionDuration,
            ease: chatWidgetMotion.ease,
          }}
          className="floating-chat-controls flex items-center justify-end gap-2"
        >
          <motion.button
            type="button"
            aria-label={isOpen ? copy.chat.closeLabel : copy.chat.openLabel}
            aria-expanded={isOpen}
            aria-controls={panelId}
            whileHover={{ scale: chatWidgetMotion.hoverScale }}
            whileTap={{ scale: chatWidgetMotion.pressedScale }}
            transition={{
              duration: chatWidgetMotion.interactionDuration,
              ease: chatWidgetMotion.ease,
            }}
            onClick={togglePanel}
            className="floating-chat-trigger relative flex size-14 items-center justify-center overflow-hidden rounded-full border border-[color-mix(in_srgb,var(--color-accent-500)_48%,transparent)] bg-[linear-gradient(135deg,var(--color-accent-500),var(--color-accent-700))] text-accent-ink shadow-[0_0.75rem_2.5rem_color-mix(in_srgb,var(--color-accent-500)_32%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-500 sm:size-16 lg:size-14"
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
        </motion.div>
      ) : null}
    </div>
  );
}
