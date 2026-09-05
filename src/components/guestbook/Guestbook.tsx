import type { Session } from "@supabase/supabase-js";
import { ShieldCheck, Star } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  createGuestbookEntry,
  GuestbookCleanupError,
  deleteGuestbookEntry,
  getGuestbookSession,
  getGuestbookOwnerStatus,
  getGuestbookImageUrl,
  getMyActiveReview,
  isSupabaseConfigured,
  loadGuestbook,
  loadGuestbookPage,
  loadHiddenGuestbookEntries,
  moderateGuestbookEntry,
  reportGuestbookEntry,
  signInToGuestbook,
  signOutOfGuestbook,
  subscribeToGuestbookSession,
  toggleGuestbookReaction,
  trackGuestbookVisit,
  updateGuestbookEntry,
  type GuestbookData,
  type GuestbookEntry as Entry,
  type GuestbookFilter,
  type ModerationAction,
  type GuestbookSort,
  type ReviewCategory,
  type ReactionType,
  type ReportReason,
} from "../../data/guestbook";
import { useLanguage } from "../../hooks/useLanguage";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { EASE_OUT_EXPO } from "../../motion/constants";
import { GuestbookComposer } from "./GuestbookComposer";
import { GuestbookEntry } from "./GuestbookEntry";
import { GuestbookPushControl } from "./GuestbookPushControl";
import { PortfolioReactionBar } from "./PortfolioReactionBar";

const initialData: GuestbookData = {
  entries: [],
  hasMoreEntries: false,
  rating: {
    average_rating: 0,
    total_reviews: 0,
    distribution: Object.fromEntries(
      [1, 2, 3, 4, 5].map((value) => [value, { count: 0, percentage: 0 }]),
    ),
  },
  summary: {
    total_reviews: 0,
    total_discussions: 0,
    average_rating: 0,
  },
  statistics: {
    total_visitors: 0,
    today_visitors: 0,
  },
};

function getGuestbookErrorMessage(
  error: unknown,
  guestbook: ReturnType<typeof useLanguage>["copy"]["guestbook"],
) {
  if (error && typeof error === "object") {
    const code = "code" in error ? String(error.code) : "";
    const message = "message" in error ? String(error.message) : "";
    const details = "details" in error ? String(error.details) : "";
    if (details.includes("GUESTBOOK_USER_BLOCKED")) {
      return guestbook.composer.blocked;
    }
    if (details.includes("GUESTBOOK_RATE_LIMIT")) {
      return guestbook.composer.rateLimited;
    }
    if (details.includes("GUESTBOOK_DUPLICATE_BODY")) {
      return guestbook.composer.duplicateBody;
    }
    if (code === "23505" || message.includes("one_active_review")) {
      return guestbook.composer.duplicateReview;
    }
    if (code === "42501" || message.toLowerCase().includes("jwt")) {
      return guestbook.composer.sessionExpired;
    }
  }
  return guestbook.failure;
}

function getSessionDisplayName(session: Session) {
  const metadata: unknown = session.user.user_metadata;
  if (
    metadata &&
    typeof metadata === "object" &&
    "full_name" in metadata &&
    typeof metadata.full_name === "string"
  ) {
    return metadata.full_name;
  }
  return session.user.email ?? "";
}

export function Guestbook() {
  const { copy } = useLanguage();
  const prefersReducedMotion = usePrefersReducedMotion();
  const guestbook = copy.guestbook;
  const headingText = `${guestbook.heading.before} ${guestbook.heading.accent}`;
  const [session, setSession] = useState<Session | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [ownerChecking, setOwnerChecking] = useState(false);
  const [moderationMode, setModerationMode] = useState(false);
  const [hiddenEntries, setHiddenEntries] = useState<Entry[]>([]);
  const [moderationLoading, setModerationLoading] = useState(false);
  const [data, setData] = useState(initialData);
  const [filter, setFilter] = useState<GuestbookFilter>("all");
  const [sort, setSort] = useState<GuestbookSort>("newest");
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [replyTarget, setReplyTarget] = useState<Entry | null>(null);
  const [editTarget, setEditTarget] = useState<Entry | null>(null);
  const [editError, setEditError] = useState("");
  const [activeReview, setActiveReview] = useState<Entry | null>(null);
  const [reportTarget, setReportTarget] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState<ReportReason>("spam");
  const [reportNote, setReportNote] = useState("");
  const [pendingModerationId, setPendingModerationId] = useState<string | null>(
    null,
  );
  const moderationPendingRef = useRef(false);
  const refreshIdRef = useRef(0);
  const moderationLoadIdRef = useRef(0);
  const sessionUserIdRef = useRef<string | null>(session?.user.id ?? null);
  const feedQueryRef = useRef(`${filter}:${sort}`);
  const visibleEntryCountRef = useRef(Math.max(10, data.entries.length));
  sessionUserIdRef.current = session?.user.id ?? null;
  feedQueryRef.current = `${filter}:${sort}`;
  visibleEntryCountRef.current = Math.max(10, data.entries.length);

  const refresh = useCallback(
    async (background = false) => {
      const refreshId = ++refreshIdRef.current;
      if (!background) {
        setLoading(true);
        setError("");
      }
      try {
        const nextData = await loadGuestbook(filter, sort, 10);
        while (
          background &&
          nextData.entries.length < visibleEntryCountRef.current &&
          nextData.hasMoreEntries
        ) {
          const page = await loadGuestbookPage(
            filter,
            sort,
            nextData.entries.length,
            10,
          );
          nextData.entries.push(...page.entries);
          nextData.hasMoreEntries = page.hasMoreEntries;
        }
        if (refreshId === refreshIdRef.current) setData(nextData);
      } catch {
        if (!background) setError(guestbook.feed.error);
      } finally {
        if (!background) setLoading(false);
      }
    },
    [filter, guestbook.feed.error, sort],
  );

  useEffect(() => {
    let authEventReceived = false;
    const unsubscribe = subscribeToGuestbookSession((nextSession) => {
      authEventReceived = true;
      setSession(nextSession);
    });
    void getGuestbookSession().then((initialSession) => {
      if (!authEventReceived) setSession(initialSession);
    });
    return unsubscribe;
  }, []);
  useEffect(() => {
    let active = true;
    setOwnerChecking(Boolean(session));
    void getGuestbookOwnerStatus(session)
      .then((owner) => {
        if (!active) return;
        setIsOwner(owner);
        if (!owner) setModerationMode(false);
      })
      .catch(() => {
        if (active) setIsOwner(false);
      })
      .finally(() => {
        if (active) setOwnerChecking(false);
      });
    return () => {
      active = false;
    };
  }, [session]);
  useEffect(() => {
    trackGuestbookVisit();
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  useEffect(() => {
    if (!session) {
      setActiveReview(null);
      setEditTarget(null);
      setReplyTarget(null);
      setReportTarget(null);
      return;
    }
    let active = true;
    const userId = session.user.id;
    setActiveReview(null);
    setEditTarget(null);
    setEditError("");
    setReplyTarget(null);
    setReportTarget(null);
    void getMyActiveReview()
      .then((review) => {
        if (active && session.user.id === userId) setActiveReview(review);
      })
      .catch(() => {
        if (active) setActiveReview(null);
      });
    return () => {
      active = false;
    };
  }, [session]);

  const syncActiveReview = async (expectedUserId: string) => {
    const review = await getMyActiveReview();
    if (sessionUserIdRef.current === expectedUserId) setActiveReview(review);
  };

  const openActiveReviewEditor = async () => {
    if (!session) return;
    setEditError("");
    try {
      const review = await getMyActiveReview();
      if (sessionUserIdRef.current !== session.user.id) return;
      setActiveReview(review);
      if (!review) {
        setStatus(guestbook.composer.reviewNoLongerAvailable);
        return;
      }
      if (review.is_hidden) return;
      setEditTarget(review);
    } catch {
      setError(guestbook.failure);
    }
  };

  const requireSession = () => {
    if (session) return true;
    setStatus(guestbook.feed.signInAction);
    return false;
  };

  const submitEntry = async (input: {
    body: string;
    entryType: "discussion" | "review" | "reply";
    rating: number | null;
    image: File | null;
    reviewCategories: ReviewCategory[] | null;
  }) => {
    if (!session || submitting) return false;
    setSubmitting(true);
    setError("");
    try {
      const created = await createGuestbookEntry({
        ...input,
        parentId: replyTarget?.id,
        userId: session.user.id,
      });
      setReplyTarget(null);
      setStatus(
        created.moderationStatus === "pending"
          ? guestbook.composer.pendingFeedback
          : created.moderationStatus === "quarantined"
            ? guestbook.composer.quarantinedFeedback
            : guestbook.success,
      );
      await refresh();
      if (input.entryType === "review") {
        await syncActiveReview(session.user.id);
      }
      return true;
    } catch (submitError) {
      if (
        input.entryType === "review" &&
        submitError &&
        typeof submitError === "object" &&
        (("code" in submitError && submitError.code === "23505") ||
          ("message" in submitError &&
            String(submitError.message).includes("one_active_review")))
      ) {
        await syncActiveReview(session.user.id).catch(() => undefined);
      }
      setError(getGuestbookErrorMessage(submitError, guestbook));
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const submitEdit = async (input: {
    body: string;
    entryType: "discussion" | "review" | "reply";
    rating: number | null;
    image: File | null;
    reviewCategories: ReviewCategory[] | null;
    removeExistingImage: boolean;
  }) => {
    if (!editTarget || !session || submitting) return false;
    setSubmitting(true);
    setEditError("");
    try {
      const updated = await updateGuestbookEntry({
        entryId: editTarget.id,
        body: input.body,
        entryType: input.entryType,
        rating: input.rating,
        imagePath: editTarget.image_path,
        image: input.image,
        removeExistingImage: input.removeExistingImage,
        userId: session.user.id,
        reviewCategories: input.reviewCategories,
      });
      setEditTarget(null);
      setStatus(
        updated.moderationStatus === "pending"
          ? guestbook.composer.pendingFeedback
          : updated.moderationStatus === "quarantined"
            ? guestbook.composer.quarantinedFeedback
            : guestbook.success,
      );
      await refresh(true);
      if (editTarget.entry_type === "review") {
        await syncActiveReview(session.user.id);
      }
      return true;
    } catch (submitError) {
      setEditError(getGuestbookErrorMessage(submitError, guestbook));
      await syncActiveReview(session.user.id).catch(() => undefined);
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const pinnedEntries = data.entries.filter((entry) => entry.is_pinned);
  const regularEntries = data.entries.filter((entry) => !entry.is_pinned);
  const filterCounts: Record<GuestbookFilter, number> = {
    all: data.summary.total_discussions + data.summary.total_reviews,
    discussions: data.summary.total_discussions,
    reviews: data.summary.total_reviews,
  };

  const react = async (entryId: string, reaction: ReactionType) => {
    if (!requireSession()) return;
    try {
      await toggleGuestbookReaction(entryId, reaction);
      await refresh(true);
    } catch (reactionError) {
      setError(getGuestbookErrorMessage(reactionError, guestbook));
    }
  };

  const loadMoreEntries = async () => {
    if (loadingMore || !data.hasMoreEntries) return;
    const query = `${filter}:${sort}`;
    setLoadingMore(true);
    setError("");
    try {
      const page = await loadGuestbookPage(
        filter,
        sort,
        data.entries.length,
        10,
      );
      if (feedQueryRef.current !== query) return;
      setData((current) => ({
        ...current,
        entries: [
          ...current.entries,
          ...page.entries.filter(
            (entry) => !current.entries.some((item) => item.id === entry.id),
          ),
        ],
        hasMoreEntries: page.hasMoreEntries,
      }));
    } catch {
      setError(guestbook.feed.error);
    } finally {
      setLoadingMore(false);
    }
  };

  const remove = async (entryId: string) => {
    if (!requireSession() || !window.confirm(guestbook.feed.delete)) return;
    try {
      await deleteGuestbookEntry(entryId);
      if (activeReview?.id === entryId) setActiveReview(null);
      setStatus(guestbook.success);
      await refresh(true);
    } catch (reportError) {
      setError(getGuestbookErrorMessage(reportError, guestbook));
    }
  };

  const submitReport = async () => {
    if (!reportTarget || !requireSession()) return;
    try {
      await reportGuestbookEntry(reportTarget, reportReason, reportNote);
      setReportTarget(null);
      setReportNote("");
      setStatus(guestbook.success);
      await refresh(true);
    } catch {
      setError(guestbook.failure);
    }
  };

  const loadModeration = async (background = false) => {
    if (!session || !isOwner) return;
    const loadId = ++moderationLoadIdRef.current;
    if (!background) {
      setModerationLoading(true);
      setError("");
    }
    try {
      const entries = await loadHiddenGuestbookEntries(session);
      if (loadId === moderationLoadIdRef.current) setHiddenEntries(entries);
    } catch {
      if (!background) setError(guestbook.failure);
    } finally {
      if (!background) setModerationLoading(false);
    }
  };

  const removeVisibleEntry = (entryId: string) => {
    setData((current) => ({
      ...current,
      entries: current.entries.flatMap((root) => {
        if (root.id === entryId) return [];
        const replies = root.replies?.filter((reply) => reply.id !== entryId);
        if (replies?.length === root.replies?.length) return [root];
        return [
          {
            ...root,
            replies,
            reply_count: Math.max(0, (root.reply_count ?? 0) - 1),
          },
        ];
      }),
    }));
  };

  const moderate = async (entry: Entry, action: ModerationAction) => {
    if (!session || !isOwner || moderationPendingRef.current) return;
    if (action === "hide" && !window.confirm(guestbook.feed.confirmHide))
      return;
    if (action === "delete" && !window.confirm(guestbook.feed.confirmDelete))
      return;
    if (
      action === "permanent_delete" &&
      !window.confirm(guestbook.feed.confirmPermanentDelete)
    )
      return;
    if (action === "block" && !window.confirm(guestbook.feed.confirmBlock))
      return;
    moderationPendingRef.current = true;
    setPendingModerationId(entry.id);
    setError("");
    try {
      const deletedIds = await moderateGuestbookEntry(
        session,
        entry.id,
        action,
      );
      if (action === "permanent_delete") {
        reconcilePermanentDeletion(deletedIds);
        setReplyTarget(null);
        setEditTarget(null);
        await Promise.all([
          refresh(true),
          loadModeration(true),
          syncActiveReview(session.user.id),
        ]);
        setStatus(guestbook.success);
        return;
      }
      if (action === "delete" && activeReview?.id === entry.id) {
        setActiveReview(null);
      }
      setStatus(guestbook.success);
      if (entry.entry_type === "review") {
        await syncActiveReview(session.user.id);
      }
      if (action === "pin" || action === "unpin") {
        setData((current) => ({
          ...current,
          entries: current.entries.map((item) =>
            item.id === entry.id
              ? { ...item, is_pinned: action === "pin" }
              : item,
          ),
        }));
      } else if (action === "hide") {
        removeVisibleEntry(entry.id);
      } else if (action === "unhide" || action === "approve") {
        setHiddenEntries((current) =>
          current.filter((item) => item.id !== entry.id),
        );
      }

      if (moderationMode) {
        void loadModeration(true);
        if (action === "unhide" || action === "approve" || action === "block")
          void refresh(true);
      } else {
        void refresh(true);
      }
    } catch (moderationError) {
      if (moderationError instanceof GuestbookCleanupError) {
        reconcilePermanentDeletion(moderationError.deletedIds);
        setReplyTarget(null);
        setEditTarget(null);
        setStatus("");
        setError(guestbook.feed.storageCleanupFailed);
        await Promise.all([
          refresh(true),
          loadModeration(true),
          syncActiveReview(session.user.id).catch(() => undefined),
        ]);
        return;
      }
      setError(
        moderationError instanceof Error &&
          moderationError.message === "PIN_LIMIT_REACHED"
          ? guestbook.feed.pinLimit
          : guestbook.failure,
      );
    } finally {
      moderationPendingRef.current = false;
      setPendingModerationId(null);
    }
  };

  const reconcilePermanentDeletion = (deletedIds: string[]) => {
    // Invalidate in-flight reads before removing authoritative IDs, even if the next refresh fails.
    ++refreshIdRef.current;
    ++moderationLoadIdRef.current;
    const deleted = new Set(deletedIds);
    setData((current) => ({
      ...current,
      entries: current.entries
        .filter((root) => !deleted.has(root.id))
        .map((root) => {
          const replies = root.replies?.filter(
            (reply) => !deleted.has(reply.id),
          );
          return {
            ...root,
            replies,
            reply_count:
              replies?.filter((reply) => !reply.is_deleted).length ??
              root.reply_count,
          };
        }),
    }));
    setHiddenEntries((current) =>
      current.filter((item) => !deleted.has(item.id)),
    );
    setActiveReview((current) =>
      current && deleted.has(current.id) ? null : current,
    );
  };

  return (
    <main
      id="guestbook-main"
      tabIndex={-1}
      className="relative z-20 outline-none"
    >
      <section
        aria-labelledby="guestbook-heading"
        className="min-h-svh bg-transparent px-5 pt-28 pb-16 text-text-primary sm:px-12 sm:pt-32 lg:px-[10vw] lg:pt-36"
      >
        <div className="mx-auto max-w-[92rem]">
          <motion.header
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.55,
              ease: EASE_OUT_EXPO,
            }}
          >
            <p className="guestbook-section-label inline-flex cursor-default text-xs tracking-[0.28em] uppercase">
              <span className="guestbook-label-part">
                {guestbook.sectionLabel}
              </span>
            </p>
            <h1
              id="guestbook-heading"
              aria-label={headingText}
              className="mt-4 max-w-[12ch] font-display text-[clamp(2.75rem,8vw,6.5rem)] leading-[0.88] font-bold tracking-[-0.06em] text-balance"
            >
              <span aria-hidden="true">
                {guestbook.heading.before}{" "}
                <span className="text-accent-500 italic">
                  {guestbook.heading.accent}
                </span>
              </span>
            </h1>
            <p className="mt-6 max-w-[42rem] text-base leading-7 text-text-secondary sm:text-lg">
              {guestbook.description}
            </p>
          </motion.header>

          <div className="mt-12 grid xl:grid-cols-[minmax(0,1fr)_21rem] xl:grid-rows-[min-content_1fr] xl:items-start xl:gap-x-10">
            <div className="min-w-0 xl:col-start-1 xl:row-start-1">
              <section
                aria-labelledby="rating-heading"
                className="guestbook-panel rounded-2xl border p-5 sm:p-6"
              >
                <div className="grid max-w-[47rem] gap-6 sm:grid-cols-[10rem_minmax(20rem,31rem)] sm:items-center">
                  <div>
                    <h2
                      id="rating-heading"
                      className="text-xs font-semibold tracking-[0.2em] text-text-secondary uppercase"
                    >
                      {guestbook.rating.overall}
                    </h2>
                    <div className="mt-3 flex items-end gap-2">
                      <span className="font-display text-5xl font-bold">
                        {data.rating.total_reviews
                          ? Number(data.rating.average_rating).toFixed(1)
                          : "—"}
                      </span>
                      {data.rating.total_reviews ? (
                        <Star className="mb-1 fill-accent-500 text-accent-500" />
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm text-text-secondary">
                      {data.rating.total_reviews
                        ? `${data.rating.total_reviews} ${guestbook.rating.reviews}`
                        : guestbook.rating.empty}
                    </p>
                  </div>
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((stars) => {
                      const item = data.rating.distribution[String(stars)] ?? {
                        count: 0,
                        percentage: 0,
                      };
                      return (
                        <div
                          key={stars}
                          className="grid grid-cols-[2rem_minmax(0,1fr)_4.5rem] items-center gap-2.5 text-xs"
                        >
                          <span>{stars} ★</span>
                          <span className="h-2 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--color-text-secondary)_22%,var(--color-border))]">
                            <span
                              className="block h-full rounded-full bg-accent-500 shadow-[0_0_0.5rem_color-mix(in_srgb,var(--color-accent-500)_38%,transparent)]"
                              style={{ width: `${item.percentage}%` }}
                            />
                          </span>
                          <span className="text-right text-text-secondary">
                            {Math.round(item.percentage)}% ({item.count})
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>

              <PortfolioReactionBar
                session={session}
                onRequireSignIn={() => setStatus(guestbook.feed.signInAction)}
              />
            </div>

            <aside className="mt-6 space-y-5 xl:sticky xl:top-32 xl:col-start-2 xl:row-span-2 xl:row-start-1 xl:mt-0 xl:self-start">
              <SidebarPanel
                icon={<Star size={17} />}
                title={guestbook.sidebar.summary}
              >
                <dl className="grid grid-cols-2 gap-x-4 gap-y-5">
                  <div>
                    <dt className="text-xs leading-5 text-text-secondary">
                      {guestbook.sidebar.totalVisitors}
                    </dt>
                    <dd className="mt-1 font-display text-3xl font-semibold">
                      {data.statistics.total_visitors}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs leading-5 text-text-secondary">
                      {guestbook.sidebar.todayVisitors}
                    </dt>
                    <dd className="mt-1 font-display text-3xl font-semibold">
                      {data.statistics.today_visitors}
                    </dd>
                  </div>
                  <div className="col-span-2 border-t border-border pt-4">
                    <dt className="text-xs leading-5 text-text-secondary">
                      {guestbook.sidebar.averageRating}
                    </dt>
                    <dd className="mt-1 flex items-center gap-2 font-display text-3xl font-semibold">
                      {data.summary.total_reviews
                        ? Number(data.summary.average_rating).toFixed(1)
                        : "—"}
                      {data.summary.total_reviews ? (
                        <Star
                          size={18}
                          className="fill-accent-500 text-accent-500"
                        />
                      ) : null}
                    </dd>
                  </div>
                </dl>
              </SidebarPanel>
              <SidebarPanel
                icon={<ShieldCheck size={17} />}
                title={guestbook.sidebar.guidelines}
              >
                <ul className="space-y-2.5">
                  {guestbook.sidebar.guidelinesItems.map((item) => (
                    <li
                      key={item}
                      className="flex gap-2 text-xs leading-5 text-text-secondary"
                    >
                      <span className="mt-2 size-1 shrink-0 rounded-full bg-accent-500" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 border-t border-border pt-4 text-xs leading-5 font-medium">
                  {guestbook.sidebar.guidelinesThanks}
                </p>
              </SidebarPanel>
            </aside>

            <div className="min-w-0 xl:col-start-1 xl:row-start-2">
              {session ? (
                <GuestbookComposer
                  submitting={submitting}
                  accountName={getSessionDisplayName(session)}
                  isAuthor={isOwner}
                  onSignOut={() => void signOutOfGuestbook()}
                  accountControl={<GuestbookPushControl session={session} />}
                  hasActiveReview={Boolean(activeReview)}
                  activeReviewHidden={Boolean(
                    activeReview?.is_hidden ||
                    (activeReview?.moderation_status &&
                      activeReview.moderation_status !== "visible"),
                  )}
                  onEditReview={() => void openActiveReviewEditor()}
                  onSubmit={submitEntry}
                />
              ) : (
                <section className="guestbook-panel mt-6 rounded-2xl border p-6 text-center">
                  <ShieldCheck className="mx-auto text-accent-500" />
                  <h2 className="mt-3 font-display text-xl font-semibold">
                    {guestbook.composer.signInPrompt}
                  </h2>
                  <button
                    type="button"
                    disabled={!isSupabaseConfigured}
                    className="mt-5 min-h-11 rounded-xl bg-accent-500 px-5 text-sm font-bold text-accent-ink disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() =>
                      void signInToGuestbook().catch(() =>
                        setError(guestbook.failure),
                      )
                    }
                  >
                    {guestbook.composer.signIn}
                  </button>
                  {!isSupabaseConfigured ? (
                    <p className="mt-3 text-xs text-text-secondary">
                      {guestbook.configuredNote}
                    </p>
                  ) : null}
                </section>
              )}

              <div className="mt-10 flex flex-col gap-3 border-b border-border sm:flex-row sm:items-end sm:justify-between">
                <div
                  role="tablist"
                  aria-label={guestbook.filters.label}
                  className="guestbook-tabs flex overflow-x-auto"
                >
                  {(["all", "discussions", "reviews"] as const).map((value) => (
                    <button
                      key={value}
                      role="tab"
                      aria-selected={filter === value}
                      className="guestbook-tab px-3 py-3 text-sm font-semibold whitespace-nowrap"
                      onClick={() => {
                        setFilter(value);
                        if (value !== "reviews" && sort === "highest_rated") {
                          setSort("newest");
                        }
                      }}
                    >
                      {guestbook.filters[value]} ({filterCounts[value]})
                    </button>
                  ))}
                </div>
                <div className="flex overflow-x-auto">
                  {(
                    [
                      "newest",
                      "popular",
                      ...(filter === "reviews"
                        ? (["highest_rated"] as const)
                        : []),
                    ] as const
                  ).map((value) => (
                    <button
                      key={value}
                      type="button"
                      data-active={sort === value}
                      className="guestbook-sort px-3 py-3 text-xs font-semibold whitespace-nowrap"
                      onClick={() => {
                        setSort(value);
                      }}
                    >
                      {value === "highest_rated"
                        ? guestbook.filters.highestRated
                        : guestbook.filters[value]}
                    </button>
                  ))}
                </div>
              </div>
              {isOwner ? (
                <button
                  type="button"
                  aria-pressed={moderationMode}
                  className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-xl border border-border px-3 text-xs font-bold hover:border-accent-500 hover:text-accent-500"
                  onClick={() => {
                    const nextMode = !moderationMode;
                    setModerationMode(nextMode);
                    if (nextMode) void loadModeration();
                  }}
                >
                  <ShieldCheck size={15} />
                  {guestbook.feed.moderation}
                </button>
              ) : null}
              {ownerChecking ? (
                <span className="sr-only" aria-live="polite">
                  {guestbook.feed.loading}
                </span>
              ) : null}

              {status ? (
                <p role="status" className="mt-5 text-sm text-text-secondary">
                  {status}
                </p>
              ) : null}
              {error ? (
                <p role="alert" className="mt-5 text-sm text-accent-600">
                  {error}
                </p>
              ) : null}
              {moderationMode && moderationLoading ? (
                <p className="py-12 text-center text-sm text-text-secondary">
                  {guestbook.feed.loading}
                </p>
              ) : moderationMode ? (
                hiddenEntries.length ? (
                  <div>
                    {hiddenEntries.map((entry) => (
                      <GuestbookEntry
                        key={entry.id}
                        entry={entry}
                        currentUserId={session?.user.id}
                        isCurrentUserOwner={isOwner}
                        moderationView
                        moderationDisabled={pendingModerationId !== null}
                        moderationPendingId={pendingModerationId}
                        onReply={() => undefined}
                        onReact={() => undefined}
                        onDelete={() => undefined}
                        onEdit={() => undefined}
                        onReport={() => undefined}
                        onModerate={(target, action) =>
                          void moderate(target, action)
                        }
                      />
                    ))}
                  </div>
                ) : (
                  <p className="py-12 text-center text-sm text-text-secondary">
                    {guestbook.feed.moderationEmpty}
                  </p>
                )
              ) : loading ? (
                <p className="py-12 text-center text-sm text-text-secondary">
                  {guestbook.feed.loading}
                </p>
              ) : data.entries.length ? (
                <div>
                  {pinnedEntries.length ? (
                    <section aria-labelledby="guestbook-pinned-heading">
                      <h2
                        id="guestbook-pinned-heading"
                        className="border-b border-border py-4 text-xs font-bold tracking-[0.16em] text-accent-500 uppercase"
                      >
                        {guestbook.filters.pinned}
                      </h2>
                      {pinnedEntries.map((entry) => (
                        <GuestbookEntry
                          key={entry.id}
                          entry={entry}
                          currentUserId={session?.user.id}
                          isCurrentUserOwner={isOwner}
                          moderationDisabled={pendingModerationId !== null}
                          moderationPendingId={pendingModerationId}
                          onReply={(target) =>
                            requireSession() && setReplyTarget(target)
                          }
                          onReact={(id, reaction) => void react(id, reaction)}
                          onDelete={(id) => void remove(id)}
                          onEdit={(entry) => {
                            setEditError("");
                            setEditTarget(entry);
                          }}
                          onReport={(id) => {
                            if (requireSession()) setReportTarget(id);
                          }}
                          onModerate={(target, action) =>
                            void moderate(target, action)
                          }
                        />
                      ))}
                    </section>
                  ) : null}
                  {regularEntries.map((entry) => (
                    <GuestbookEntry
                      key={entry.id}
                      entry={entry}
                      currentUserId={session?.user.id}
                      isCurrentUserOwner={isOwner}
                      moderationDisabled={pendingModerationId !== null}
                      moderationPendingId={pendingModerationId}
                      onReply={(target) =>
                        requireSession() && setReplyTarget(target)
                      }
                      onReact={(id, reaction) => void react(id, reaction)}
                      onDelete={(id) => void remove(id)}
                      onEdit={(entry) => {
                        setEditError("");
                        setEditTarget(entry);
                      }}
                      onReport={(id) => {
                        if (requireSession()) setReportTarget(id);
                      }}
                      onModerate={(entry, action) =>
                        void moderate(entry, action)
                      }
                    />
                  ))}
                  {data.hasMoreEntries ? (
                    <button
                      type="button"
                      disabled={loadingMore}
                      className="mt-6 w-full rounded-xl border border-border py-3 text-sm font-semibold hover:border-accent-500 hover:text-accent-500"
                      onClick={() => void loadMoreEntries()}
                    >
                      {loadingMore
                        ? guestbook.feed.loading
                        : guestbook.feed.loadMoreComments}
                    </button>
                  ) : null}
                </div>
              ) : (
                <div className="py-16 text-center">
                  <MessageEmpty />
                  <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-text-secondary">
                    {guestbook.feed.empty}
                  </p>
                </div>
              )}
              {replyTarget ? (
                <div
                  className="fixed inset-0 z-[90] grid place-items-center bg-bg/70 p-4 backdrop-blur-sm"
                  role="dialog"
                  aria-modal="true"
                  aria-label={guestbook.feed.reply}
                >
                  <div className="w-full max-w-xl rounded-2xl border border-border bg-surface p-4">
                    <GuestbookComposer
                      compact
                      replyTo={replyTarget.author.display_name}
                      submitting={submitting}
                      onCancel={() => setReplyTarget(null)}
                      onSubmit={submitEntry}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {reportTarget ? (
        <div
          className="fixed inset-0 z-[95] grid place-items-center bg-bg/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="guestbook-report-heading"
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-5">
            <h2
              id="guestbook-report-heading"
              className="font-display text-xl font-semibold"
            >
              {guestbook.feed.reportHeading}
            </h2>
            <select
              value={reportReason}
              className="mt-5 w-full rounded-xl border border-border bg-surface p-3 text-sm"
              onChange={(event) =>
                setReportReason(event.target.value as ReportReason)
              }
            >
              {(
                [
                  "spam",
                  "harassment",
                  "hate",
                  "threat",
                  "illegal",
                  "phishing",
                  "personal_data",
                  "irrelevant",
                  "inappropriate",
                  "other",
                ] as const
              ).map((reason) => (
                <option key={reason} value={reason}>
                  {guestbook.feed.reportReasons[reason]}
                </option>
              ))}
            </select>
            <textarea
              maxLength={500}
              value={reportNote}
              placeholder={guestbook.feed.reportNote}
              className="mt-3 w-full rounded-xl border border-border bg-transparent p-3 text-sm"
              onChange={(event) => setReportNote(event.target.value)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 text-sm"
                onClick={() => setReportTarget(null)}
              >
                {guestbook.feed.cancel}
              </button>
              <button
                type="button"
                className="rounded-xl bg-accent-500 px-4 py-2 text-sm font-bold text-accent-ink"
                onClick={() => void submitReport()}
              >
                {guestbook.feed.submitReport}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {editTarget ? (
        <div
          className="fixed inset-0 z-[95] grid place-items-center bg-bg/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={guestbook.feed.edit}
        >
          <div className="w-full max-w-xl rounded-2xl border border-border bg-surface p-4">
            {editError ? (
              <p role="alert" className="mb-3 text-sm text-accent-600">
                {editError}
              </p>
            ) : null}
            <GuestbookComposer
              compact={Boolean(editTarget.parent_id)}
              initialBody={editTarget.body ?? ""}
              initialType={editTarget.entry_type ?? "reply"}
              initialRating={editTarget.rating}
              initialReviewCategories={editTarget.review_categories}
              existingImageUrl={getGuestbookImageUrl(editTarget.image_path)}
              submitting={submitting}
              onCancel={() => {
                setEditTarget(null);
                setEditError("");
              }}
              onSubmit={submitEdit}
            />
          </div>
        </div>
      ) : null}
    </main>
  );
}

function SidebarPanel({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="guestbook-panel rounded-2xl border p-5">
      <h2 className="mb-4 flex items-center gap-2 font-display text-base font-semibold">
        {icon}
        <span>{title}</span>
      </h2>
      {children}
    </section>
  );
}
function MessageEmpty() {
  return (
    <div
      aria-hidden="true"
      className="mx-auto flex size-12 items-center justify-center rounded-full border border-border text-xl text-accent-500"
    >
      •••
    </div>
  );
}
