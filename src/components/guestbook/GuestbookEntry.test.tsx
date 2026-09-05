import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LanguageProvider } from "../../context/LanguageContext";
import type { GuestbookEntry as Entry } from "../../data/guestbook";
import { GuestbookEntry } from "./GuestbookEntry";

const entry: Entry = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  parent_id: null,
  author: {
    id: "123e4567-e89b-42d3-a456-426614174000",
    display_name: "Visitor",
    avatar_url: null,
  },
  entry_type: "discussion",
  body: "A useful guestbook comment.",
  image_path: null,
  is_pinned: false,
  is_deleted: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  reactions: {},
  my_reactions: [],
  replies: [],
};
const writeText = vi.fn().mockResolvedValue(undefined);

function makeReplies(count: number): Entry[] {
  return Array.from({ length: count }, (_, index) => ({
    ...entry,
    id: `reply-${index + 1}`,
    parent_id: entry.id,
    depth: 1,
    body: `Reply ${index + 1}`,
    replies: [],
  }));
}

function renderEntry(
  overrides: Partial<React.ComponentProps<typeof GuestbookEntry>> = {},
) {
  const props: React.ComponentProps<typeof GuestbookEntry> = {
    entry,
    currentUserId: "owner-id",
    isCurrentUserOwner: true,
    onReply: vi.fn(),
    onReact: vi.fn(),
    onDelete: vi.fn(),
    onEdit: vi.fn(),
    onReport: vi.fn(),
    onModerate: vi.fn(),
    ...overrides,
  };
  render(
    <LanguageProvider>
      <GuestbookEntry {...props} />
    </LanguageProvider>,
  );
  return props;
}

describe("GuestbookEntry owner controls", () => {
  beforeEach(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    writeText.mockClear();
    window.history.replaceState(null, "", "/guestbook");
  });

  it("raises the active entry and exposes root moderation actions", () => {
    const props = renderEntry();
    fireEvent.click(screen.getByRole("button", { name: "More actions" }));

    const article = screen.getByRole("article");
    expect(article).toHaveClass("z-20");
    expect(screen.getByRole("menuitem", { name: "Pin" })).toBeVisible();
    expect(screen.getByRole("menuitem", { name: "Hide" })).toBeVisible();
    expect(
      screen.queryByRole("menuitem", { name: "Delete" }),
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("menuitem", { name: "Permanently delete" }),
    );
    expect(props.onModerate).toHaveBeenCalledWith(entry, "permanent_delete");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("runs Hide when its menu item is clicked", () => {
    const props = renderEntry();
    fireEvent.click(screen.getByRole("button", { name: "More actions" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Hide" }));

    expect(props.onModerate).toHaveBeenCalledWith(entry, "hide");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("disables moderation actions and marks the pending entry busy", () => {
    renderEntry({
      moderationDisabled: true,
      moderationPendingId: entry.id,
    });
    fireEvent.click(screen.getByRole("button", { name: "More actions" }));

    expect(screen.getByRole("article")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("menuitem", { name: "Pin" })).toBeDisabled();
    expect(screen.getByRole("menuitem", { name: "Hide" })).toBeDisabled();
  });

  it("opens upward when the footer reduces the available space below", () => {
    const footer = document.createElement("footer");
    document.body.append(footer);
    const rectSpy = vi
      .spyOn(Element.prototype, "getBoundingClientRect")
      .mockImplementation(function (this: Element) {
        if (this === footer) {
          return { top: 140 } as DOMRect;
        }
        if (this.getAttribute("role") === "menu") {
          return { height: 120 } as DOMRect;
        }
        if (this.getAttribute("aria-label") === "More actions") {
          return { top: 100, bottom: 130 } as DOMRect;
        }
        return { top: 0, bottom: 0, height: 0 } as DOMRect;
      });

    renderEntry();
    fireEvent.click(screen.getByRole("button", { name: "More actions" }));

    expect(screen.getByRole("menu")).toHaveClass("bottom-full");
    rectSpy.mockRestore();
    footer.remove();
  });

  it("closes the action menu with Escape and restores trigger focus", () => {
    renderEntry();
    const trigger = screen.getByRole("button", { name: "More actions" });
    fireEvent.click(trigger);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("moves keyboard focus between menu actions", () => {
    renderEntry();
    fireEvent.click(screen.getByRole("button", { name: "More actions" }));
    const pin = screen.getByRole("menuitem", { name: "Pin" });
    expect(screen.getByRole("menuitem", { name: "Report" })).toHaveFocus();
    fireEvent.keyDown(screen.getByRole("menu"), { key: "ArrowDown" });
    expect(pin).toHaveFocus();
  });

  it("shows approval and blocking controls in moderation view", () => {
    const props = renderEntry({
      entry: {
        ...entry,
        is_hidden: true,
        moderation_status: "quarantined",
      },
      moderationView: true,
    });
    expect(
      screen.queryByRole("button", { name: "More actions" }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Block user" })).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Delete" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    expect(props.onModerate).toHaveBeenCalledWith(
      expect.objectContaining({ id: entry.id }),
      "approve",
    );
  });

  it("distinguishes pending content and allows it to be hidden", () => {
    const props = renderEntry({
      entry: {
        ...entry,
        is_hidden: true,
        moderation_status: "pending",
      },
      moderationView: true,
    });
    expect(screen.getByText("Pending")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Hide" }));
    expect(props.onModerate).toHaveBeenCalledWith(
      expect.objectContaining({ id: entry.id }),
      "hide",
    );
  });

  it("copies a working deep link and exposes its target id", async () => {
    renderEntry({ isCurrentUserOwner: false });
    const article = screen.getByRole("article");
    expect(article).toHaveAttribute("id", `comment-${entry.id}`);
    fireEvent.click(screen.getByRole("button", { name: "Share" }));
    expect(writeText).toHaveBeenCalledWith(
      `${location.origin}/guestbook#comment-${entry.id}`,
    );
    expect(
      await screen.findByRole("button", { name: "Link copied" }),
    ).toBeVisible();
  });

  it("offers only mutually exclusive Like and Dislike entry votes", () => {
    const props = renderEntry({
      entry: {
        ...entry,
        reactions: { thumb: 4, dislike: 2 },
        my_reactions: ["thumb"],
      },
    });

    expect(screen.getByRole("button", { name: "Like" })).toHaveTextContent("4");
    expect(screen.getByRole("button", { name: "Like" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Dislike" })).toHaveTextContent(
      "2",
    );
    expect(
      screen.queryByRole("button", { name: "Helpful" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Dislike" }));
    expect(props.onReact).toHaveBeenCalledWith(entry.id, "dislike");
  });

  it("shows three replies at first and reveals three more per action", () => {
    renderEntry({
      entry: { ...entry, replies: makeReplies(7), reply_count: 7 },
    });

    expect(screen.getByText("Reply 3")).toBeVisible();
    expect(screen.queryByText("Reply 4")).not.toBeInTheDocument();
    const firstMore = screen.getByRole("button", {
      name: "View more replies (3)",
    });
    expect(firstMore).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(firstMore);
    expect(screen.getByText("Reply 6")).toBeVisible();
    expect(screen.queryByText("Reply 7")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "View more replies (1)" }),
    ).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(
      screen.getByRole("button", { name: "View more replies (1)" }),
    );
    expect(screen.getByText("Reply 7")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: /View more replies/ }),
    ).not.toBeInTheDocument();
  });

  it("does not collapse a deep-linked reply", () => {
    window.history.replaceState(null, "", "/guestbook#comment-reply-5");
    renderEntry({
      entry: { ...entry, replies: makeReplies(5), reply_count: 5 },
    });

    expect(screen.getByText("Reply 5")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: /View more replies/ }),
    ).not.toBeInTheDocument();
  });

  it.each(["commenter", "site_author"] as const)(
    "hides tombstone content and public controls for %s",
    (source) => {
      renderEntry({
        isCurrentUserOwner: false,
        entry: {
          ...entry,
          is_deleted: true,
          deletion_source: source,
          rating: 5,
          image_path: "visitor/secret.png",
        },
      });
      expect(
        screen.getByText(
          source === "commenter" ? "Deleted by commenter" : "Removed by Author",
        ),
      ).toBeVisible();
      expect(screen.queryByText(entry.body!)).not.toBeInTheDocument();
      expect(screen.queryByLabelText("5/5")).not.toBeInTheDocument();
      expect(screen.queryByRole("img")).not.toBeInTheDocument();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    },
  );

  it.each([false, true])(
    "allows owner permanent deletion of own entries including tombstones (%s)",
    (deleted) => {
      const target = { ...entry, is_deleted: deleted };
      const props = renderEntry({
        entry: target,
        currentUserId: entry.author.id,
      });
      fireEvent.click(screen.getByRole("button", { name: "More actions" }));
      expect(
        screen.queryByRole("menuitem", { name: "Delete" }),
      ).not.toBeInTheDocument();
      if (deleted) expect(screen.getAllByRole("menuitem")).toHaveLength(1);
      fireEvent.click(
        screen.getByRole("menuitem", { name: "Permanently delete" }),
      );
      expect(props.onModerate).toHaveBeenCalledWith(target, "permanent_delete");
    },
  );

  it("shows only permanent delete to the owner for another user's entry", () => {
    renderEntry({ isCurrentUserOwner: true, currentUserId: "owner-id" });
    fireEvent.click(screen.getByRole("button", { name: "More actions" }));
    expect(
      screen.queryByRole("menuitem", { name: "Delete" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: "Permanently delete" }),
    ).toBeVisible();
  });

  it("renders all selected review categories", () => {
    renderEntry({
      entry: {
        ...entry,
        entry_type: "review",
        rating: 4,
        review_categories: ["portfolio", "code_quality", "collaboration"],
      },
    });
    expect(screen.getByText("Portfolio")).toBeVisible();
    expect(screen.getByText("Code Quality")).toBeVisible();
    expect(screen.getByText("Collaboration")).toBeVisible();
  });
});
