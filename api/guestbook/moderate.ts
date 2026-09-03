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
const actions = new Set(["pin", "unpin", "hide", "unhide", "delete"] as const);
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ModerationAction = "pin" | "unpin" | "hide" | "unhide" | "delete";

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
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response
      .status(405)
      .json({ success: false, code: "METHOD_NOT_ALLOWED" });
  }

  if (!isJsonRequest(request.headers)) {
    return response
      .status(415)
      .json({ success: false, code: "UNSUPPORTED_MEDIA_TYPE" });
  }

  if (isBodyTooLarge(request.headers)) {
    return response
      .status(413)
      .json({ success: false, code: "PAYLOAD_TOO_LARGE" });
  }

  const payload = parseModerationPayload(request.body);
  if (!payload) {
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

    const changes =
      payload.action === "pin"
        ? { is_pinned: true }
        : payload.action === "unpin"
          ? { is_pinned: false }
          : payload.action === "hide"
            ? { is_hidden: true }
            : payload.action === "unhide"
              ? { is_hidden: false }
              : { deleted_at: new Date().toISOString() };

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
  } catch {
    return response
      .status(502)
      .json({ success: false, code: "REQUEST_FAILED" });
  }

  return response.status(200).json({ success: true });
}
