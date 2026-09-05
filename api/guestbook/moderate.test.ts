import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import handler, { parseModerationPayload } from "./moderate";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  rpc: vi.fn(),
  remove: vi.fn(),
  from: vi.fn(),
}));
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: { getUser: mocks.getUser },
    rpc: mocks.rpc,
    from: mocks.from,
    storage: { from: () => ({ remove: mocks.remove }) },
  }),
}));

function createResponse() {
  const response = {
    setHeader: vi.fn(),
    status: vi.fn(),
    json: vi.fn(),
  };
  response.status.mockReturnValue(response);
  response.json.mockReturnValue(response);
  return response;
}

describe("guestbook moderation endpoint", () => {
  const entryId = "550e8400-e29b-41d4-a716-446655440000";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role");
    vi.stubEnv("GUESTBOOK_OWNER_USER_IDS", entryId);
    mocks.getUser.mockResolvedValue({
      data: { user: { id: entryId } },
      error: null,
    });
    mocks.rpc.mockResolvedValue({
      data: {
        deleted_ids: [entryId],
        image_paths: ["owner/root.png", "visitor/reply.png"],
      },
      error: null,
    });
    mocks.remove.mockResolvedValue({ error: null });
  });
  afterEach(() => vi.unstubAllEnvs());

  const permanentRequest = {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer token",
    },
    body: { action: "permanent_delete", entryId },
  };

  it("rejects non-owner permanent deletion before invoking SQL or storage", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "123e4567-e89b-42d3-a456-426614174000" } },
      error: null,
    });
    const response = createResponse();
    await handler(permanentRequest, response);
    expect(response.status).toHaveBeenCalledWith(403);
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(mocks.remove).not.toHaveBeenCalled();
  });

  it("deletes via the authoritative subtree RPC then cleans all returned images", async () => {
    const response = createResponse();
    await handler(
      {
        ...permanentRequest,
        body: { ...permanentRequest.body, imagePaths: ["forged.png"] },
      },
      response,
    );
    expect(mocks.rpc).toHaveBeenCalledWith(
      "permanently_delete_guestbook_subtree",
      { p_entry_id: entryId },
    );
    expect(mocks.remove).toHaveBeenCalledWith([
      "owner/root.png",
      "visitor/reply.png",
    ]);
    expect(mocks.rpc.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.remove.mock.invocationCallOrder[0],
    );
    expect(response.json).toHaveBeenCalledWith({
      success: true,
      deleted: true,
      deletedIds: [entryId],
    });
  });

  it("reports cleanup failure without claiming a database rollback", async () => {
    mocks.remove.mockResolvedValue({
      error: { message: "Storage unavailable" },
    });
    const response = createResponse();
    await handler(permanentRequest, response);
    expect(response.status).toHaveBeenCalledWith(502);
    expect(response.json).toHaveBeenCalledWith({
      success: false,
      deleted: true,
      code: "STORAGE_CLEANUP_FAILED",
      imagePaths: ["owner/root.png", "visitor/reply.png"],
      deletedIds: [entryId],
    });
  });

  it("does not clean storage when SQL fails", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { code: "P0002" } });
    const response = createResponse();
    await handler(permanentRequest, response);
    expect(response.status).toHaveBeenCalledWith(404);
    expect(mocks.remove).not.toHaveBeenCalled();
  });

  it("accepts only approved actions and UUID entry IDs", () => {
    for (const action of [
      "pin",
      "unpin",
      "approve",
      "hide",
      "unhide",
      "delete",
      "block",
      "permanent_delete",
    ]) {
      expect(parseModerationPayload({ action, entryId })).toEqual({
        action,
        entryId,
      });
    }
    expect(parseModerationPayload({ action: "publish", entryId })).toBeNull();
    expect(
      parseModerationPayload({ action: "hide", entryId: "invalid" }),
    ).toBeNull();
  });

  it("rejects missing or malformed bearer authorization before Supabase", async () => {
    for (const authorization of [
      undefined,
      "Basic token",
      "Bearer two tokens",
    ]) {
      const response = createResponse();
      await handler(
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization,
          },
          body: { action: "hide", entryId },
        },
        response,
      );
      expect(response.status).toHaveBeenCalledWith(401);
      expect(response.json).toHaveBeenCalledWith({
        success: false,
        code: "UNAUTHORIZED",
      });
    }
  });

  it("sets Allow for unsupported requests", async () => {
    const response = createResponse();
    await handler({ method: "PUT", headers: {} }, response);
    expect(response.setHeader).toHaveBeenCalledWith("Allow", "GET, POST");
    expect(response.status).toHaveBeenCalledWith(405);
  });

  it("requires authorization when listing hidden entries", async () => {
    const response = createResponse();
    await handler({ method: "GET", headers: {} }, response);
    expect(response.status).toHaveBeenCalledWith(401);
  });
});
