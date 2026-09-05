import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LanguageProvider } from "../../context/LanguageContext";
import { ThemeProvider } from "../../context/ThemeContext";
import { GuestbookComposer } from "./GuestbookComposer";

function renderComposer(
  overrides: Partial<React.ComponentProps<typeof GuestbookComposer>> = {},
) {
  const props: React.ComponentProps<typeof GuestbookComposer> = {
    submitting: false,
    onSubmit: vi.fn().mockResolvedValue(true),
    ...overrides,
  };
  const result = render(
    <LanguageProvider>
      <ThemeProvider>
        <GuestbookComposer {...props} />
      </ThemeProvider>
    </LanguageProvider>,
  );
  return { props, ...result };
}

describe("GuestbookComposer", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(private callback: IntersectionObserverCallback) {}
        observe = (target: Element) => {
          this.callback(
            [
              {
                target,
                isIntersecting:
                  target.getAttribute("data-name") === "smileys_people",
              } as IntersectionObserverEntry,
            ],
            this as unknown as IntersectionObserver,
          );
        };
        unobserve = vi.fn();
        disconnect = vi.fn();
      },
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it("backfills old review drafts and persists multiple category choices", async () => {
    localStorage.setItem(
      "guestbook-composer-draft",
      JSON.stringify({ body: "Old review", entryType: "review", rating: 4 }),
    );
    const first = renderComposer();
    expect(screen.getByRole("checkbox", { name: "Portfolio" })).toBeChecked();
    expect(screen.getAllByRole("checkbox")).toHaveLength(6);
    fireEvent.click(screen.getByRole("checkbox", { name: "Code Quality" }));
    first.unmount();
    const { props } = renderComposer();
    expect(screen.getByRole("checkbox", { name: "Portfolio" })).toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: "Code Quality" }),
    ).toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "Post comment" }));
    await waitFor(() =>
      expect(props.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          reviewCategories: ["portfolio", "code_quality"],
        }),
      ),
    );
  });

  it("preserves edit categories and sends no categories or mention IDs for discussions", async () => {
    const first = renderComposer({
      initialBody: "Existing review",
      initialType: "review",
      initialRating: 5,
      initialReviewCategories: ["communication", "collaboration"],
    });
    expect(
      screen.getByRole("checkbox", { name: "Communication" }),
    ).toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: "Collaboration" }),
    ).toBeChecked();
    first.unmount();
    const { props } = renderComposer();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /mention/i }),
    ).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "@Visitor plain text" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Post comment" }));
    await waitFor(() =>
      expect(props.onSubmit).toHaveBeenCalledWith({
        body: "@Visitor plain text",
        entryType: "discussion",
        rating: null,
        reviewCategories: null,
        image: null,
        removeExistingImage: false,
      }),
    );
  });

  it("requires at least one review category", () => {
    renderComposer();
    fireEvent.click(screen.getByRole("button", { name: "Review" }));
    fireEvent.click(screen.getByRole("radio", { name: "5/5 — Excellent" }));
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Review body" },
    });
    fireEvent.click(screen.getByRole("checkbox", { name: "Portfolio" }));
    expect(screen.getByRole("button", { name: "Post comment" })).toBeDisabled();
  });

  it("loads the full searchable picker on opening and replaces a textarea selection", async () => {
    renderComposer();
    const textarea = screen.getByRole<HTMLTextAreaElement>("textbox");
    fireEvent.change(textarea, { target: { value: "Hello world!" } });
    textarea.focus();
    textarea.setSelectionRange(6, 11);
    fireEvent.select(textarea);
    expect(screen.queryByPlaceholderText("Search")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add emoji" }));
    const search = await screen.findByPlaceholderText("Search");
    fireEvent.change(search, { target: { value: "grinning face" } });
    fireEvent.click(await screen.findByLabelText("grinning face"));
    await waitFor(() => expect(textarea).toHaveValue("Hello 😀!"));
    await waitFor(() => expect(textarea).toHaveFocus());
    expect(textarea.selectionStart).toBe(8);
    expect(screen.queryByPlaceholderText("Search")).not.toBeInTheDocument();
  });

  it("does not exceed 1000 characters and closes on Escape or outside pointer", async () => {
    renderComposer();
    const textarea = screen.getByRole<HTMLTextAreaElement>("textbox");
    fireEvent.change(textarea, { target: { value: "x".repeat(999) } });
    textarea.setSelectionRange(999, 999);
    fireEvent.select(textarea);
    const trigger = screen.getByRole("button", { name: "Add emoji" });
    fireEvent.click(trigger);
    await screen.findByPlaceholderText("Search");
    fireEvent.click(await screen.findByLabelText("grinning face"));
    expect(textarea).toHaveValue("x".repeat(999));
    fireEvent.click(trigger);
    await screen.findByPlaceholderText("Search");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(textarea).toHaveFocus();
    expect(screen.queryByPlaceholderText("Search")).not.toBeInTheDocument();
    fireEvent.click(trigger);
    await screen.findByPlaceholderText("Search");
    fireEvent.pointerDown(document.body);
    expect(textarea).toHaveFocus();
    expect(screen.queryByPlaceholderText("Search")).not.toBeInTheDocument();
  });

  it("uses contextual discussion and review prompts", () => {
    renderComposer();
    expect(
      screen.getByRole("heading", { name: "Start a discussion" }),
    ).toBeVisible();
    expect(
      screen.getByPlaceholderText(
        "Ask a question or share feedback about this portfolio...",
      ),
    ).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Review" }));
    expect(
      screen.getByRole("heading", { name: "Write a portfolio review" }),
    ).toBeVisible();
    expect(
      screen.getByRole("radio", { name: "5/5 — Excellent" }),
    ).toBeVisible();
  });

  it("keeps posting identity and sign out in the composer header", () => {
    const onSignOut = vi.fn();
    renderComposer({
      accountName: "Evindo Amanda",
      isAuthor: true,
      onSignOut,
    });

    expect(screen.getByText("Posting as Evindo Amanda")).toBeVisible();
    expect(screen.getByText("· Author")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "· Sign out" }));
    expect(onSignOut).toHaveBeenCalledOnce();
  });

  it("blocks a second active review and offers editing", () => {
    const onEditReview = vi.fn();
    renderComposer({ hasActiveReview: true, onEditReview });
    fireEvent.click(screen.getByRole("button", { name: "Review" }));
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "A clear portfolio review." },
    });
    fireEvent.click(screen.getByRole("radio", { name: "5/5 — Excellent" }));
    expect(screen.getByRole("button", { name: "Post comment" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Edit your review" }));
    expect(onEditReview).toHaveBeenCalledOnce();
  });

  it("does not offer editing while an active review is under moderation", () => {
    renderComposer({ hasActiveReview: true, activeReviewHidden: true });
    fireEvent.click(screen.getByRole("button", { name: "Review" }));
    expect(
      screen.getByText(
        "Your review is hidden while under moderation. You cannot publish another review until it is restored or removed.",
      ),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Edit your review" }),
    ).not.toBeInTheDocument();
  });

  it("restores a local discussion draft", async () => {
    const first = renderComposer();
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Unfinished portfolio feedback" },
    });
    await waitFor(() =>
      expect(localStorage.getItem("guestbook-composer-draft")).toContain(
        "Unfinished portfolio feedback",
      ),
    );

    first.unmount();
    renderComposer();
    expect(screen.getByRole("textbox")).toHaveValue(
      "Unfinished portfolio feedback",
    );
  });

  it("submits one selected rating and clears the draft", async () => {
    const { props } = renderComposer();
    fireEvent.click(screen.getByRole("button", { name: "Review" }));
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Strong visual hierarchy and clear content." },
    });
    fireEvent.click(screen.getByRole("radio", { name: "4/5 — Very good" }));
    fireEvent.click(screen.getByRole("button", { name: "Post comment" }));
    await waitFor(() => expect(props.onSubmit).toHaveBeenCalledOnce());
    expect(props.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ entryType: "review", rating: 4 }),
    );
    expect(localStorage.getItem("guestbook-composer-draft")).toBeNull();
  });
});
