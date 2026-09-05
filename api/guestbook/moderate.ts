import { createClient } from "@supabase/supabase-js";

interface ModerationRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
}

interface ModerationResponse {
  setHeader: (name: string, value: string) => void;
  status: (statusCode: number) => ModerationResponse;
  json: (body: unknown) => ModerationResponse;
}

const MAX_BODY_BYTES = 4_096;
const actions = new Set([
  "pin",
  "unpin",
  "approve",
  "hide",
  "unhide",
  "delete",
  "block",
  "permanent_delete",
] as const);
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ModerationAction =
  | "pin"
  | "unpin"
  | "approve"
  | "hide"
  | "unhide"
  | "delete"
  | "block"
  | "permanent_delete";

interface ModerationPayload {
  action: ModerationAction;
  entryId: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readHeader(
  headers: ModerationRequest["headers"],
  name: string,
): string | undefined {
  const entry = Object.entries(headers).find(
    ([headerName]) => headerName.toLowerCase() === name,
  );
  return typeof entry?.[1] === "string" ? entry[1] : undefined;
}

function isJsonRequest(headers: ModerationRequest["headers"]): boolean {
  return (
    readHeader(headers, "content-type")
      ?.split(";", 1)[0]
      ?.trim()
      .toLowerCase() === "application/json"
  );
}

function isBodyTooLarge(headers: ModerationRequest["headers"]): boolean {
  const value = readHeader(headers, "content-length");
  if (value === undefined) return false;

  const contentLength = Number(value);
  return (
    !Number.isSafeInteger(contentLength) ||
    contentLength < 0 ||
    contentLength > MAX_BODY_BYTES
  );
}

function readBearerToken(headers: ModerationRequest["headers"]): string | null {
  const authorization = readHeader(headers, "authorization");
  const match = authorization?.match(/^Bearer ([^\s]+)$/i);
  return match?.[1] ?? null;
}

export function parseModerationPayload(
  body: unknown,
): ModerationPayload | null {
  if (
    !isRecord(body) ||
    typeof body.action !== "string" ||
    !actions.has(body.action as ModerationAction) ||
    typeof body.entryId !== "string"
  ) {
    return null;
  }

  const entryId = body.entryId.trim();
  return uuidPattern.test(entryId)
    ? { action: body.action as ModerationAction, entryId }
    : null;
}

export default async function handler(
  request: ModerationRequest,
  response: ModerationResponse,
) {
  if (request.method !== "GET" && request.method !== "POST") {
    response.setHeader("Allow", "GET, POST");
    return response
      .status(405)
      .json({ success: false, code: "METHOD_NOT_ALLOWED" });
  }

  if (request.method === "POST" && !isJsonRequest(request.headers)) {
    return response
      .status(415)
      .json({ success: false, code: "UNSUPPORTED_MEDIA_TYPE" });
  }

  if (request.method === "POST" && isBodyTooLarge(request.headers)) {
    return response
      .status(413)
      .json({ success: false, code: "PAYLOAD_TOO_LARGE" });
  }

  const payload =
    request.method === "POST" ? parseModerationPayload(request.body) : null;
  if (request.method === "POST" && !payload) {
    return response
      .status(400)
      .json({ success: false, code: "VALIDATION_ERROR" });
  }

  const accessToken = readBearerToken(request.headers);
  if (!accessToken) {
    return response.status(401).json({ success: false, code: "UNAUTHORIZED" });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const ownerIds = new Set(
    (process.env.GUESTBOOK_OWNER_USER_IDS ?? "")
      .split(",")
      .map((id) => id.trim().toLowerCase())
      .filter((id) => uuidPattern.test(id)),
  );
  if (!supabaseUrl || !serviceRoleKey || ownerIds.size === 0) {
    return response
      .status(503)
      .json({ success: false, code: "SERVICE_UNAVAILABLE" });
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return response
        .status(401)
        .json({ success: false, code: "UNAUTHORIZED" });
    }

    if (!ownerIds.has(user.id.toLowerCase())) {
      return response.status(403).json({ success: false, code: "FORBIDDEN" });
    }

    if (request.method === "GET") {
      const { data, error } = await supabase
        .from("guestbook_entries")
        .select(
          "id,parent_id,depth,entry_type,body,rating,review_categories,deletion_source,image_path,is_pinned,is_hidden,moderation_status,moderation_reasons,deleted_at,created_at,updated_at,author:profiles!guestbook_entries_author_id_fkey(id,display_name,avatar_url,is_author)",
        )
        .or("moderation_status.neq.visible,deleted_at.not.is.null")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw new Error("Guestbook moderation read failed");
      const entries = (data ?? []).map((entry) => ({
        ...entry,
        body:
          entry.deleted_at || typeof entry.body !== "string"
            ? null
            : String(entry.body),
        rating:
          entry.deleted_at || typeof entry.rating !== "number"
            ? null
            : Number(entry.rating),
        image_path:
          entry.deleted_at || typeof entry.image_path !== "string"
            ? null
            : String(entry.image_path),
        is_deleted: Boolean(entry.deleted_at),
        reactions: {},
        my_reactions: [],
        replies: [],
      }));
      return response.status(200).json({ success: true, entries });
    }

    if (!payload) {
      return response
        .status(400)
        .json({ success: false, code: "VALIDATION_ERROR" });
    }

    if (payload.action === "permanent_delete") {
      const result = await supabase.rpc(
        "permanently_delete_guestbook_subtree",
        { p_entry_id: payload.entryId },
      );
      const data: unknown = result.data;
      const error = result.error;
      if (error) {
        if (error.code === "P0002")
          return response
            .status(404)
            .json({ success: false, code: "ENTRY_NOT_FOUND" });
        throw new Error("Guestbook permanent deletion failed");
      }
      const paths =
        isRecord(data) && Array.isArray(data.image_paths)
          ? data.image_paths.filter(
              (path): path is string => typeof path === "string",
            )
          : [];
      const deletedIds =
        isRecord(data) && Array.isArray(data.deleted_ids)
          ? data.deleted_ids.filter(
              (id): id is string => typeof id === "string",
            )
          : [];
      try {
        for (let offset = 0; offset < paths.length; offset += 100) {
          const result = await supabase.storage
            .from("guestbook-images")
            .remove(paths.slice(offset, offset + 100));
          if (result.error) throw result.error;
        }
      } catch {
        return response.status(502).json({
          success: false,
          deleted: true,
          code: "STORAGE_CLEANUP_FAILED",
          imagePaths: paths,
          deletedIds,
        });
      }
      return response
        .status(200)
        .json({ success: true, deleted: true, deletedIds });
    }

    if (payload.action === "pin") {
      const { count, error } = await supabase
        .from("guestbook_entries")
        .select("id", { count: "exact", head: true })
        .eq("is_pinned", true)
        .is("deleted_at", null)
        .neq("id", payload.entryId);
      if (error) throw new Error("Guestbook pin count failed");
      if ((count ?? 0) >= 3) {
        return response
          .status(409)
          .json({ success: false, code: "PIN_LIMIT_REACHED" });
      }
    }

    let deletedImagePath: string | null = null;
    let targetAuthorId: string | null = null;
    if (payload.action === "delete" || payload.action === "block") {
      const { data: existingEntry, error } = await supabase
        .from("guestbook_entries")
        .select("author_id,image_path")
        .eq("id", payload.entryId)
        .maybeSingle();
      if (error) throw new Error("Guestbook moderation lookup failed");
      if (!existingEntry) {
        return response
          .status(404)
          .json({ success: false, code: "ENTRY_NOT_FOUND" });
      }
      deletedImagePath =
        typeof existingEntry.image_path === "string"
          ? existingEntry.image_path
          : null;
      targetAuthorId =
        typeof existingEntry.author_id === "string"
          ? existingEntry.author_id
          : null;
    }

    if (payload.action === "block") {
      if (!targetAuthorId) {
        return response
          .status(404)
          .json({ success: false, code: "ENTRY_NOT_FOUND" });
      }
      if (ownerIds.has(targetAuthorId.toLowerCase())) {
        return response
          .status(409)
          .json({ success: false, code: "CANNOT_BLOCK_OWNER" });
      }
      const { error: blockError } = await supabase
        .from("guestbook_blocked_users")
        .upsert({ user_id: targetAuthorId, blocked_by: user.id });
      if (blockError) throw new Error("Guestbook block failed");
      const { error: hideError } = await supabase
        .from("guestbook_entries")
        .update({
          moderation_status: "quarantined",
          moderation_reasons: ["blocked_user"],
          is_pinned: false,
        })
        .eq("author_id", targetAuthorId)
        .is("deleted_at", null);
      if (hideError) throw new Error("Guestbook block cleanup failed");
      return response.status(200).json({ success: true });
    }

    const changes =
      payload.action === "pin"
        ? { is_pinned: true }
        : payload.action === "unpin"
          ? { is_pinned: false }
          : payload.action === "hide"
            ? {
                moderation_status: "quarantined",
                moderation_reasons: ["manual_hide"],
                is_pinned: false,
              }
            : payload.action === "unhide" || payload.action === "approve"
              ? {
                  moderation_status: "visible",
                  moderation_reasons: [],
                }
              : {
                  body: "",
                  rating: null,
                  deletion_source: "site_author",
                  image_path: null,
                  is_pinned: false,
                  deleted_at: new Date().toISOString(),
                };

    let mutation = supabase
      .from("guestbook_entries")
      .update(changes)
      .eq("id", payload.entryId);
    if (payload.action === "pin" || payload.action === "unpin") {
      mutation = mutation.is("parent_id", null);
    }

    const { data, error } = await mutation.select("id").maybeSingle();
    if (error) throw new Error("Guestbook moderation write failed");
    if (!data) {
      return response
        .status(404)
        .json({ success: false, code: "ENTRY_NOT_FOUND" });
    }
    if (payload.action === "delete") {
      const [mentions, reactions] = await Promise.all([
        supabase
          .from("guestbook_mentions")
          .delete()
          .eq("entry_id", payload.entryId),
        supabase
          .from("guestbook_reactions")
          .delete()
          .eq("entry_id", payload.entryId),
      ]);
      if (mentions.error || reactions.error) {
        throw new Error("Guestbook moderation cleanup failed");
      }
      if (deletedImagePath) {
        const { error } = await supabase.storage
          .from("guestbook-images")
          .remove([deletedImagePath]);
        if (error) throw new Error("Guestbook image cleanup failed");
      }
    }
  } catch {
    return response
      .status(502)
      .json({ success: false, code: "REQUEST_FAILED" });
  }

  return response.status(200).json({ success: true });
}
