import {
  Edit3,
  Ellipsis,
  Flag,
  MessageCircle,
  Pin,
  Share2,
  Shield,
  Trash2,
} from "lucide-react";
import { useState } from "react";

import type {
  GuestbookEntry as Entry,
  ReactionType,
} from "../../data/guestbook";
import { getGuestbookImageUrl } from "../../data/guestbook";
import { useLanguage } from "../../hooks/useLanguage";

const reactions: { type: ReactionType; emoji: string }[] = [
  { type: "thumb", emoji: "👍" },
  { type: "heart", emoji: "❤️" },
  { type: "fire", emoji: "🔥" },
  { type: "clap", emoji: "👏" },
  { type: "rocket", emoji: "🚀" },
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
  onModerate: (entry: Entry, action: "pin" | "unpin" | "hide") => void;
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
}: GuestbookEntryProps) {
  const { copy, language } = useLanguage();
  const feed = copy.guestbook.feed;
  const [menuOpen, setMenuOpen] = useState(false);
  const imageUrl = getGuestbookImageUrl(entry.image_path);
  const isOwner = Boolean(entry.author.is_author);
  const relativeTime = new Intl.RelativeTimeFormat(language, {
    numeric: "auto",
  });
  const elapsed = Date.now() - new Date(entry.created_at).getTime();
  const hours = Math.max(1, Math.round(elapsed / 3_600_000));

  return (
    <article
      className={`guestbook-entry relative ${entry.depth ? "guestbook-reply ml-5 pl-5 sm:ml-10 sm:pl-7" : "border-b border-border py-7"}`}
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
            <span className="text-xs text-text-secondary">
              {relativeTime.format(-hours, "hour")}
            </span>
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
          </div>
          {entry.rating ? (
            <div
              className="mt-1 text-sm tracking-wider text-accent-500"
              aria-label={`${entry.rating} stars`}
            >
              {"★".repeat(entry.rating)}
              <span className="text-text-secondary/40">
                {"★".repeat(5 - entry.rating)}
              </span>
            </div>
          ) : null}
          <div className="mt-2 text-sm leading-7 text-text-secondary">
            {entry.is_deleted ? <em>{feed.deleted}</em> : entry.body}
          </div>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Guestbook attachment"
              loading="lazy"
              className="mt-3 max-h-80 w-auto max-w-full rounded-xl border border-border object-contain"
            />
          ) : null}
          {!entry.is_deleted ? (
            <div className="mt-4 flex flex-wrap items-center gap-1.5">
              {reactions.map(({ type, emoji }) => (
                <button
                  key={type}
                  type="button"
                  aria-label={type}
                  aria-pressed={entry.my_reactions.includes(type)}
                  data-active={entry.my_reactions.includes(type)}
                  className="guestbook-reaction rounded-full border border-transparent px-2 py-1 text-xs"
                  onClick={() => onReact(entry.id, type)}
                >
                  <span aria-hidden="true">{emoji}</span>{" "}
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
                onClick={() =>
                  void navigator.clipboard?.writeText(
                    `${location.origin}/guestbook#comment-${entry.id}`,
                  )
                }
              >
                <Share2 size={15} />
                {feed.share}
              </button>
              <div className="relative ml-auto">
                <button
                  type="button"
                  aria-label="More actions"
                  aria-expanded={menuOpen}
                  className="guestbook-entry-action px-2"
                  onClick={() => setMenuOpen((value) => !value)}
                >
                  <Ellipsis size={17} />
                </button>
                {menuOpen ? (
                  <div className="absolute right-0 z-10 mt-1 min-w-36 rounded-xl border border-border bg-surface p-1 shadow-xl">
                    {currentUserId === entry.author.id ? (
                      <>
                        <button
                          type="button"
                          className="guestbook-menu-action"
                          onClick={() => onEdit(entry)}
                        >
                          <Edit3 size={14} />
                          {feed.edit}
                        </button>
                        <button
                          type="button"
                          className="guestbook-menu-action"
                          onClick={() => onDelete(entry.id)}
                        >
                          <Trash2 size={14} />
                          {feed.delete}
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="guestbook-menu-action"
                        onClick={() => onReport(entry.id)}
                      >
                        <Flag size={14} />
                        {feed.report}
                      </button>
                    )}
                    {isCurrentUserOwner && !entry.parent_id ? (
                      <button
                        type="button"
                        className="guestbook-menu-action"
                        onClick={() =>
                          onModerate(entry, entry.is_pinned ? "unpin" : "pin")
                        }
                      >
                        <Pin size={14} />
                        {entry.is_pinned ? "Unpin" : "Pin"}
                      </button>
                    ) : null}
                    {isCurrentUserOwner ? (
                      <button
                        type="button"
                        className="guestbook-menu-action"
                        onClick={() => onModerate(entry, "hide")}
                      >
                        <Shield size={14} />
                        Hide
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
      {entry.replies?.map((reply) => (
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
        />
      ))}
    </article>
  );
}
