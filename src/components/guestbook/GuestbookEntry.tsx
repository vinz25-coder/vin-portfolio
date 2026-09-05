import {
  Edit3,
  Ellipsis,
  Flag,
  ThumbsDown,
  ThumbsUp,
  MessageCircle,
  Pin,
  Share2,
  Shield,
  Trash2,
} from "lucide-react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";

import type {
  GuestbookEntry as Entry,
  ModerationAction,
  ReactionType,
} from "../../data/guestbook";
import { getGuestbookImageUrl } from "../../data/guestbook";
import { useLanguage } from "../../hooks/useLanguage";

const reactions: {
  type: ReactionType;
  label: "like" | "dislike";
  Icon: typeof ThumbsUp;
}[] = [
  { type: "thumb", label: "like", Icon: ThumbsUp },
  { type: "dislike", label: "dislike", Icon: ThumbsDown },
];

interface GuestbookEntryProps {
  entry: Entry;
  currentUserId?: string;
  isCurrentUserOwner: boolean;
  onReply: (entry: Entry) => void;
  onReact: (entryId: string, reaction: ReactionType) => void;
  onDelete: (entryId: string) => void;
  onEdit: (entry: Entry) => void;
  onReport: (entryId: string) => void;
  onModerate: (entry: Entry, action: ModerationAction) => void;
  moderationView?: boolean;
  moderationDisabled?: boolean;
  moderationPendingId?: string | null;
}

export function GuestbookEntry({
  entry,
  currentUserId,
  isCurrentUserOwner,
  onReply,
  onReact,
  onDelete,
  onEdit,
  onReport,
  onModerate,
  moderationView = false,
  moderationDisabled = false,
  moderationPendingId = null,
}: GuestbookEntryProps) {
  const { copy, language } = useLanguage();
  const feed = copy.guestbook.feed;
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuOpensUp, setMenuOpensUp] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [visibleReplyCount, setVisibleReplyCount] = useState(3);
  const repliesId = useId();
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuPanelRef = useRef<HTMLDivElement>(null);
  const imageUrl = getGuestbookImageUrl(entry.image_path);
  const isOwner = Boolean(entry.author.is_author);
  const moderationPending = moderationPendingId === entry.id;
  const relativeTime = new Intl.RelativeTimeFormat(language, {
    numeric: "auto",
  });
  const elapsed = Date.now() - new Date(entry.created_at).getTime();
  const hours = Math.max(1, Math.round(elapsed / 3_600_000));
  const createdDate = new Date(entry.created_at);
  const displayTime =
    hours >= 24 * 7
      ? new Intl.DateTimeFormat(language, { dateStyle: "medium" }).format(
          createdDate,
        )
      : relativeTime.format(-hours, "hour");

  useEffect(() => {
    if (window.location.hash !== `#comment-${entry.id}`) return;
    const target = document.getElementById(`comment-${entry.id}`);
    target?.scrollIntoView({ block: "center" });
    target?.focus({ preventScroll: true });
  }, [entry.id]);

  useEffect(() => {
    const targetId = window.location.hash.replace("#comment-", "");
    const targetIndex = entry.replies?.findIndex(
      (reply) => reply.id === targetId,
    );
    if (targetIndex !== undefined && targetIndex >= 3) {
      setVisibleReplyCount(targetIndex + 1);
    }
  }, [entry.replies]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    menuRef.current
      ?.querySelector<HTMLButtonElement>('[role="menuitem"]')
      ?.focus();
    const closeMenu = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      menuButtonRef.current?.focus();
    };
    document.addEventListener("pointerdown", closeMenu);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeMenu);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  useLayoutEffect(() => {
    if (!menuOpen) return;
    const trigger = menuButtonRef.current?.getBoundingClientRect();
    const panel = menuPanelRef.current?.getBoundingClientRect();
    if (!trigger || !panel) return;

    const visualViewport = window.visualViewport;
    const viewportTop = visualViewport?.offsetTop ?? 0;
    const viewportBottom =
      viewportTop + (visualViewport?.height ?? window.innerHeight);
    const footerTop = document
      .querySelector("footer")
      ?.getBoundingClientRect().top;
    const lowerBoundary =
      footerTop !== undefined && footerTop > trigger.bottom
        ? Math.min(viewportBottom, footerTop)
        : viewportBottom;
    const spaceBelow = lowerBoundary - trigger.bottom;
    const spaceAbove = trigger.top - viewportTop;

    setMenuOpensUp(spaceBelow < panel.height + 4 && spaceAbove > spaceBelow);
  }, [menuOpen]);

  const runMenuAction = (action: () => void) => {
    setMenuOpen(false);
    action();
  };

  const moveMenuFocus = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const items = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>(
        '[role="menuitem"]',
      ),
    );
    const currentIndex = items.indexOf(
      document.activeElement as HTMLButtonElement,
    );
    const offset = event.key === "ArrowDown" ? 1 : -1;
    const nextIndex = (currentIndex + offset + items.length) % items.length;
    event.preventDefault();
    items[nextIndex]?.focus();
  };

  return (
    <article
      id={`comment-${entry.id}`}
      tabIndex={-1}
      aria-busy={moderationPending || undefined}
      className={`guestbook-entry relative ${menuOpen ? "z-20" : ""} ${moderationPending ? "opacity-60" : ""} ${entry.depth ? "guestbook-reply ml-5 pl-5 sm:ml-10 sm:pl-7" : "border-b border-border py-7"}`}
    >
      <div className="flex gap-3">
        {entry.author.avatar_url ? (
          <img
            src={entry.author.avatar_url}
            alt=""
            referrerPolicy="no-referrer"
            className="size-10 shrink-0 rounded-full object-cover sm:size-11"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-500/15 font-bold text-accent-500"
          >
            {entry.author.display_name.charAt(0)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="font-display text-sm font-semibold sm:text-base">
              {entry.author.display_name}
            </h3>
            {isOwner ? (
              <span className="rounded-md border border-accent-500/40 px-1.5 py-0.5 text-[0.6rem] font-bold tracking-wider text-accent-500 uppercase">
                {feed.author}
              </span>
            ) : null}
            <time
              dateTime={entry.created_at}
              title={new Intl.DateTimeFormat(language, {
                dateStyle: "full",
                timeStyle: "short",
              }).format(createdDate)}
              className="text-xs text-text-secondary"
            >
              {displayTime}
            </time>
            {entry.updated_at !== entry.created_at ? (
              <span className="text-[0.65rem] text-text-secondary">
                · {feed.edited}
              </span>
            ) : null}
            {entry.is_pinned ? (
              <span className="ml-auto flex items-center gap-1 text-xs font-semibold text-accent-500">
                <Pin size={13} />
                {feed.pinned}
              </span>
            ) : null}
            {entry.moderation_status === "pending" ? (
              <span className="ml-auto flex items-center gap-1 text-xs font-semibold text-accent-500">
                <Shield size={13} />
                {feed.pending}
              </span>
            ) : entry.moderation_status === "quarantined" ? (
              <span className="ml-auto flex items-center gap-1 text-xs font-semibold text-accent-500">
                <Shield size={13} />
                {feed.quarantined}
              </span>
            ) : entry.is_hidden ? (
              <span className="ml-auto flex items-center gap-1 text-xs font-semibold text-accent-500">
                <Shield size={13} />
                {feed.hidden}
              </span>
            ) : null}
          </div>
          {!entry.is_deleted && entry.rating ? (
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {(entry.review_categories ?? ["portfolio"]).map((category) => (
                <span
                  key={category}
                  className="text-[0.625rem] font-bold tracking-wider text-text-secondary uppercase"
                >
                  {copy.guestbook.categories[category]}
                </span>
              ))}
              <span
                className="text-sm tracking-wider text-accent-500"
                aria-label={`${entry.rating}/5`}
              >
                {"★".repeat(entry.rating)}
                <span className="text-text-secondary/40">
                  {"★".repeat(5 - entry.rating)}
                </span>
              </span>
            </div>
          ) : null}
          <div className="mt-2 text-sm leading-7 text-text-secondary">
            {entry.is_deleted ? (
              <em>
                {entry.deletion_source === "site_author"
                  ? feed.removedByAuthor
                  : feed.deleted}
              </em>
            ) : (
              entry.body
            )}
          </div>
          {!entry.is_deleted && entry.replying_to ? (
            <p className="mt-1 text-xs text-text-secondary">
              {feed.replyingTo} @{entry.replying_to}
            </p>
          ) : null}
          {!entry.is_deleted && imageUrl ? (
            <img
              src={imageUrl}
              alt="Guestbook attachment"
              loading="lazy"
              className="mt-3 max-h-80 w-auto max-w-full rounded-xl border border-border object-contain"
            />
          ) : null}
          {(!entry.is_deleted && !moderationView) || isCurrentUserOwner ? (
            <div className="mt-4 flex flex-wrap items-center gap-1.5">
              {!entry.is_deleted && !moderationView ? (
                <>
                  {reactions.map(({ type, label, Icon }) => (
                    <button
                      key={type}
                      type="button"
                      aria-label={feed[label]}
                      aria-pressed={entry.my_reactions.includes(type)}
                      data-active={entry.my_reactions.includes(type)}
                      className="guestbook-reaction rounded-full border border-transparent px-2 py-1 text-xs"
                      onClick={() => onReact(entry.id, type)}
                    >
                      <Icon size={14} aria-hidden="true" />
                      {entry.reactions[type] ?? 0}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="guestbook-entry-action"
                    onClick={() => onReply(entry)}
                  >
                    <MessageCircle size={15} />
                    {feed.reply}
                  </button>
                  <button
                    type="button"
                    className="guestbook-entry-action"
                    onClick={() => {
                      const url = `${location.origin}/guestbook#comment-${entry.id}`;
                      void navigator.clipboard
                        ?.writeText(url)
                        .then(() => {
                          history.replaceState(
                            null,
                            "",
                            `#comment-${entry.id}`,
                          );
                          setLinkCopied(true);
                          window.setTimeout(() => setLinkCopied(false), 2000);
                        })
                        .catch(() => undefined);
                    }}
                  >
                    <Share2 size={15} />
                    {linkCopied ? feed.linkCopied : feed.share}
                  </button>
                  {!entry.depth && entry.reply_count ? (
                    <span className="text-xs text-text-secondary">
                      {entry.reply_count} {feed.replies}
                    </span>
                  ) : null}
                </>
              ) : null}
              <div ref={menuRef} className="relative ml-auto">
                <button
                  ref={menuButtonRef}
                  type="button"
                  aria-label={feed.moreActions}
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  className="guestbook-entry-action px-2"
                  onClick={() => {
                    setMenuOpen((value) => !value);
                  }}
                >
                  <Ellipsis size={17} />
                </button>
                {menuOpen ? (
                  <div
                    ref={menuPanelRef}
                    role="menu"
                    tabIndex={-1}
                    onKeyDown={moveMenuFocus}
                    className={`absolute right-0 z-30 min-w-40 rounded-xl border border-border bg-surface p-1 shadow-xl ${menuOpensUp ? "bottom-full mb-1" : "top-full mt-1"}`}
                  >
                    {!entry.is_deleted && !moderationView ? (
                      <>
                        {currentUserId === entry.author.id ? (
                          <>
                            <button
                              type="button"
                              className="guestbook-menu-action"
                              role="menuitem"
                              onClick={() => runMenuAction(() => onEdit(entry))}
                            >
                              <Edit3 size={14} />
                              {feed.edit}
                            </button>
                            {!isCurrentUserOwner ? (
                              <button
                                type="button"
                                className="guestbook-menu-action"
                                role="menuitem"
                                onClick={() =>
                                  runMenuAction(() => onDelete(entry.id))
                                }
                              >
                                <Trash2 size={14} />
                                {feed.delete}
                              </button>
                            ) : null}
                          </>
                        ) : (
                          <button
                            type="button"
                            className="guestbook-menu-action"
                            role="menuitem"
                            onClick={() =>
                              runMenuAction(() => onReport(entry.id))
                            }
                          >
                            <Flag size={14} />
                            {feed.report}
                          </button>
                        )}
                        {isCurrentUserOwner && !entry.parent_id ? (
                          <button
                            type="button"
                            disabled={moderationDisabled}
                            className="guestbook-menu-action"
                            role="menuitem"
                            onClick={() =>
                              runMenuAction(() =>
                                onModerate(
                                  entry,
                                  entry.is_pinned ? "unpin" : "pin",
                                ),
                              )
                            }
                          >
                            <Pin size={14} />
                            {entry.is_pinned ? feed.unpin : feed.pin}
                          </button>
                        ) : null}
                        {isCurrentUserOwner ? (
                          <button
                            type="button"
                            disabled={moderationDisabled}
                            className="guestbook-menu-action"
                            role="menuitem"
                            onClick={() =>
                              runMenuAction(() => onModerate(entry, "hide"))
                            }
                          >
                            <Shield size={14} />
                            {feed.hide}
                          </button>
                        ) : null}
                        {isCurrentUserOwner && !isOwner ? (
                          <button
                            type="button"
                            disabled={moderationDisabled}
                            className="guestbook-menu-action"
                            role="menuitem"
                            onClick={() =>
                              runMenuAction(() => onModerate(entry, "block"))
                            }
                          >
                            <Shield size={14} />
                            {feed.blockUser}
                          </button>
                        ) : null}
                      </>
                    ) : null}
                    {isCurrentUserOwner ? (
                      <button
                        type="button"
                        disabled={moderationDisabled}
                        className="guestbook-menu-action"
                        role="menuitem"
                        onClick={() =>
                          runMenuAction(() =>
                            onModerate(entry, "permanent_delete"),
                          )
                        }
                      >
                        <Trash2 size={14} />
                        {feed.permanentDelete}
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
          {!entry.is_deleted && moderationView && isCurrentUserOwner ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={moderationDisabled}
                className="guestbook-entry-action border border-border"
                onClick={() => onModerate(entry, "approve")}
              >
                <Shield size={15} />
                {feed.approve}
              </button>
              {entry.moderation_status === "pending" ? (
                <button
                  type="button"
                  disabled={moderationDisabled}
                  className="guestbook-entry-action border border-border"
                  onClick={() => onModerate(entry, "hide")}
                >
                  <Shield size={15} />
                  {feed.hide}
                </button>
              ) : null}
              {!isOwner ? (
                <button
                  type="button"
                  disabled={moderationDisabled}
                  className="guestbook-entry-action border border-border"
                  onClick={() => onModerate(entry, "block")}
                >
                  <Shield size={15} />
                  {feed.blockUser}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
      <div id={repliesId}>
        {entry.replies?.slice(0, visibleReplyCount).map((reply) => (
          <GuestbookEntry
            key={reply.id}
            entry={reply}
            currentUserId={currentUserId}
            isCurrentUserOwner={isCurrentUserOwner}
            onReply={onReply}
            onReact={onReact}
            onDelete={onDelete}
            onEdit={onEdit}
            onReport={onReport}
            onModerate={onModerate}
            moderationView={moderationView}
            moderationDisabled={moderationDisabled}
            moderationPendingId={moderationPendingId}
          />
        ))}
      </div>
      {(entry.replies?.length ?? 0) > visibleReplyCount ? (
        <button
          type="button"
          aria-controls={repliesId}
          aria-expanded={visibleReplyCount > 3}
          className="mt-3 ml-5 text-xs font-semibold text-accent-500 hover:underline sm:ml-10"
          onClick={() => setVisibleReplyCount((count) => count + 3)}
        >
          {feed.viewMoreReplies} (
          {Math.min(3, (entry.replies?.length ?? 0) - visibleReplyCount)})
        </button>
      ) : null}
    </article>
  );
}
