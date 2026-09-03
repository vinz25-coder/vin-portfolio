import type { Session } from "@supabase/supabase-js";
import { BarChart3, LogOut, ShieldCheck, Star, Users } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";

import {
  createGuestbookEntry,
  deleteGuestbookEntry,
  getGuestbookSession,
  getGuestbookOwnerStatus,
  isSupabaseConfigured,
  loadGuestbook,
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
  type GuestbookSort,
  type GuestbookProfile,
  type ReactionType,
  type ReportReason,
} from "../../data/guestbook";
import { useLanguage } from "../../hooks/useLanguage";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { EASE_OUT_EXPO } from "../../motion/constants";
import { GuestbookComposer } from "./GuestbookComposer";
import { GuestbookEntry } from "./GuestbookEntry";

const initialData: GuestbookData = {
  entries: [],
  rating: {
    average_rating: 0,
    total_reviews: 0,
    distribution: Object.fromEntries(
      [1, 2, 3, 4, 5].map((value) => [value, { count: 0, percentage: 0 }]),
    ),
  },
  statistics: {
    total_visitors: 0,
    total_comments: 0,
    today_visitors: 0,
    this_week: 0,
  },
  contributors: [],
};

export function Guestbook() {
  const { copy } = useLanguage();
  const prefersReducedMotion = usePrefersReducedMotion();
  const guestbook = copy.guestbook;
  const [session, setSession] = useState<Session | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [data, setData] = useState(initialData);
  const [filter, setFilter] = useState<GuestbookFilter>("all");
  const [sort, setSort] = useState<GuestbookSort>("newest");
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [replyTarget, setReplyTarget] = useState<Entry | null>(null);
  const [editTarget, setEditTarget] = useState<Entry | null>(null);
  const [reportTarget, setReportTarget] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState<ReportReason>("spam");
  const [reportNote, setReportNote] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await loadGuestbook(filter, sort, limit));
    } catch {
      setError(guestbook.feed.error);
    } finally {
      setLoading(false);
    }
  }, [filter, guestbook.feed.error, limit, sort]);

  useEffect(() => {
    void getGuestbookSession().then(setSession);
    return subscribeToGuestbookSession(setSession);
  }, []);
  useEffect(() => {
    void getGuestbookOwnerStatus(session)
      .then(setIsOwner)
      .catch(() => setIsOwner(false));
  }, [session]);
  useEffect(() => {
    trackGuestbookVisit();
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);

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
    mentionedUserIds: string[];
  }) => {
    if (!session || submitting) return false;
    setSubmitting(true);
    setError("");
    try {
      await createGuestbookEntry({
        ...input,
        parentId: replyTarget?.id,
        userId: session.user.id,
        mentionedUserIds: input.mentionedUserIds,
      });
      setReplyTarget(null);
      setStatus(guestbook.success);
      await refresh();
      return true;
    } catch {
      setError(guestbook.failure);
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
    mentionedUserIds: string[];
  }) => {
    if (!editTarget || submitting) return false;
    setSubmitting(true);
    try {
      await updateGuestbookEntry({
        entryId: editTarget.id,
        body: input.body,
        entryType: input.entryType,
        rating: input.rating,
        imagePath: editTarget.image_path,
        mentionedUserIds: input.mentionedUserIds,
      });
      setEditTarget(null);
      setStatus(guestbook.success);
      await refresh();
      return true;
    } catch {
      setError(guestbook.failure);
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const participants = Array.from(
    new Map<string, GuestbookProfile>(
      data.entries
        .flatMap((entry) => [entry, ...(entry.replies ?? [])])
        .map((entry) => [entry.author.id, entry.author]),
    ).values(),
  );

  const react = async (entryId: string, reaction: ReactionType) => {
    if (!requireSession()) return;
    try {
      await toggleGuestbookReaction(entryId, reaction);
      await refresh();
    } catch {
      setError(guestbook.failure);
    }
  };

  const remove = async (entryId: string) => {
    if (!requireSession() || !window.confirm(guestbook.feed.delete)) return;
    try {
      await deleteGuestbookEntry(entryId);
      setStatus(guestbook.success);
      await refresh();
    } catch {
      setError(guestbook.failure);
    }
  };

  const submitReport = async () => {
    if (!reportTarget || !requireSession()) return;
    try {
      await reportGuestbookEntry(reportTarget, reportReason, reportNote);
      setReportTarget(null);
      setReportNote("");
      setStatus(guestbook.success);
    } catch {
      setError(guestbook.failure);
    }
  };

  const moderate = async (entry: Entry, action: "pin" | "unpin" | "hide") => {
    if (!session || !isOwner) return;
    try {
      await moderateGuestbookEntry(session, entry.id, action);
      setStatus(guestbook.success);
      await refresh();
    } catch {
      setError(guestbook.failure);
    }
  };

  return (
    <main
      id="guestbook-main"
      tabIndex={-1}
      className="relative z-10 outline-none"
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
              className="mt-4 max-w-[12ch] font-display text-[clamp(3.25rem,9vw,7.5rem)] leading-[0.88] font-bold tracking-[-0.06em] text-balance"
            >
              {guestbook.heading}
            </h1>
            <p className="mt-6 max-w-[42rem] text-base leading-7 text-text-secondary sm:text-lg">
              {guestbook.description}
            </p>
          </motion.header>

          <div className="mt-12 grid gap-8 xl:grid-cols-[minmax(0,1fr)_21rem] xl:items-start xl:gap-10">
            <div className="min-w-0">
              <section
                aria-labelledby="rating-heading"
                className="guestbook-panel rounded-2xl border p-5 sm:p-6"
              >
                <div className="grid gap-7 sm:grid-cols-[12rem_minmax(0,1fr)] sm:items-center">
                  <div>
                    <h2
                      id="rating-heading"
                      className="text-xs font-semibold tracking-[0.2em] text-text-secondary uppercase"
                    >
                      {guestbook.rating.overall}
                    </h2>
                    <div className="mt-3 flex items-end gap-2">
                      <span className="font-display text-5xl font-bold">
                        {Number(data.rating.average_rating).toFixed(1)}
                      </span>
                      <Star className="mb-1 fill-accent-500 text-accent-500" />
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
                          className="grid grid-cols-[2rem_minmax(0,1fr)_3rem] items-center gap-3 text-xs"
                        >
                          <span>{stars} ★</span>
                          <span className="h-1.5 overflow-hidden rounded-full bg-border">
                            <span
                              className="block h-full rounded-full bg-accent-500"
                              style={{ width: `${item.percentage}%` }}
                            />
                          </span>
                          <span className="text-right text-text-secondary">
                            {Math.round(item.percentage)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>

              {session ? (
                <>
                  <div className="mt-6 flex items-center justify-between text-xs text-text-secondary">
                    <span>
                      {session.user.user_metadata.full_name ??
                        session.user.email}
                    </span>
                    <button
                      type="button"
                      className="flex items-center gap-1 font-semibold hover:text-accent-500"
                      onClick={() => void signOutOfGuestbook()}
                    >
                      <LogOut size={14} />
                      {guestbook.composer.signOut}
                    </button>
                  </div>
                  <GuestbookComposer
                    submitting={submitting}
                    participants={participants}
                    onSubmit={submitEntry}
                  />
                </>
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
                        setLimit(10);
                      }}
                    >
                      {guestbook.filters[value]}
                    </button>
                  ))}
                </div>
                <div className="flex overflow-x-auto">
                  {(["newest", "popular", "highest_rated"] as const).map(
                    (value) => (
                      <button
                        key={value}
                        type="button"
                        data-active={sort === value}
                        className="guestbook-sort px-3 py-3 text-xs font-semibold whitespace-nowrap"
                        onClick={() => {
                          setSort(value);
                          if (value === "highest_rated") setFilter("reviews");
                          setLimit(10);
                        }}
                      >
                        {value === "highest_rated"
                          ? guestbook.filters.highestRated
                          : guestbook.filters[value]}
                      </button>
                    ),
                  )}
                </div>
              </div>

              <div aria-live="polite" className="sr-only">
                {status}
              </div>
              {error ? (
                <p role="alert" className="mt-5 text-sm text-accent-600">
                  {error}
                </p>
              ) : null}
              {loading ? (
                <p className="py-12 text-center text-sm text-text-secondary">
                  {guestbook.feed.loading}
                </p>
              ) : data.entries.length ? (
                <div>
                  {data.entries.map((entry) => (
                    <GuestbookEntry
                      key={entry.id}
                      entry={entry}
                      currentUserId={session?.user.id}
                      isCurrentUserOwner={isOwner}
                      onReply={(target) =>
                        requireSession() && setReplyTarget(target)
                      }
                      onReact={(id, reaction) => void react(id, reaction)}
                      onDelete={(id) => void remove(id)}
                      onEdit={setEditTarget}
                      onReport={(id) => {
                        if (requireSession()) setReportTarget(id);
                      }}
                      onModerate={(entry, action) =>
                        void moderate(entry, action)
                      }
                    />
                  ))}
                  {data.entries.length >= limit ? (
                    <button
                      type="button"
                      className="mt-6 w-full rounded-xl border border-border py-3 text-sm font-semibold hover:border-accent-500 hover:text-accent-500"
                      onClick={() => setLimit((value) => value + 10)}
                    >
                      {guestbook.feed.loadMore}
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
                      participants={participants}
                      submitting={submitting}
                      onCancel={() => setReplyTarget(null)}
                      onSubmit={submitEntry}
                    />
                  </div>
                </div>
              ) : null}
            </div>

            <aside className="space-y-5 xl:sticky xl:top-32">
              <SidebarPanel
                icon={<Users size={17} />}
                title={guestbook.sidebar.contributors}
              >
                {data.contributors.length ? (
                  <ol className="space-y-3">
                    {data.contributors.map((person, index) => (
                      <li key={person.id} className="flex items-center gap-3">
                        <span className="w-4 text-xs font-bold text-accent-500">
                          {index + 1}
                        </span>
                        {person.avatar_url ? (
                          <img
                            alt=""
                            src={person.avatar_url}
                            className="size-8 rounded-full"
                          />
                        ) : null}
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                          {person.display_name}
                        </span>
                        <span className="text-xs text-text-secondary">
                          {person.score}
                        </span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm leading-6 text-text-secondary">
                    {guestbook.sidebar.noContributors}
                  </p>
                )}
              </SidebarPanel>
              <SidebarPanel
                icon={<BarChart3 size={17} />}
                title={guestbook.sidebar.statistics}
              >
                <dl className="grid grid-cols-2 gap-4">
                  {(
                    [
                      ["totalVisitors", data.statistics.total_visitors],
                      ["totalComments", data.statistics.total_comments],
                      ["todayVisitors", data.statistics.today_visitors],
                      ["thisWeek", data.statistics.this_week],
                    ] as const
                  ).map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-xs leading-5 text-text-secondary">
                        {guestbook.sidebar[label]}
                      </dt>
                      <dd className="mt-1 font-display text-2xl font-semibold">
                        {value}
                      </dd>
                    </div>
                  ))}
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
              {[
                "spam",
                "harassment",
                "irrelevant",
                "inappropriate",
                "other",
              ].map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
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
            <GuestbookComposer
              compact={Boolean(editTarget.parent_id)}
              initialBody={editTarget.body ?? ""}
              initialType={editTarget.entry_type ?? "reply"}
              initialRating={editTarget.rating}
              participants={participants}
              submitting={submitting}
              onCancel={() => setEditTarget(null)}
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
