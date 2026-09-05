import { describe, expect, it, vi } from "vitest";

import handler, { parseReplyPayload } from "./push-reply";

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

describe("guestbook reply push endpoint", () => {
  const replyId = "550e8400-e29b-41d4-a716-446655440000";

  it("accepts only UUID reply IDs", () => {
    expect(parseReplyPayload({ replyId })).toEqual({ replyId });
    expect(parseReplyPayload({ replyId: "invalid" })).toBeNull();
  });

  it("rejects requests without a bearer token", async () => {
    const response = createResponse();
    await handler(
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: { replyId },
      },
      response,
    );
    expect(response.status).toHaveBeenCalledWith(401);
  });
});
