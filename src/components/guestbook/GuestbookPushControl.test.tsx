import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Session } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LanguageProvider } from "../../context/LanguageContext";
import { GuestbookPushControl } from "./GuestbookPushControl";

const requestPermission = vi.fn();
const getSubscription = vi.fn();
const subscribe = vi.fn();
const register = vi.fn();
const unsubscribe = vi.fn();

const pushSubscription = {
  endpoint: "https://push.example.com/subscription/123",
  toJSON: () => ({ keys: { p256dh: "public-key", auth: "auth-key" } }),
  unsubscribe,
};

const session = {
  access_token: "access-token",
  user: { id: "user-id" },
} as Session;

describe("GuestbookPushControl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("VITE_WEB_PUSH_VAPID_PUBLIC_KEY", "AQIDBA");
    Object.defineProperty(window, "PushManager", {
      configurable: true,
      value: class PushManager {},
    });
    Object.defineProperty(window, "Notification", {
      configurable: true,
      value: { requestPermission },
    });
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: {
        register,
        ready: Promise.resolve({ pushManager: { subscribe } }),
      },
    });
    register.mockResolvedValue({ pushManager: { getSubscription } });
    getSubscription.mockResolvedValue(null);
    requestPermission.mockResolvedValue("granted");
    subscribe.mockResolvedValue(pushSubscription);
    unsubscribe.mockResolvedValue(true);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
  });

  function renderControl() {
    render(
      <LanguageProvider>
        <GuestbookPushControl session={session} />
      </LanguageProvider>,
    );
  }

  it("does not request permission until the user opts in", async () => {
    renderControl();
    await waitFor(() => expect(register).toHaveBeenCalledOnce());
    expect(requestPermission).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole("button", { name: "Enable reply notifications" }),
    );
    await waitFor(() => expect(requestPermission).toHaveBeenCalledOnce());
    expect(fetch).toHaveBeenCalledWith(
      "/api/guestbook/push-subscription",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("removes the current browser subscription", async () => {
    getSubscription.mockResolvedValue(pushSubscription);
    renderControl();
    const disable = await screen.findByRole("button", {
      name: "Disable notifications",
    });
    fireEvent.click(disable);
    await waitFor(() => expect(unsubscribe).toHaveBeenCalledOnce());
    expect(fetch).toHaveBeenCalledWith(
      "/api/guestbook/push-subscription",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});
