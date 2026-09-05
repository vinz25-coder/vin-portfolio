import type { Session } from "@supabase/supabase-js";
import { Bell, BellOff } from "lucide-react";
import { useEffect, useState } from "react";

import { useLanguage } from "../../hooks/useLanguage";

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
}

function serializeSubscription(subscription: PushSubscription) {
  const value = subscription.toJSON();
  return {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: value.keys?.p256dh ?? "",
      auth: value.keys?.auth ?? "",
    },
  };
}

async function saveSubscription(token: string, value: PushSubscription) {
  const response = await fetch("/api/guestbook/push-subscription", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(serializeSubscription(value)),
  });
  if (!response.ok) throw new Error("SUBSCRIPTION_FAILED");
}

export function isWebPushSupported() {
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

interface GuestbookPushControlProps {
  session: Session;
}

export function GuestbookPushControl({ session }: GuestbookPushControlProps) {
  const { copy } = useLanguage();
  const notificationCopy = copy.guestbook.notifications;
  const publicKey = import.meta.env.VITE_WEB_PUSH_VAPID_PUBLIC_KEY as
    string | undefined;
  const supported = isWebPushSupported() && Boolean(publicKey);
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!supported) return;
    let active = true;
    void navigator.serviceWorker
      .register("/guestbook-sw.js", { scope: "/" })
      .then((registration) => registration.pushManager.getSubscription())
      .then(async (value) => {
        if (!value) return;
        try {
          await saveSubscription(session.access_token, value);
          if (active) setSubscription(value);
        } catch {
          await value.unsubscribe();
          if (active) {
            setSubscription(null);
            setStatus(notificationCopy.failed);
          }
        }
      })
      .catch(() => {
        if (active) setStatus(notificationCopy.failed);
      });
    return () => {
      active = false;
    };
  }, [notificationCopy.failed, session.access_token, supported]);

  if (!supported) return null;

  const enable = async () => {
    if (!publicKey || busy) return;
    setBusy(true);
    setStatus("");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(notificationCopy.denied);
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const nextSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      try {
        await saveSubscription(session.access_token, nextSubscription);
      } catch {
        await nextSubscription.unsubscribe();
        throw new Error("SUBSCRIPTION_FAILED");
      }
      setSubscription(nextSubscription);
      setStatus(notificationCopy.enabled);
    } catch {
      setStatus(notificationCopy.failed);
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    if (!subscription || busy) return;
    setBusy(true);
    setStatus("");
    try {
      const response = await fetch("/api/guestbook/push-subscription", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
      if (!response.ok) throw new Error("UNSUBSCRIBE_FAILED");
      await subscription.unsubscribe();
      setSubscription(null);
      setStatus(notificationCopy.disabled);
    } catch {
      setStatus(notificationCopy.failed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={busy}
        className="flex min-h-10 items-center gap-2 rounded-xl border border-border px-3 font-semibold hover:border-accent-500 hover:text-accent-500 disabled:opacity-60"
        onClick={() => void (subscription ? disable() : enable())}
      >
        {subscription ? <BellOff size={15} /> : <Bell size={15} />}
        {subscription ? notificationCopy.disable : notificationCopy.enable}
      </button>
      <span aria-live="polite" className="max-w-64 text-right text-[0.6875rem]">
        {status}
      </span>
    </div>
  );
}
