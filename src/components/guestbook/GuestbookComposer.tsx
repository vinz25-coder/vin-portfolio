import { ImagePlus, Laugh, Send, Star, X } from "lucide-react";
import { lazy, Suspense, useEffect, useId, useRef, useState } from "react";
import type { Theme } from "emoji-picker-react";

import {
  reviewCategories,
  type EntryType,
  type ReviewCategory,
} from "../../data/guestbook";
import { useLanguage } from "../../hooks/useLanguage";
import { useTheme } from "../../hooks/useTheme";

const EmojiPicker = lazy(() => import("emoji-picker-react"));
const acceptedImages = ["image/jpeg", "image/png", "image/webp"];
const DRAFT_KEY = "guestbook-composer-draft";

interface Draft {
  body: string;
  entryType: "discussion" | "review";
  rating: number | null;
  reviewCategories: ReviewCategory[];
}

function readDraft(): Draft | null {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(DRAFT_KEY) ?? "null",
    );
    if (!value || typeof value !== "object") return null;
    if (!("body" in value) || typeof value.body !== "string") return null;
    if (
      !("entryType" in value) ||
      (value.entryType !== "discussion" && value.entryType !== "review")
    )
      return null;
    const rating = "rating" in value ? value.rating : null;
    if (rating !== null && ![1, 2, 3, 4, 5].includes(Number(rating)))
      return null;
    const rawCategories =
      "reviewCategories" in value && Array.isArray(value.reviewCategories)
        ? value.reviewCategories
        : "reviewCategory" in value
          ? [value.reviewCategory]
          : ["portfolio"];
    const validCategories = reviewCategories.filter((category) =>
      rawCategories.includes(category),
    );
    return {
      body: value.body,
      entryType: value.entryType,
      rating: Number(rating) || null,
      reviewCategories: validCategories.length
        ? validCategories
        : ["portfolio"],
    };
  } catch {
    return null;
  }
}

interface GuestbookComposerProps {
  compact?: boolean;
  replyTo?: string;
  submitting: boolean;
  onCancel?: () => void;
  initialBody?: string;
  initialType?: EntryType;
  initialRating?: number | null;
  initialReviewCategories?: ReviewCategory[] | null;
  existingImageUrl?: string | null;
  hasActiveReview?: boolean;
  activeReviewHidden?: boolean;
  onEditReview?: () => void;
  accountName?: string;
  isAuthor?: boolean;
  onSignOut?: () => void;
  accountControl?: React.ReactNode;
  onSubmit: (input: {
    body: string;
    entryType: EntryType;
    rating: number | null;
    image: File | null;
    reviewCategories: ReviewCategory[] | null;
    removeExistingImage: boolean;
  }) => Promise<boolean>;
}

export function GuestbookComposer({
  compact = false,
  replyTo,
  submitting,
  onCancel,
  initialBody,
  initialType,
  initialRating = null,
  initialReviewCategories,
  existingImageUrl = null,
  hasActiveReview = false,
  activeReviewHidden = false,
  onEditReview,
  accountName,
  isAuthor = false,
  onSignOut,
  accountControl,
  onSubmit,
}: GuestbookComposerProps) {
  const { copy } = useLanguage();
  const { theme } = useTheme();
  const { composer } = copy.guestbook;
  const textareaId = useId();
  const ratingName = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const selectionRef = useRef({ start: 0, end: 0 });
  const isMainCreate = !compact && initialBody === undefined;
  const isEditing = initialBody !== undefined;
  const draft = useRef(isMainCreate ? readDraft() : null).current;
  const [body, setBody] = useState(initialBody ?? draft?.body ?? "");
  const [entryType, setEntryType] = useState<EntryType>(
    initialType ?? draft?.entryType ?? (compact ? "reply" : "discussion"),
  );
  const [rating, setRating] = useState<number | null>(
    initialRating ?? draft?.rating ?? null,
  );
  const [selectedReviewCategories, setSelectedReviewCategories] = useState<
    ReviewCategory[]
  >(initialReviewCategories ?? draft?.reviewCategories ?? ["portfolio"]);
  const [image, setImage] = useState<File | null>(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isMainCreate || entryType === "reply") return;
    try {
      if (!body && rating === null) {
        localStorage.removeItem(DRAFT_KEY);
        return;
      }
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          body,
          entryType,
          rating,
          reviewCategories: selectedReviewCategories,
        } satisfies Draft),
      );
    } catch {
      // Draft persistence is optional when browser storage is unavailable.
    }
  }, [body, entryType, isMainCreate, rating, selectedReviewCategories]);

  useEffect(() => {
    if (!showEmoji) return undefined;
    const close = (event: PointerEvent) => {
      if (popupRef.current?.contains(event.target as Node)) return;
      setShowEmoji(false);
      event.preventDefault();
      textareaRef.current?.focus();
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setShowEmoji(false);
      event.preventDefault();
      event.stopPropagation();
      textareaRef.current?.focus();
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [showEmoji]);

  const submit = async () => {
    if (!body.trim()) return setError(composer.required);
    if (entryType === "review" && !rating)
      return setError(composer.ratingRequired);
    if (entryType === "review" && selectedReviewCategories.length === 0)
      return setError(composer.categoryRequired);
    setError("");
    if (
      await onSubmit({
        body: body.trim(),
        entryType,
        rating: entryType === "review" ? rating : null,
        image,
        reviewCategories:
          entryType === "review" ? selectedReviewCategories : null,
        removeExistingImage,
      })
    ) {
      setBody("");
      setRating(null);
      setImage(null);
      setSelectedReviewCategories(["portfolio"]);
      setRemoveExistingImage(false);
      if (isMainCreate) {
        try {
          localStorage.removeItem(DRAFT_KEY);
        } catch {
          // Publishing still succeeds when browser storage is unavailable.
        }
      }
    }
  };

  return (
    <div
      className={`guestbook-composer rounded-2xl border p-4 sm:p-5 ${compact ? "mt-4" : "mt-8"}`}
    >
      {!compact ? (
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
          <div>
            <h2 className="font-display text-xl font-semibold">
              {entryType === "review"
                ? composer.reviewHeading
                : composer.discussionHeading}
            </h2>
            {accountName ? (
              <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-xs text-text-secondary">
                <span>
                  {composer.postingAs} {accountName}
                </span>
                {isAuthor ? (
                  <span className="font-semibold text-accent-500">
                    · {copy.guestbook.feed.author}
                  </span>
                ) : null}
                {onSignOut ? (
                  <button
                    type="button"
                    className="font-semibold hover:text-accent-500"
                    onClick={onSignOut}
                  >
                    · {composer.signOut}
                  </button>
                ) : null}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-start justify-end gap-2">
            {accountControl}
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
                  disabled={isEditing}
                  className="guestbook-type-button rounded-full px-3 py-2 text-xs font-semibold"
                  onClick={() => {
                    setEntryType(type);
                    if (type === "discussion") setRating(null);
                  }}
                >
                  {type === "discussion"
                    ? composer.discussion
                    : composer.review}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {entryType === "review" ? (
        <fieldset className="mt-4">
          <legend className="text-xs font-semibold text-text-secondary">
            {composer.rate}
          </legend>
          <fieldset className="mt-3">
            <legend className="text-xs font-semibold text-text-secondary">
              {composer.category}
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {reviewCategories.map((category) => {
                const selected = selectedReviewCategories.includes(category);
                return (
                  <label
                    key={category}
                    className="guestbook-category-option cursor-pointer rounded-full border border-border px-3 py-2 text-xs font-semibold text-text-secondary has-[:checked]:border-accent-500 has-[:checked]:bg-accent-500/10 has-[:checked]:text-accent-500 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent-500"
                  >
                    <input
                      type="checkbox"
                      value={category}
                      checked={selected}
                      className="sr-only"
                      onChange={() =>
                        setSelectedReviewCategories((current) =>
                          selected
                            ? current.filter((value) => value !== category)
                            : reviewCategories.filter(
                                (value) =>
                                  current.includes(value) || value === category,
                              ),
                        )
                      }
                    />
                    {copy.guestbook.categories[category]}
                  </label>
                );
              })}
            </div>
          </fieldset>
          <div className="mt-2 flex flex-wrap gap-1" role="radiogroup">
            {[1, 2, 3, 4, 5].map((star) => (
              <label
                key={star}
                className="group flex cursor-pointer flex-col items-center rounded-md p-1 text-[0.625rem] text-text-secondary"
              >
                <input
                  type="radio"
                  name={ratingName}
                  value={star}
                  checked={rating === star}
                  className="sr-only"
                  aria-label={`${star}/5 — ${copy.guestbook.rating.scale[star - 1]}`}
                  onChange={() => setRating(star)}
                />
                <Star
                  size={22}
                  className={`rounded-sm group-has-[:focus-visible]:outline-2 group-has-[:focus-visible]:outline-offset-2 group-has-[:focus-visible]:outline-accent-500 ${
                    star <= (rating ?? 0)
                      ? "fill-accent-500 text-accent-500"
                      : "text-text-secondary"
                  }`}
                />
                <span className="sr-only sm:not-sr-only">
                  {copy.guestbook.rating.scale[star - 1]}
                </span>
              </label>
            ))}
          </div>
          {hasActiveReview && isMainCreate ? (
            <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-border p-3 text-xs text-text-secondary">
              <span>
                {activeReviewHidden
                  ? composer.reviewUnderModeration
                  : composer.existingReview}
              </span>
              {!activeReviewHidden ? (
                <button
                  type="button"
                  className="font-bold text-accent-500"
                  onClick={onEditReview}
                >
                  {composer.editReview}
                </button>
              ) : null}
            </div>
          ) : null}
        </fieldset>
      ) : null}

      {replyTo ? (
        <p className="mt-3 text-xs text-text-secondary">
          {copy.guestbook.feed.replyingTo} {replyTo}
        </p>
      ) : null}
      <label htmlFor={textareaId} className="sr-only">
        {composer.placeholder}
      </label>
      <textarea
        ref={textareaRef}
        id={textareaId}
        value={body}
        maxLength={1000}
        rows={compact ? 3 : 5}
        placeholder={
          entryType === "review"
            ? composer.reviewPlaceholder
            : compact
              ? composer.placeholder
              : composer.discussionPlaceholder
        }
        className="guestbook-textarea mt-4 w-full resize-y rounded-xl border border-border bg-transparent p-3 text-sm leading-relaxed outline-none focus:border-accent-500 focus-visible:ring-2 focus-visible:ring-accent-500/30"
        onChange={(event) => setBody(event.target.value)}
        onSelect={(event) => {
          selectionRef.current = {
            start: event.currentTarget.selectionStart,
            end: event.currentTarget.selectionEnd,
          };
        }}
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
      {existingImageUrl && !image && !removeExistingImage ? (
        <div className="mt-3 flex items-center gap-3 rounded-xl border border-border p-2">
          <img
            src={existingImageUrl}
            alt=""
            className="size-12 rounded-lg object-cover"
          />
          <button
            type="button"
            className="text-xs font-semibold text-text-secondary hover:text-accent-500"
            onClick={() => setRemoveExistingImage(true)}
          >
            {composer.removeExistingImage}
          </button>
        </div>
      ) : null}

      <div className="relative mt-4 flex flex-wrap items-center gap-2">
        <div ref={popupRef}>
          <button
            type="button"
            aria-label={composer.emoji}
            aria-expanded={showEmoji}
            className="guestbook-tool-button"
            onClick={() => {
              if (showEmoji) textareaRef.current?.focus();
              setShowEmoji((value) => !value);
            }}
          >
            <Laugh size={18} />
          </button>
          {showEmoji ? (
            <div
              className="guestbook-emoji-picker absolute bottom-12 left-0 z-10 w-[min(350px,calc(100vw-6rem))] max-w-full"
              role="region"
              aria-label={composer.emoji}
            >
              <Suspense
                fallback={
                  <p
                    role="status"
                    className="rounded-xl border border-border bg-surface p-3 text-xs"
                  >
                    {copy.guestbook.feed.loading}
                  </p>
                }
              >
                <EmojiPicker
                  theme={theme as Theme}
                  width="100%"
                  height="min(400px, 55dvh)"
                  lazyLoadEmojis
                  onEmojiClick={({ emoji }) => {
                    const { start, end } = selectionRef.current;
                    const nextBody =
                      body.slice(0, start) + emoji + body.slice(end);
                    const fits = nextBody.length <= 1000;
                    if (fits) setBody(nextBody);
                    setShowEmoji(false);
                    requestAnimationFrame(() => {
                      textareaRef.current?.focus();
                      const caret = fits ? start + emoji.length : start;
                      textareaRef.current?.setSelectionRange(caret, caret);
                    });
                  }}
                />
              </Suspense>
            </div>
          ) : null}
        </div>
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
          disabled={
            submitting ||
            !body.trim() ||
            (entryType === "review" &&
              (!rating ||
                selectedReviewCategories.length === 0 ||
                (hasActiveReview && isMainCreate)))
          }
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
