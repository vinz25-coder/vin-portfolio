/* global self, URL */

self.addEventListener("push", (event) => {
  let notification = {};
  try {
    notification = event.data?.json() ?? {};
  } catch {
    notification = {};
  }

  event.waitUntil(
    self.registration.showNotification(
      notification.title || "New reply in Guestbook",
      {
        body: notification.body || "Someone replied to your post.",
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        data: { url: notification.url || "/guestbook" },
        tag: notification.url || "guestbook-reply",
      },
    ),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = new URL(
    event.notification.data?.url || "/guestbook",
    self.location.origin,
  ).href;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((client) =>
          client.url.startsWith(self.location.origin),
        );
        if (existing) {
          return existing.navigate(targetUrl).then(() => existing.focus());
        }
        return self.clients.openWindow(targetUrl);
      }),
  );
});
