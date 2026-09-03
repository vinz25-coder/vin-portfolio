import { createHmac } from "node:crypto";

import { createClient } from "@supabase/supabase-js";

interface VisitorRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
}

interface VisitorResponse {
  setHeader: (name: string, value: string) => void;
  status: (statusCode: number) => VisitorResponse;
  json: (body: unknown) => VisitorResponse;
}

interface VisitorPayload {
  browserId: string;
}

const MAX_BODY_BYTES = 4_096;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readHeader(
  headers: VisitorRequest["headers"],
  name: string,
): string | undefined {
  const entry = Object.entries(headers).find(
    ([headerName]) => headerName.toLowerCase() === name,
  );
  return typeof entry?.[1] === "string" ? entry[1] : undefined;
}

function isJsonRequest(headers: VisitorRequest["headers"]): boolean {
  return (
    readHeader(headers, "content-type")
      ?.split(";", 1)[0]
      ?.trim()
      .toLowerCase() === "application/json"
  );
}

function isBodyTooLarge(headers: VisitorRequest["headers"]): boolean {
  const value = readHeader(headers, "content-length");
  if (value === undefined) return false;

  const contentLength = Number(value);
  return (
    !Number.isSafeInteger(contentLength) ||
    contentLength < 0 ||
    contentLength > MAX_BODY_BYTES
  );
}

function jakartaDate(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const readPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value;

  return `${readPart("year")}-${readPart("month")}-${readPart("day")}`;
}

export function parseVisitorPayload(body: unknown): VisitorPayload | null {
  if (!isRecord(body) || typeof body.browserId !== "string") return null;

  const browserId = body.browserId.trim();
  return uuidPattern.test(browserId) ? { browserId } : null;
}

export default async function handler(
  request: VisitorRequest,
  response: VisitorResponse,
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

  const payload = parseVisitorPayload(request.body);
  if (!payload) {
    return response
      .status(400)
      .json({ success: false, code: "VALIDATION_ERROR" });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hashSecret = process.env.GUESTBOOK_VISITOR_HASH_SECRET;
  if (!supabaseUrl || !serviceRoleKey || !hashSecret) {
    return response
      .status(503)
      .json({ success: false, code: "SERVICE_UNAVAILABLE" });
  }

  try {
    const browserHash = createHmac("sha256", hashSecret)
      .update(payload.browserId)
      .digest("hex");
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await supabase.from("guestbook_visits").upsert(
      {
        browser_hash: `\\x${browserHash}`,
        visited_on: jakartaDate(new Date()),
      },
      {
        onConflict: "browser_hash,visited_on",
        ignoreDuplicates: true,
      },
    );

    if (error) throw new Error("Guestbook visit write failed");
  } catch {
    return response
      .status(502)
      .json({ success: false, code: "REQUEST_FAILED" });
  }

  return response.status(200).json({ success: true });
}
