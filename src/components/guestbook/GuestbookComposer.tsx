import { ImagePlus, Laugh, Send, Star, X } from "lucide-react";
import { useId, useRef, useState } from "react";

import type { EntryType, GuestbookProfile } from "../../data/guestbook";
import { useLanguage } from "../../hooks/useLanguage";

const emojis = ["👍", "❤️", "🔥", "👏", "🚀", "✨", "😊", "💯"];
const acceptedImages = ["image/jpeg", "image/png", "image/webp"];

interface GuestbookComposerProps {
  compact?: boolean;
  replyTo?: string;
  submitting: boolean;
  onCancel?: () => void;
  participants?: GuestbookProfile[];
  initialBody?: string;
  initialType?: EntryType;
  initialRating?: number | null;
  onSubmit: (input: {
    body: string;
    entryType: EntryType;
    rating: number | null;
    image: File | null;
    mentionedUserIds: string[];
  }) => Promise<boolean>;
}

export function GuestbookComposer({
  compact = false,
  replyTo,
  submitting,
  onCancel,
  participants = [],
  initialBody,
  initialType,
  initialRating = null,
  onSubmit,
}: GuestbookComposerProps) {
  const { copy } = useLanguage();
  const { composer } = copy.guestbook;
  const textareaId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [body, setBody] = useState(
    initialBody ?? (replyTo ? `@${replyTo} ` : ""),
  );
  const [entryType, setEntryType] = useState<EntryType>(
    initialType ?? (compact ? "reply" : "discussion"),
  );
  const [rating, setRating] = useState<number | null>(initialRating);
  const [image, setImage] = useState<File | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!body.trim()) return setError(composer.required);
    if (entryType === "review" && !rating)
      return setError(composer.ratingRequired);
    setError("");
    if (
      await onSubmit({
        body: body.trim(),
        entryType,
        rating,
        image,
        mentionedUserIds,
      })
    ) {
      setBody("");
      setRating(null);
      setImage(null);
      setMentionedUserIds([]);
    }
  };

  return (
    <div
      className={`guestbook-composer rounded-2xl border p-4 sm:p-5 ${compact ? "mt-4" : "mt-8"}`}
    >
      {!compact ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <h2 className="font-display text-xl font-semibold">
            {composer.heading}
          </h2>
          <div
            className="flex rounded-full border border-border p-1"
            role="group"
            aria-label={composer.heading}
          >
            {(["discussion", "review"] as const).map((type) => (
              <button
                key={type}
                type="button"
                data-active={entryType === type}
                className="guestbook-type-button rounded-full px-3 py-2 text-xs font-semibold"
                onClick={() => {
                  setEntryType(type);
                  if (type === "discussion") setRating(null);
                }}
              >
                {type === "discussion" ? composer.discussion : composer.review}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {entryType === "review" ? (
        <fieldset className="mt-4">
          <legend className="text-xs font-semibold text-text-secondary">
            {composer.rate}
          </legend>
          <div className="mt-2 flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                aria-label={`${star} star`}
                aria-pressed={rating === star}
                className="rounded-md p-1 focus-visible:outline-2 focus-visible:outline-accent-500"
                onClick={() => setRating(star)}
              >
                <Star
                  size={22}
                  className={
                    star <= (rating ?? 0)
                      ? "fill-accent-500 text-accent-500"
                      : "text-text-secondary"
                  }
                />
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}

      <label htmlFor={textareaId} className="sr-only">
        {composer.placeholder}
      </label>
      <textarea
        id={textareaId}
        value={body}
        maxLength={1000}
        rows={compact ? 3 : 5}
        placeholder={composer.placeholder}
        className="guestbook-textarea mt-4 w-full resize-y rounded-xl border border-border bg-transparent p-3 text-sm leading-relaxed outline-none focus:border-accent-500 focus-visible:ring-2 focus-visible:ring-accent-500/30"
        onChange={(event) => setBody(event.target.value)}
      />
      <div className="mt-2 flex justify-between text-xs text-text-secondary">
        <span role="alert">{error}</span>
        <span>{body.length}/1000</span>
      </div>

      {image ? (
        <div className="mt-3 flex items-center justify-between rounded-xl border border-border px-3 py-2 text-xs">
          <span className="truncate">{image.name}</span>
          <button
            type="button"
            aria-label={composer.removeImage}
            onClick={() => setImage(null)}
          >
            <X size={16} />
          </button>
        </div>
      ) : null}

      <div className="relative mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-label={composer.emoji}
          aria-expanded={showEmoji}
          className="guestbook-tool-button"
          onClick={() => setShowEmoji((value) => !value)}
        >
          <Laugh size={18} />
        </button>
        {showEmoji ? (
          <div className="absolute bottom-12 left-0 z-10 flex flex-wrap gap-1 rounded-xl border border-border bg-surface p-2 shadow-xl">
            {emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className="rounded-md p-2 text-lg hover:bg-accent-500/10"
                onClick={() => {
                  setBody((value) => `${value}${emoji}`);
                  setShowEmoji(false);
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        ) : null}
        <input
          ref={fileRef}
          type="file"
          accept={acceptedImages.join(",")}
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            if (
              file &&
              (!acceptedImages.includes(file.type) ||
                file.size > 5 * 1024 * 1024)
            ) {
              setError(composer.imageInvalid);
              event.target.value = "";
              return;
            }
            setError("");
            setImage(file);
          }}
        />
        <button
          type="button"
          aria-label={composer.image}
          className="guestbook-tool-button"
          onClick={() => fileRef.current?.click()}
        >
          <ImagePlus size={18} />
        </button>
        {participants.length ? (
          <button
            type="button"
            aria-label="Mention someone"
            aria-expanded={showMentions}
            className="guestbook-tool-button text-sm font-bold"
            onClick={() => setShowMentions((value) => !value)}
          >
            @
          </button>
        ) : null}
        {showMentions ? (
          <div className="absolute bottom-12 left-24 z-10 max-h-48 min-w-52 overflow-y-auto rounded-xl border border-border bg-surface p-1 shadow-xl">
            {participants.map((person) => (
              <button
                key={person.id}
                type="button"
                className="guestbook-menu-action"
                onClick={() => {
                  setBody((value) => `${value}@${person.display_name} `);
                  setMentionedUserIds((value) =>
                    value.includes(person.id) ? value : [...value, person.id],
                  );
                  setShowMentions(false);
                }}
              >
                {person.display_name}
              </button>
            ))}
          </div>
        ) : null}
        {onCancel ? (
          <button
            type="button"
            className="ml-auto px-3 py-2 text-xs font-semibold text-text-secondary"
            onClick={onCancel}
          >
            {copy.guestbook.feed.cancel}
          </button>
        ) : (
          <span className="ml-auto" />
        )}
        <button
          type="button"
          disabled={submitting}
          className="guestbook-submit flex min-h-11 items-center gap-2 rounded-xl bg-accent-500 px-4 text-sm font-bold text-accent-ink disabled:opacity-60"
          onClick={() => void submit()}
        >
          <Send size={16} />
          {submitting
            ? composer.posting
            : compact
              ? copy.guestbook.feed.reply
              : composer.post}
        </button>
      </div>
    </div>
  );
}
