import type { Session } from "@supabase/supabase-js";

import { isSupabaseConfigured, supabase } from "../lib/supabase";
export { isSupabaseConfigured } from "../lib/supabase";

export type GuestbookFilter = "all" | "discussions" | "reviews";
export type GuestbookSort = "newest" | "popular" | "highest_rated";
export type EntryType = "discussion" | "review" | "reply";
export const reviewCategories = [
  "portfolio",
  "ui_ux_design",
  "code_quality",
  "communication",
  "collaboration",
  "overall_experience",
] as const;
export type ReviewCategory = (typeof reviewCategories)[number];
export type ReactionType = "thumb" | "dislike";
export type PortfolioReactionType =
  "thumbs_up" | "heart" | "fire" | "clap" | "rocket";
export type ReportReason =
  | "spam"
  | "harassment"
  | "hate"
  | "threat"
  | "illegal"
  | "phishing"
  | "personal_data"
  | "irrelevant"
  | "inappropriate"
  | "other";
export type GuestbookModerationStatus = "visible" | "pending" | "quarantined";
export type ModerationAction =
  | "pin"
  | "unpin"
  | "approve"
  | "hide"
  | "unhide"
  | "delete"
  | "block"
  | "permanent_delete";

export interface GuestbookProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  is_author?: boolean;
}

export interface GuestbookEntry {
  id: string;
  parent_id?: string | null;
  replying_to?: string;
  depth?: number;
  author: GuestbookProfile;
  entry_type?: EntryType;
  body: string | null;
  rating?: number | null;
  review_categories?: ReviewCategory[] | null;
  deletion_source?: "commenter" | "site_author" | null;
  image_path: string | null;
  is_pinned?: boolean;
  is_hidden?: boolean;
  moderation_status?: GuestbookModerationStatus;
  moderation_reasons?: string[];
  is_deleted: boolean;
  reply_count?: number;
  created_at: string;
  updated_at: string;
  reactions: Partial<Record<ReactionType, number>>;
  my_reactions: ReactionType[];
  replies?: GuestbookEntry[];
}

export interface RatingSummary {
  average_rating: number;
  total_reviews: number;
  distribution: Record<string, { count: number; percentage: number }>;
}

export interface GuestbookCommunitySummary {
  total_reviews: number;
  total_discussions: number;
  average_rating: number;
}

export interface GuestbookStatistics {
  total_visitors: number;
  today_visitors: number;
}

export interface PortfolioReactionSummary {
  counts: Record<PortfolioReactionType, number>;
  my_reactions: PortfolioReactionType[];
}

export interface GuestbookData {
  entries: GuestbookEntry[];
  hasMoreEntries: boolean;
  rating: RatingSummary;
  summary: GuestbookCommunitySummary;
  statistics: GuestbookStatistics;
}

const emptyData: GuestbookData = {
  entries: [],
  hasMoreEntries: false,
  rating: {
    average_rating: 0,
    total_reviews: 0,
    distribution: Object.fromEntries(
      [1, 2, 3, 4, 5].map((stars) => [stars, { count: 0, percentage: 0 }]),
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

export const emptyPortfolioReactionSummary: PortfolioReactionSummary = {
  counts: {
    thumbs_up: 0,
    heart: 0,
    fire: 0,
    clap: 0,
    rocket: 0,
  },
  my_reactions: [],
};

function unwrapJson<T>(value: unknown, fallback: T): T {
  return value && typeof value === "object" ? (value as T) : fallback;
}

function unwrapFeed(value: unknown): GuestbookEntry[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((row: unknown) => {
    if (!row || typeof row !== "object" || !("thread" in row)) return [];
    const thread = row.thread as GuestbookEntry;
    const names = new Map<string, string>([
      [thread.id, thread.author.display_name],
    ]);
    for (const reply of thread.replies ?? []) {
      names.set(reply.id, reply.author.display_name);
    }
    return [
      {
        ...thread,
        replies: thread.replies?.map((reply) => ({
          ...reply,
          replying_to: reply.parent_id ? names.get(reply.parent_id) : undefined,
        })),
      },
    ];
  });
}

export function getGuestbookPage(entries: GuestbookEntry[], pageSize: number) {
  return {
    entries: entries.slice(0, pageSize),
    hasMoreEntries: entries.length > pageSize,
  };
}

export async function getGuestbookSession() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function subscribeToGuestbookSession(
  callback: (session: Session | null) => void,
) {
  if (!supabase) return () => undefined;
  const { data } = supabase.auth.onAuthStateChange((_event, session) =>
    callback(session),
  );
  return () => data.subscription.unsubscribe();
}

export async function signInToGuestbook() {
  if (!supabase) throw new Error("NOT_CONFIGURED");
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/guestbook` },
  });
  if (error) throw error;
}

export async function signOutOfGuestbook() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function loadGuestbook(
  filter: GuestbookFilter,
  sort: GuestbookSort,
  limit: number,
): Promise<GuestbookData> {
  if (!supabase) return structuredClone(emptyData);
  const [page, rating, summary, statistics] = await Promise.all([
    loadGuestbookPage(filter, sort, 0, limit),
    supabase.rpc("guestbook_rating_summary"),
    supabase.rpc("guestbook_community_summary"),
    supabase.rpc("guestbook_statistics"),
  ]);
  return {
    entries: page.entries,
    hasMoreEntries: page.hasMoreEntries,
    rating: rating.error
      ? structuredClone(emptyData.rating)
      : unwrapJson(rating.data, emptyData.rating),
    summary: summary.error
      ? structuredClone(emptyData.summary)
      : unwrapJson(summary.data, emptyData.summary),
    statistics: statistics.error
      ? structuredClone(emptyData.statistics)
      : unwrapJson(statistics.data, emptyData.statistics),
  };
}

export async function loadGuestbookPage(
  filter: GuestbookFilter,
  sort: GuestbookSort,
  offset: number,
  pageSize: number,
) {
  if (!supabase) return { entries: [], hasMoreEntries: false };
  const result = await supabase.rpc("guestbook_feed", {
    p_filter: filter,
    p_sort: sort,
    p_limit: pageSize + 1,
    p_offset: offset,
  });
  if (result.error) throw result.error;
  const entries = unwrapFeed(result.data);
  return getGuestbookPage(entries, pageSize);
}

export async function loadPortfolioReactions() {
  if (!supabase) return structuredClone(emptyPortfolioReactionSummary);
  const result = await supabase.rpc("guestbook_portfolio_reaction_summary");
  if (result.error) throw result.error;
  return unwrapJson(result.data, emptyPortfolioReactionSummary);
}

export async function togglePortfolioReaction(reaction: PortfolioReactionType) {
  if (!supabase) throw new Error("NOT_CONFIGURED");
  await ensureGuestbookProfile();
  const result = await supabase.rpc("toggle_guestbook_portfolio_reaction", {
    p_reaction_type: reaction,
  });
  if (result.error) throw result.error;
  return result.data as {
    reaction_type: PortfolioReactionType;
    active: boolean;
    count: number;
  };
}

export async function ensureGuestbookProfile() {
  if (!supabase) throw new Error("NOT_CONFIGURED");
  const result = await supabase.rpc("ensure_guestbook_profile");
  if (result.error) throw result.error;
}

export function parseActiveReview(value: unknown): GuestbookEntry | null {
  if (!value || typeof value !== "object") return null;
  if (!("id" in value) || value.id === null) return null;
  if (
    typeof value.id !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value.id,
    ) ||
    !("author_id" in value) ||
    typeof value.author_id !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value.author_id,
    ) ||
    !("entry_type" in value) ||
    value.entry_type !== "review" ||
    !("body" in value) ||
    typeof value.body !== "string" ||
    !value.body.trim() ||
    !("rating" in value) ||
    !Number.isInteger(value.rating) ||
    Number(value.rating) < 1 ||
    Number(value.rating) > 5 ||
    !("is_hidden" in value) ||
    typeof value.is_hidden !== "boolean" ||
    !("created_at" in value) ||
    typeof value.created_at !== "string" ||
    !("updated_at" in value) ||
    typeof value.updated_at !== "string"
  ) {
    throw new Error("ACTIVE_REVIEW_INVALID");
  }
  const imagePath =
    "image_path" in value && typeof value.image_path === "string"
      ? value.image_path
      : null;
  const moderationStatus =
    "moderation_status" in value &&
    (value.moderation_status === "visible" ||
      value.moderation_status === "pending" ||
      value.moderation_status === "quarantined")
      ? value.moderation_status
      : value.is_hidden
        ? "quarantined"
        : "visible";
  const rawCategories =
    "review_categories" in value
      ? value.review_categories
      : "review_category" in value
        ? [value.review_category]
        : ["portfolio"];
  const reviewCategoriesValue = Array.isArray(rawCategories)
    ? reviewCategories.filter((category) => rawCategories.includes(category))
    : [];
  if (reviewCategoriesValue.length === 0) {
    throw new Error("ACTIVE_REVIEW_INVALID");
  }
  return {
    id: value.id,
    parent_id: null,
    author: {
      id: value.author_id,
      display_name: "",
      avatar_url: null,
    },
    entry_type: "review",
    body: value.body,
    rating: Number(value.rating),
    review_categories: reviewCategoriesValue,
    image_path: imagePath,
    is_hidden: value.is_hidden,
    moderation_status: moderationStatus,
    is_deleted: false,
    created_at: value.created_at,
    updated_at: value.updated_at,
    reactions: {},
    my_reactions: [],
    replies: [],
  };
}

export async function getMyActiveReview() {
  if (!supabase) return null;
  const result = await supabase.rpc("guestbook_my_active_review");
  if (result.error) throw result.error;
  return parseActiveReview(result.data);
}

export async function createGuestbookEntry(input: {
  body: string;
  entryType: EntryType;
  rating: number | null;
  parentId?: string;
  image?: File | null;
  userId: string;
  reviewCategories: ReviewCategory[] | null;
}) {
  if (!supabase) throw new Error("NOT_CONFIGURED");
  await ensureGuestbookProfile();
  let imagePath: string | null = null;
  if (input.image) {
    const extension = input.image.name.split(".").pop()?.toLowerCase() ?? "jpg";
    imagePath = `${input.userId}/${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage
      .from("guestbook-images")
      .upload(imagePath, input.image, { contentType: input.image.type });
    if (error) throw error;
  }
  const createResult = await supabase.rpc("create_guestbook_entry", {
    p_body: input.body,
    p_entry_type: input.entryType,
    p_rating: input.rating,
    p_parent_id: input.parentId ?? null,
    p_image_path: imagePath,
    p_review_categories:
      input.entryType === "review" ? input.reviewCategories : null,
  });
  if (createResult.error) {
    if (imagePath)
      await supabase.storage.from("guestbook-images").remove([imagePath]);
    throw createResult.error;
  }
  const created: unknown = createResult.data;
  const entryId =
    created &&
    typeof created === "object" &&
    "id" in created &&
    typeof created.id === "string"
      ? created.id
      : null;
  const moderationStatus =
    created &&
    typeof created === "object" &&
    "moderation_status" in created &&
    (created.moderation_status === "visible" ||
      created.moderation_status === "pending" ||
      created.moderation_status === "quarantined")
      ? created.moderation_status
      : "visible";
  if (input.parentId && entryId && moderationStatus === "visible") {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (token) {
      await fetch("/api/guestbook/push-reply", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ replyId: entryId }),
      }).catch(() => undefined);
    }
  }
  return { id: entryId, moderationStatus };
}

export async function updateGuestbookEntry(input: {
  entryId: string;
  body: string;
  entryType: EntryType;
  rating: number | null;
  imagePath: string | null;
  image?: File | null;
  removeExistingImage?: boolean;
  userId: string;
  reviewCategories: ReviewCategory[] | null;
}) {
  if (!supabase) throw new Error("NOT_CONFIGURED");
  await ensureGuestbookProfile();
  let nextImagePath = input.removeExistingImage ? null : input.imagePath;
  let uploadedImagePath: string | null = null;
  if (input.image) {
    const extension = input.image.name.split(".").pop()?.toLowerCase() ?? "jpg";
    uploadedImagePath = `${input.userId}/${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage
      .from("guestbook-images")
      .upload(uploadedImagePath, input.image, {
        contentType: input.image.type,
      });
    if (error) throw error;
    nextImagePath = uploadedImagePath;
  }
  const result = await supabase.rpc("update_guestbook_entry", {
    p_entry_id: input.entryId,
    p_body: input.body,
    p_entry_type: input.entryType,
    p_rating: input.rating,
    p_image_path: nextImagePath,
    p_review_categories:
      input.entryType === "review" ? input.reviewCategories : null,
  });
  if (result.error) {
    if (uploadedImagePath)
      await supabase.storage
        .from("guestbook-images")
        .remove([uploadedImagePath]);
    throw result.error;
  }
  if (input.imagePath && input.imagePath !== nextImagePath) {
    await supabase.storage.from("guestbook-images").remove([input.imagePath]);
  }
  const updated: unknown = result.data;
  const moderationStatus =
    updated &&
    typeof updated === "object" &&
    "moderation_status" in updated &&
    (updated.moderation_status === "visible" ||
      updated.moderation_status === "pending" ||
      updated.moderation_status === "quarantined")
      ? updated.moderation_status
      : "visible";
  return { moderationStatus };
}

export async function toggleGuestbookReaction(
  entryId: string,
  reaction: ReactionType,
) {
  if (!supabase) throw new Error("NOT_CONFIGURED");
  await ensureGuestbookProfile();
  const { error } = await supabase.rpc("toggle_guestbook_reaction", {
    p_entry_id: entryId,
    p_reaction_type: reaction,
  });
  if (error) throw error;
}

export async function deleteGuestbookEntry(entryId: string) {
  if (!supabase) throw new Error("NOT_CONFIGURED");
  const response = await supabase.rpc("tombstone_guestbook_entry", {
    p_entry_id: entryId,
  });
  if (response.error) throw response.error;
  const result: unknown = response.data;
  const imagePath =
    result &&
    typeof result === "object" &&
    "image_path" in result &&
    typeof result.image_path === "string"
      ? result.image_path
      : null;
  if (imagePath) {
    await supabase.storage.from("guestbook-images").remove([imagePath]);
  }
}

export async function reportGuestbookEntry(
  entryId: string,
  reason: ReportReason,
  note: string,
) {
  if (!supabase) throw new Error("NOT_CONFIGURED");
  await ensureGuestbookProfile();
  const { error } = await supabase.rpc("report_guestbook_entry", {
    p_entry_id: entryId,
    p_reason: reason,
    p_note: note || null,
  });
  if (error) throw error;
}

export function getGuestbookImageUrl(path: string | null) {
  if (!path || !supabase) return null;
  return supabase.storage.from("guestbook-images").getPublicUrl(path).data
    .publicUrl;
}

export function trackGuestbookVisit() {
  if (!isSupabaseConfigured) return;
  const key = "guestbook-browser-id";
  let browserId = localStorage.getItem(key);
  if (!browserId) {
    browserId = crypto.randomUUID();
    localStorage.setItem(key, browserId);
  }
  void fetch("/api/guestbook/visitor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ browserId }),
  }).catch(() => undefined);
}

export async function getGuestbookOwnerStatus(session: Session | null) {
  if (!session) return false;
  const response = await fetch("/api/guestbook/owner", {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (!response.ok) return false;
  const result: unknown = await response.json();
  return Boolean(
    result &&
    typeof result === "object" &&
    "isOwner" in result &&
    result.isOwner === true,
  );
}

export async function loadHiddenGuestbookEntries(session: Session) {
  const response = await fetch("/api/guestbook/moderate", {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (!response.ok) throw new Error("MODERATION_FAILED");
  const result: unknown = await response.json();
  if (!result || typeof result !== "object" || !("entries" in result)) {
    throw new Error("MODERATION_FAILED");
  }
  return Array.isArray(result.entries)
    ? (result.entries as GuestbookEntry[])
    : [];
}

export async function moderateGuestbookEntry(
  session: Session,
  entryId: string,
  action: ModerationAction,
) {
  const response = await fetch("/api/guestbook/moderate", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ entryId, action }),
  });
  const result: unknown = await response.json().catch(() => null);
  const deletedIds =
    result &&
    typeof result === "object" &&
    "deletedIds" in result &&
    Array.isArray(result.deletedIds)
      ? result.deletedIds.filter((id): id is string => typeof id === "string")
      : [];
  if (!response.ok) {
    const code =
      result &&
      typeof result === "object" &&
      "code" in result &&
      typeof result.code === "string"
        ? result.code
        : "MODERATION_FAILED";
    if (code === "STORAGE_CLEANUP_FAILED")
      throw new GuestbookCleanupError(deletedIds);
    throw new Error(code);
  }
  return deletedIds;
}

export class GuestbookCleanupError extends Error {
  constructor(public readonly deletedIds: string[]) {
    super("STORAGE_CLEANUP_FAILED");
  }
}
