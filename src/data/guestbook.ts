import type { Session } from "@supabase/supabase-js";

import { isSupabaseConfigured, supabase } from "../lib/supabase";
export { isSupabaseConfigured } from "../lib/supabase";

export type GuestbookFilter = "all" | "discussions" | "reviews";
export type GuestbookSort = "newest" | "popular" | "highest_rated";
export type EntryType = "discussion" | "review" | "reply";
export type ReactionType = "thumb" | "heart" | "fire" | "clap" | "rocket";
export type ReportReason =
  "spam" | "harassment" | "irrelevant" | "inappropriate" | "other";

export interface GuestbookProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  is_author?: boolean;
}

export interface GuestbookEntry {
  id: string;
  parent_id?: string | null;
  depth?: number;
  author: GuestbookProfile;
  entry_type?: EntryType;
  body: string | null;
  rating?: number | null;
  image_path: string | null;
  is_pinned?: boolean;
  is_deleted: boolean;
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

export interface GuestbookStatistics {
  total_visitors: number;
  total_comments: number;
  today_visitors: number;
  this_week: number;
}

export interface Contributor extends GuestbookProfile {
  score: number;
  entry_count: number;
  reactions_received: number;
}

export interface GuestbookData {
  entries: GuestbookEntry[];
  rating: RatingSummary;
  statistics: GuestbookStatistics;
  contributors: Contributor[];
}

const emptyData: GuestbookData = {
  entries: [],
  rating: {
    average_rating: 0,
    total_reviews: 0,
    distribution: Object.fromEntries(
      [1, 2, 3, 4, 5].map((stars) => [stars, { count: 0, percentage: 0 }]),
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

function unwrapJson<T>(value: unknown, fallback: T): T {
  return value && typeof value === "object" ? (value as T) : fallback;
}

function unwrapFeed(value: unknown): GuestbookEntry[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((row: unknown) => {
    if (!row || typeof row !== "object" || !("thread" in row)) return [];
    return [row.thread as GuestbookEntry];
  });
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
  const [feed, rating, statistics, contributors] = await Promise.all([
    supabase.rpc("guestbook_feed", {
      p_filter: filter,
      p_sort: sort,
      p_limit: limit,
      p_offset: 0,
    }),
    supabase.rpc("guestbook_rating_summary"),
    supabase.rpc("guestbook_statistics"),
    supabase.rpc("guestbook_top_contributors", { p_limit: 5 }),
  ]);
  const error =
    feed.error ?? rating.error ?? statistics.error ?? contributors.error;
  if (error) throw error;

  return {
    entries: unwrapFeed(feed.data),
    rating: unwrapJson(rating.data, emptyData.rating),
    statistics: unwrapJson(statistics.data, emptyData.statistics),
    contributors: (contributors.data ?? []) as Contributor[],
  };
}

export async function createGuestbookEntry(input: {
  body: string;
  entryType: EntryType;
  rating: number | null;
  parentId?: string;
  image?: File | null;
  userId: string;
  mentionedUserIds?: string[];
}) {
  if (!supabase) throw new Error("NOT_CONFIGURED");
  let imagePath: string | null = null;
  if (input.image) {
    const extension = input.image.name.split(".").pop()?.toLowerCase() ?? "jpg";
    imagePath = `${input.userId}/${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage
      .from("guestbook-images")
      .upload(imagePath, input.image, { contentType: input.image.type });
    if (error) throw error;
  }
  const { error } = await supabase.rpc("create_guestbook_entry", {
    p_body: input.body,
    p_entry_type: input.entryType,
    p_rating: input.rating,
    p_parent_id: input.parentId ?? null,
    p_image_path: imagePath,
    p_mentioned_user_ids: input.mentionedUserIds ?? [],
  });
  if (error) {
    if (imagePath)
      await supabase.storage.from("guestbook-images").remove([imagePath]);
    throw error;
  }
}

export async function updateGuestbookEntry(input: {
  entryId: string;
  body: string;
  entryType: EntryType;
  rating: number | null;
  imagePath: string | null;
  mentionedUserIds?: string[];
}) {
  if (!supabase) throw new Error("NOT_CONFIGURED");
  const { error } = await supabase.rpc("update_guestbook_entry", {
    p_entry_id: input.entryId,
    p_body: input.body,
    p_entry_type: input.entryType,
    p_rating: input.rating,
    p_image_path: input.imagePath,
    p_mentioned_user_ids: input.mentionedUserIds ?? [],
  });
  if (error) throw error;
}

export async function toggleGuestbookReaction(
  entryId: string,
  reaction: ReactionType,
) {
  if (!supabase) throw new Error("NOT_CONFIGURED");
  const { error } = await supabase.rpc("toggle_guestbook_reaction", {
    p_entry_id: entryId,
    p_reaction_type: reaction,
  });
  if (error) throw error;
}

export async function deleteGuestbookEntry(entryId: string) {
  if (!supabase) throw new Error("NOT_CONFIGURED");
  const { error } = await supabase.rpc("tombstone_guestbook_entry", {
    p_entry_id: entryId,
  });
  if (error) throw error;
}

export async function reportGuestbookEntry(
  entryId: string,
  reason: ReportReason,
  note: string,
) {
  if (!supabase) throw new Error("NOT_CONFIGURED");
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
  return response.ok;
}

export async function moderateGuestbookEntry(
  session: Session,
  entryId: string,
  action: "pin" | "unpin" | "hide" | "unhide" | "delete",
) {
  const response = await fetch("/api/guestbook/moderate", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ entryId, action }),
  });
  if (!response.ok) throw new Error("MODERATION_FAILED");
}
