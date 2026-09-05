import { afterEach, describe, expect, it, vi } from "vitest";

import handler, { parseVisitorPayload } from "./visitor";

afterEach(() => {
  vi.unstubAllEnvs();
});

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

describe("guestbook visitor endpoint", () => {
  const browserId = "550e8400-e29b-41d4-a716-446655440000";

  it("accepts a UUID-like browser ID and rejects arbitrary identifiers", () => {
    expect(parseVisitorPayload({ browserId: ` ${browserId} ` })).toEqual({
      browserId,
    });
    expect(parseVisitorPayload({ browserId: "visitor-123" })).toBeNull();
    expect(parseVisitorPayload({ browserId, extra: true })).toEqual({
      browserId,
    });
  });

  it("requires JSON and reports missing server configuration safely", async () => {
    const unsupportedResponse = createResponse();
    await handler(
      { method: "POST", headers: { "content-type": "text/plain" }, body: {} },
      unsupportedResponse,
    );
    expect(unsupportedResponse.status).toHaveBeenCalledWith(415);

    vi.stubEnv("VITE_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("GUESTBOOK_VISITOR_HASH_SECRET", "");
    const unavailableResponse = createResponse();
    await handler(
      {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: { browserId },
      },
      unavailableResponse,
    );
    expect(unavailableResponse.status).toHaveBeenCalledWith(503);
    expect(unavailableResponse.json).toHaveBeenCalledWith({
      success: false,
      code: "SERVICE_UNAVAILABLE",
    });
  });
});
