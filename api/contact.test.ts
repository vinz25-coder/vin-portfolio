import { describe, expect, it } from "vitest";

import { parseContactPayload } from "./contact";

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
});
