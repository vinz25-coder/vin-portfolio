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
  const { data, error } = await createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  }).auth.getUser(token);
  if (error || !data.user || !owners.has(data.user.id.toLowerCase()))
    return response.status(403).json({ isOwner: false });
  await createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
    .from("profiles")
    .update({ is_author: true })
    .eq("id", data.user.id);
  return response.status(200).json({ isOwner: true });
}
