import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
const eq = vi.fn().mockResolvedValue({ error: null });
const update = vi.fn(() => ({ eq }));
const from = vi.fn(() => ({ update }));

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
      data: { user: { id: "123e4567-e89b-42d3-a456-426614174000" } },
      error: null,
    });
    const response = createResponse();
    await handler(
      { method: "GET", headers: { authorization: "Bearer token" } },
      response,
    );
    expect(update).toHaveBeenCalledWith({ is_author: true });
    expect(response.result).toEqual({
      code: 200,
      body: { isOwner: true },
    });
  });
});
