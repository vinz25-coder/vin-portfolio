import { describe, expect, it, vi } from "vitest";

import handler, { parseSubscriptionPayload } from "./push-subscription";

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

describe("guestbook push subscription endpoint", () => {
  it("validates subscriptions and endpoint-only delete payloads", () => {
    const endpoint = "https://push.example.com/subscription/123";
    expect(
      parseSubscriptionPayload(
        { endpoint, keys: { p256dh: "p".repeat(32), auth: "a".repeat(16) } },
        true,
      ),
    ).toEqual({
      endpoint,
      keys: { p256dh: "p".repeat(32), auth: "a".repeat(16) },
    });
    expect(parseSubscriptionPayload({ endpoint }, false)).toEqual({ endpoint });
    expect(parseSubscriptionPayload({ endpoint }, true)).toBeNull();
  });

  it("rejects unauthenticated requests before accessing Supabase", async () => {
    const response = createResponse();
    await handler(
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: {
          endpoint: "https://push.example.com/subscription/123",
          keys: { p256dh: "p".repeat(32), auth: "a".repeat(16) },
        },
      },
      response,
    );
    expect(response.status).toHaveBeenCalledWith(401);
  });
});
