import { describe, expect, it, vi } from "vitest";

import handler, { parseModerationPayload } from "./moderate";

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

  it("accepts only approved actions and UUID entry IDs", () => {
    for (const action of ["pin", "unpin", "hide", "unhide", "delete"]) {
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

  it("sets Allow for non-POST requests", async () => {
    const response = createResponse();
    await handler({ method: "GET", headers: {} }, response);
    expect(response.setHeader).toHaveBeenCalledWith("Allow", "POST");
    expect(response.status).toHaveBeenCalledWith(405);
  });
});
