import { createClient } from "@supabase/supabase-js";

interface PushRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
}

interface PushResponse {
  setHeader(name: string, value: string): void;
  status(code: number): PushResponse;
  json(body: unknown): PushResponse;
}

interface SubscriptionPayload {
  endpoint: string;
  keys?: { p256dh: string; auth: string };
}

const MAX_BODY_BYTES = 4_096;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readHeader(headers: PushRequest["headers"], name: string) {
  const value = Object.entries(headers).find(
    ([headerName]) => headerName.toLowerCase() === name,
  )?.[1];
  return typeof value === "string" ? value : undefined;
}

function readToken(headers: PushRequest["headers"]) {
  return readHeader(headers, "authorization")?.match(/^Bearer ([^\s]+)$/i)?.[1];
}

export function parseSubscriptionPayload(
  body: unknown,
  requireKeys: boolean,
): SubscriptionPayload | null {
  if (!isRecord(body) || typeof body.endpoint !== "string") return null;
  const endpoint = body.endpoint.trim();
  if (endpoint.length < 16 || endpoint.length > 2048) return null;
  if (!requireKeys) return { endpoint };
  if (!isRecord(body.keys)) return null;
  const p256dh = typeof body.keys.p256dh === "string" ? body.keys.p256dh : "";
  const auth = typeof body.keys.auth === "string" ? body.keys.auth : "";
  if (
    p256dh.length < 16 ||
    p256dh.length > 512 ||
    auth.length < 8 ||
    auth.length > 256
  )
    return null;
  return { endpoint, keys: { p256dh, auth } };
}

export default async function handler(
  request: PushRequest,
  response: PushResponse,
) {
  if (request.method !== "POST" && request.method !== "DELETE") {
    response.setHeader("Allow", "POST, DELETE");
    return response
      .status(405)
      .json({ success: false, code: "METHOD_NOT_ALLOWED" });
  }
  const contentType = readHeader(request.headers, "content-type");
  if (
    contentType?.split(";", 1)[0]?.trim().toLowerCase() !== "application/json"
  ) {
    return response
      .status(415)
      .json({ success: false, code: "UNSUPPORTED_MEDIA_TYPE" });
  }
  const contentLength = Number(
    readHeader(request.headers, "content-length") ?? 0,
  );
  if (!Number.isSafeInteger(contentLength) || contentLength > MAX_BODY_BYTES) {
    return response
      .status(413)
      .json({ success: false, code: "PAYLOAD_TOO_LARGE" });
  }
  const token = readToken(request.headers);
  if (!token) {
    return response.status(401).json({ success: false, code: "UNAUTHORIZED" });
  }
  const payload = parseSubscriptionPayload(
    request.body,
    request.method === "POST",
  );
  if (!payload) {
    return response
      .status(400)
      .json({ success: false, code: "VALIDATION_ERROR" });
  }
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return response
      .status(503)
      .json({ success: false, code: "SERVICE_UNAVAILABLE" });
  }

  try {
    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return response
        .status(401)
        .json({ success: false, code: "UNAUTHORIZED" });
    }

    if (request.method === "POST" && payload.keys) {
      const { data: blocked, error: blockedError } = await supabase
        .from("guestbook_blocked_users")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (blockedError) throw new Error("Guestbook block lookup failed");
      if (blocked) {
        return response
          .status(403)
          .json({ success: false, code: "USER_BLOCKED" });
      }
      const { data: existing, error: lookupError } = await supabase
        .from("guestbook_push_subscriptions")
        .select("user_id")
        .eq("endpoint", payload.endpoint)
        .maybeSingle();
      if (lookupError) throw new Error("Push subscription lookup failed");
      if (existing && existing.user_id !== user.id) {
        return response
          .status(409)
          .json({ success: false, code: "SUBSCRIPTION_CONFLICT" });
      }
      const { error } = await supabase
        .from("guestbook_push_subscriptions")
        .upsert(
          {
            user_id: user.id,
            endpoint: payload.endpoint,
            p256dh: payload.keys.p256dh,
            auth: payload.keys.auth,
          },
          { onConflict: "endpoint" },
        );
      if (error) throw new Error("Push subscription write failed");
    } else {
      const { error } = await supabase
        .from("guestbook_push_subscriptions")
        .delete()
        .eq("user_id", user.id)
        .eq("endpoint", payload.endpoint);
      if (error) throw new Error("Push subscription delete failed");
    }
  } catch {
    return response
      .status(502)
      .json({ success: false, code: "REQUEST_FAILED" });
  }

  return response.status(200).json({ success: true });
}
