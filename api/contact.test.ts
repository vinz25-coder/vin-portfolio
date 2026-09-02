import { afterEach, describe, expect, it, vi } from "vitest";

import handler, { parseContactPayload } from "./contact";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("parseContactPayload", () => {
  const validPayload = {
    name: "Ada Lovelace",
    email: "ada@example.com",
    projectType: "web-product",
    message: "A sufficiently detailed project message.",
    website: "",
  };

  it("accepts and trims a valid contact payload", () => {
    expect(
      parseContactPayload({ ...validPayload, name: "  Ada Lovelace  " }),
    ).toEqual(validPayload);
  });

  it("rejects invalid email, project type, and short messages", () => {
    expect(
      parseContactPayload({ ...validPayload, email: "invalid" }),
    ).toBeNull();
    expect(
      parseContactPayload({ ...validPayload, projectType: "unknown" }),
    ).toBeNull();
    expect(
      parseContactPayload({ ...validPayload, message: "Too short" }),
    ).toBeNull();
  });

  it("reports unavailable delivery when Resend is not configured", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("CONTACT_FROM_EMAIL", "");
    const json = vi.fn();
    const response = {
      setHeader: vi.fn(),
      status: vi.fn(),
      json,
    };
    response.status.mockReturnValue(response);
    response.json.mockReturnValue(response);

    await handler(
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: validPayload,
      },
      response,
    );

    expect(response.status).toHaveBeenCalledWith(503);
    expect(json).toHaveBeenCalledWith({
      success: false,
      code: "DELIVERY_UNAVAILABLE",
    });
  });
});
