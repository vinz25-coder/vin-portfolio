import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Session } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import { LanguageProvider } from "../../context/LanguageContext";

const { togglePortfolioReaction } = vi.hoisted(() => ({
  togglePortfolioReaction: vi.fn(),
}));
vi.mock("../../data/guestbook", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../data/guestbook")>()),
  togglePortfolioReaction,
}));

import { PortfolioReactionBar } from "./PortfolioReactionBar";

describe("PortfolioReactionBar", () => {
  it("renders all reactions with counts and requests sign-in before toggling", () => {
    const onRequireSignIn = vi.fn();
    render(
      <LanguageProvider>
        <PortfolioReactionBar
          session={null}
          onRequireSignIn={onRequireSignIn}
        />
      </LanguageProvider>,
    );

    const labels = ["Thumbs up", "Love", "Fire", "Applause", "Rocket"];
    for (const label of labels) {
      expect(screen.getByRole("button", { name: label })).toHaveTextContent(
        "0",
      );
    }

    fireEvent.click(screen.getByRole("button", { name: "Thumbs up" }));
    expect(onRequireSignIn).toHaveBeenCalledOnce();
  });

  it("marks a selected reaction as an active pill", async () => {
    togglePortfolioReaction.mockResolvedValueOnce({
      reaction_type: "rocket",
      active: true,
      count: 1,
    });
    render(
      <LanguageProvider>
        <PortfolioReactionBar
          session={{ access_token: "token" } as Session}
          onRequireSignIn={vi.fn()}
        />
      </LanguageProvider>,
    );

    const rocket = screen.getByRole("button", { name: "Rocket" });
    fireEvent.click(rocket);
    await waitFor(() => expect(rocket).toHaveAttribute("aria-pressed", "true"));
    expect(rocket).toHaveTextContent("1");
    expect(rocket).toHaveClass("rounded-full");
  });
});
