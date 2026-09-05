import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
const upsert = vi.fn().mockResolvedValue({ error: null });
const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
const eq = vi.fn(() => ({ maybeSingle }));
const select = vi.fn(() => ({ eq }));
const from = vi.fn((table: string) =>
  table === "guestbook_blocked_users" ? { select } : { upsert },
);

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ auth: { getUser }, from }),
}));

import handler from "./owner";

function createResponse() {
  const result = { code: 0, body: {} as unknown };
  return {
    result,
    setHeader: vi.fn(),
    status(code: number) {
      result.code = code;
      return this;
    },
    json(body: unknown) {
      result.body = body;
      return this;
    },
  };
}

describe("guestbook owner endpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    maybeSingle.mockResolvedValue({ data: null, error: null });
    upsert.mockResolvedValue({ error: null });
    process.env.VITE_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role";
    process.env.GUESTBOOK_OWNER_USER_IDS =
      "123e4567-e89b-42d3-a456-426614174000";
  });

  it("rejects requests without a bearer token", async () => {
    const response = createResponse();
    await handler({ method: "GET", headers: {} }, response);
    expect(response.result.code).toBe(401);
  });

  it("marks a verified owner profile and returns owner status", async () => {
    getUser.mockResolvedValue({
      data: {
        user: {
          id: "123e4567-e89b-42d3-a456-426614174000",
          user_metadata: {
            full_name: "Evindo Amanda",
            avatar_url: "https://example.com/avatar.jpg",
          },
        },
      },
      error: null,
    });
    const response = createResponse();
    await handler(
      { method: "GET", headers: { authorization: "Bearer token" } },
      response,
    );
    expect(upsert).toHaveBeenCalledWith({
      id: "123e4567-e89b-42d3-a456-426614174000",
      display_name: "Evindo Amanda",
      avatar_url: "https://example.com/avatar.jpg",
      is_author: true,
    });
    expect(response.result).toEqual({
      code: 200,
      body: { isOwner: true },
    });
  });

  it("does not verify the owner when the profile update fails", async () => {
    getUser.mockResolvedValue({
      data: {
        user: {
          id: "123e4567-e89b-42d3-a456-426614174000",
          user_metadata: { full_name: "Evindo Amanda" },
        },
      },
      error: null,
    });
    upsert.mockResolvedValueOnce({ error: new Error("write failed") });
    const response = createResponse();
    await handler(
      { method: "GET", headers: { authorization: "Bearer token" } },
      response,
    );
    expect(response.result.code).toBe(502);
  });

  it("rejects an owner account without verified profile metadata", async () => {
    getUser.mockResolvedValue({
      data: {
        user: {
          id: "123e4567-e89b-42d3-a456-426614174000",
          user_metadata: {},
        },
      },
      error: null,
    });
    const response = createResponse();
    await handler(
      { method: "GET", headers: { authorization: "Bearer token" } },
      response,
    );
    expect(response.result.code).toBe(422);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("does not mutate a blocked owner profile", async () => {
    getUser.mockResolvedValue({
      data: {
        user: {
          id: "123e4567-e89b-42d3-a456-426614174000",
          user_metadata: { full_name: "Evindo Amanda" },
        },
      },
      error: null,
    });
    maybeSingle.mockResolvedValueOnce({
      data: { user_id: "123e4567-e89b-42d3-a456-426614174000" },
      error: null,
    });
    const response = createResponse();
    await handler(
      { method: "GET", headers: { authorization: "Bearer token" } },
      response,
    );
    expect(response.result.code).toBe(403);
    expect(upsert).not.toHaveBeenCalled();
  });
});
