import { createClient } from "@supabase/supabase-js";

interface Request {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
}
interface Response {
  setHeader(name: string, value: string): void;
  status(code: number): Response;
  json(body: unknown): Response;
}

function getMetadataValue(metadata: unknown, keys: readonly string[]) {
  if (!metadata || typeof metadata !== "object") return undefined;
  const values = metadata as Record<string, unknown>;
  for (const key of keys) {
    const value = values[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

export default async function handler(request: Request, response: Response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ isOwner: false });
  }
  const authorization = request.headers.authorization;
  const token =
    typeof authorization === "string"
      ? authorization.match(/^Bearer ([^\s]+)$/i)?.[1]
      : undefined;
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const owners = new Set(
    (process.env.GUESTBOOK_OWNER_USER_IDS ?? "")
      .split(",")
      .map((id) => id.trim().toLowerCase())
      .filter(Boolean),
  );
  if (!token || !url || !key || owners.size === 0)
    return response.status(401).json({ isOwner: false });
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user || !owners.has(data.user.id.toLowerCase()))
    return response.status(403).json({ isOwner: false });
  const { data: blocked, error: blockedError } = await supabase
    .from("guestbook_blocked_users")
    .select("user_id")
    .eq("user_id", data.user.id)
    .maybeSingle();
  if (blockedError) return response.status(502).json({ isOwner: false });
  if (blocked) return response.status(403).json({ isOwner: false });
  const metadata: unknown = data.user.user_metadata;
  const name = getMetadataValue(metadata, ["full_name", "name"]);
  const avatarUrl = getMetadataValue(metadata, ["avatar_url", "picture"]);
  if (!name) return response.status(422).json({ isOwner: false });
  const { error: updateError } = await supabase.from("profiles").upsert({
    id: data.user.id,
    display_name: name.slice(0, 120),
    avatar_url: avatarUrl ?? null,
    is_author: true,
  });
  if (updateError) return response.status(502).json({ isOwner: false });
  return response.status(200).json({ isOwner: true });
}
