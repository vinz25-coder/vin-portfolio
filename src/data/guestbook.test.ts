import { describe, expect, it } from "vitest";

import {
  getGuestbookPage,
  parseActiveReview,
  type GuestbookEntry,
} from "./guestbook";

function entries(count: number): GuestbookEntry[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `entry-${index + 1}`,
    author: { id: "visitor", display_name: "Visitor", avatar_url: null },
    body: `Entry ${index + 1}`,
    image_path: null,
    is_deleted: false,
    created_at: "2026-09-04T00:00:00.000Z",
    updated_at: "2026-09-04T00:00:00.000Z",
    reactions: {},
    my_reactions: [],
  }));
}

describe("getGuestbookPage", () => {
  it("shows no continuation at exactly ten roots", () => {
    expect(getGuestbookPage(entries(10), 10)).toMatchObject({
      entries: { length: 10 },
      hasMoreEntries: false,
    });
  });

  it("uses the eleventh root only as continuation evidence", () => {
    expect(getGuestbookPage(entries(11), 10)).toMatchObject({
      entries: { length: 10 },
      hasMoreEntries: true,
    });
  });
});

describe("parseActiveReview", () => {
  it("treats an all-null composite as no active review", () => {
    expect(
      parseActiveReview({
        id: null,
        author_id: null,
        entry_type: null,
        body: null,
        rating: null,
        is_hidden: null,
      }),
    ).toBeNull();
  });

  it("accepts only a complete active review", () => {
    expect(
      parseActiveReview({
        id: "550e8400-e29b-41d4-a716-446655440000",
        author_id: "123e4567-e89b-42d3-a456-426614174000",
        entry_type: "review",
        body: "Clear portfolio review.",
        rating: 5,
        review_categories: ["portfolio", "code_quality"],
        image_path: null,
        is_hidden: false,
        created_at: "2026-09-04T00:00:00.000Z",
        updated_at: "2026-09-04T00:00:00.000Z",
      }),
    ).toMatchObject({
      id: "550e8400-e29b-41d4-a716-446655440000",
      entry_type: "review",
      rating: 5,
      review_categories: ["portfolio", "code_quality"],
      author: { id: "123e4567-e89b-42d3-a456-426614174000" },
    });
  });

  it("rejects a Discussion or malformed review payload", () => {
    expect(() =>
      parseActiveReview({ id: "entry", entry_type: "discussion" }),
    ).toThrow("ACTIVE_REVIEW_INVALID");
  });
});
