import { Resend } from "resend";

interface ContactRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
}

interface ContactResponse {
  setHeader: (name: string, value: string) => void;
  status: (statusCode: number) => ContactResponse;
  json: (body: unknown) => ContactResponse;
}

const projectTypes = new Set([
  "web-product",
  "dashboard",
  "frontend-implementation",
  "other",
]);

interface ContactPayload {
  name: string;
  email: string;
  projectType: string;
  message: string;
  website: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(record: Record<string, unknown>, key: string) {
  return typeof record[key] === "string" ? record[key].trim() : "";
}

export function parseContactPayload(body: unknown): ContactPayload | null {
  if (!isRecord(body)) return null;

  const payload = {
    name: readString(body, "name"),
    email: readString(body, "email"),
    projectType: readString(body, "projectType"),
    message: readString(body, "message"),
    website: readString(body, "website"),
  };

  if (
    payload.name.length < 1 ||
    payload.name.length > 80 ||
    payload.email.length > 254 ||
    !/^\S+@\S+\.\S+$/.test(payload.email) ||
    !projectTypes.has(payload.projectType) ||
    payload.message.length < 20 ||
    payload.message.length > 2000
  ) {
    return null;
  }

  return payload;
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#039;",
        '"': "&quot;",
      })[character] ?? character,
  );
}

export default async function handler(
  request: ContactRequest,
  response: ContactResponse,
) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response
      .status(405)
      .json({ success: false, code: "METHOD_NOT_ALLOWED" });
  }

  const contentType = request.headers["content-type"];
  if (
    typeof contentType !== "string" ||
    !contentType.startsWith("application/json")
  ) {
    return response
      .status(415)
      .json({ success: false, code: "UNSUPPORTED_MEDIA_TYPE" });
  }

  const contentLengthHeader = request.headers["content-length"];
  const contentLength = Number(
    typeof contentLengthHeader === "string" ? contentLengthHeader : 0,
  );
  if (contentLength > 16_384) {
    return response
      .status(413)
      .json({ success: false, code: "PAYLOAD_TOO_LARGE" });
  }

  const payload = parseContactPayload(request.body);
  if (!payload) {
    return response
      .status(400)
      .json({ success: false, code: "VALIDATION_ERROR" });
  }

  // Honeypot submissions receive a neutral success response.
  if (payload.website) return response.status(200).json({ success: true });

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL;
  const to = process.env.CONTACT_TO_EMAIL ?? "evindoamandariza@gmail.com";

  if (!apiKey || !from) {
    return response
      .status(503)
      .json({ success: false, code: "DELIVERY_UNAVAILABLE" });
  }

  try {
    const resend = new Resend(apiKey);
    const safeName = escapeHtml(payload.name);
    const safeEmail = escapeHtml(payload.email);
    const safeProjectType = escapeHtml(payload.projectType);
    const safeMessage = escapeHtml(payload.message).replace(/\n/g, "<br />");
    const { error } = await resend.emails.send({
      from,
      to,
      replyTo: payload.email,
      subject: `Portfolio inquiry: ${payload.projectType} from ${payload.name}`,
      text: `Name: ${payload.name}\nEmail: ${payload.email}\nProject type: ${payload.projectType}\n\n${payload.message}`,
      html: `<p><strong>Name:</strong> ${safeName}</p><p><strong>Email:</strong> ${safeEmail}</p><p><strong>Project type:</strong> ${safeProjectType}</p><p>${safeMessage}</p>`,
    });

    if (error) throw new Error("Resend delivery failed");
  } catch {
    return response
      .status(502)
      .json({ success: false, code: "DELIVERY_FAILED" });
  }

  return response.status(200).json({ success: true });
}
