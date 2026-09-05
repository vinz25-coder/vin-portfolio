import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

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

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_BODY_BYTES = 1_024;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readActorName(value: unknown) {
  if (!isRecord(value)) return "Someone";
  const authorValue = value.author;
  const author: unknown = Array.isArray(authorValue)
    ? (authorValue as unknown[])[0]
    : authorValue;
  return isRecord(author) && typeof author.display_name === "string"
    ? author.display_name
    : "Someone";
}

function readToken(headers: PushRequest["headers"]) {
  const value = Object.entries(headers).find(
    ([name]) => name.toLowerCase() === "authorization",
  )?.[1];
  return typeof value === "string"
    ? value.match(/^Bearer ([^\s]+)$/i)?.[1]
    : undefined;
}

function readHeader(headers: PushRequest["headers"], target: string) {
  const value = Object.entries(headers).find(
    ([name]) => name.toLowerCase() === target,
  )?.[1];
  return typeof value === "string" ? value : undefined;
}

export function parseReplyPayload(body: unknown) {
  if (!isRecord(body) || typeof body.replyId !== "string") return null;
  const replyId = body.replyId.trim();
  return uuidPattern.test(replyId) ? { replyId } : null;
}

export default async function handler(
  request: PushRequest,
  response: PushResponse,
) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
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
  const payload = parseReplyPayload(request.body);
  if (!token) {
    return response.status(401).json({ success: false, code: "UNAUTHORIZED" });
  }
  if (!payload) {
    return response
      .status(400)
      .json({ success: false, code: "VALIDATION_ERROR" });
  }

  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const publicKey = process.env.VITE_WEB_PUSH_VAPID_PUBLIC_KEY;
  const privateKey = process.env.WEB_PUSH_VAPID_PRIVATE_KEY;
  const subject = process.env.WEB_PUSH_SUBJECT;
  if (!url || !key || !publicKey || !privateKey || !subject) {
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

    const { data: blocked, error: blockedError } = await supabase
      .from("guestbook_blocked_users")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (blockedError) throw new Error("Guestbook block lookup failed");
    if (blocked) {
      return response.status(200).json({ success: true, delivered: 0 });
    }

    const { data: reply, error: replyError } = await supabase
      .from("guestbook_entries")
      .select(
        "id,author_id,reply_recipient_id,root_id,body,is_hidden,moderation_status,deleted_at,author:profiles!guestbook_entries_author_id_fkey(display_name)",
      )
      .eq("id", payload.replyId)
      .eq("entry_type", "reply")
      .maybeSingle();
    if (replyError) throw new Error("Reply lookup failed");
    if (
      !reply ||
      reply.author_id !== user.id ||
      !reply.reply_recipient_id ||
      reply.reply_recipient_id === user.id ||
      reply.moderation_status !== "visible" ||
      reply.is_hidden ||
      reply.deleted_at
    ) {
      return response.status(200).json({ success: true, delivered: 0 });
    }
    if (reply.root_id) {
      const { data: root, error } = await supabase
        .from("guestbook_entries")
        .select("id")
        .eq("id", reply.root_id)
        .eq("is_hidden", false)
        .eq("moderation_status", "visible")
        .is("deleted_at", null)
        .maybeSingle();
      if (error) throw new Error("Root lookup failed");
      if (!root)
        return response.status(200).json({ success: true, delivered: 0 });
    }

    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from("guestbook_push_subscriptions")
      .select("id,endpoint,p256dh,auth")
      .eq("user_id", reply.reply_recipient_id);
    if (subscriptionsError) throw new Error("Push subscription lookup failed");
    if (!subscriptions?.length) {
      return response.status(200).json({ success: true, delivered: 0 });
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);
    const actorName = readActorName(reply);
    const notification = JSON.stringify({
      title: "New reply in Guestbook",
      body: `${actorName}: ${String(reply.body).slice(0, 140)}`,
      url: `/guestbook#comment-${reply.id}`,
    });
    let delivered = 0;

    await Promise.all(
      subscriptions.map(async (subscriptionValue: unknown) => {
        if (
          !subscriptionValue ||
          typeof subscriptionValue !== "object" ||
          !("id" in subscriptionValue) ||
          !("endpoint" in subscriptionValue) ||
          !("p256dh" in subscriptionValue) ||
          !("auth" in subscriptionValue) ||
          typeof subscriptionValue.id !== "string" ||
          typeof subscriptionValue.endpoint !== "string" ||
          typeof subscriptionValue.p256dh !== "string" ||
          typeof subscriptionValue.auth !== "string"
        )
          return;
        const subscription = {
          id: String(subscriptionValue.id),
          endpoint: String(subscriptionValue.endpoint),
          p256dh: String(subscriptionValue.p256dh),
          auth: String(subscriptionValue.auth),
        };
        const { error: claimError } = await supabase
          .from("guestbook_push_deliveries")
          .insert({
            reply_id: reply.id,
            subscription_id: subscription.id,
          });
        if (claimError) return;
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: { p256dh: subscription.p256dh, auth: subscription.auth },
            },
            notification,
            { TTL: 86_400 },
          );
          delivered += 1;
        } catch (sendError) {
          const statusCode =
            sendError &&
            typeof sendError === "object" &&
            "statusCode" in sendError
              ? Number(sendError.statusCode)
              : 0;
          if (statusCode === 404 || statusCode === 410) {
            await supabase
              .from("guestbook_push_subscriptions")
              .delete()
              .eq("id", subscription.id);
          } else {
            await supabase
              .from("guestbook_push_deliveries")
              .delete()
              .eq("reply_id", reply.id)
              .eq("subscription_id", subscription.id);
          }
        }
      }),
    );

    return response.status(200).json({ success: true, delivered });
  } catch {
    return response
      .status(502)
      .json({ success: false, code: "REQUEST_FAILED" });
  }
}
