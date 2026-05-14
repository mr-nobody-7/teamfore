/// <reference lib="webworker" />

import {
  CacheFirst,
  ExpirationPlugin,
  NavigationRoute,
  NetworkFirst,
  Route,
  type RouteMatchCallbackOptions,
  Serwist,
} from "serwist";

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (string | { revision: string | null; url: string })[];
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  precacheOptions: { cleanupOutdatedCaches: true },
  navigationPreload: false,
});

// ── Offline fallback ─────────────────────────────────────────────────────────
serwist.registerRoute(
  new NavigationRoute(
    new NetworkFirst({
      cacheName: "navigation-cache",
      networkTimeoutSeconds: 3,
      plugins: [new ExpirationPlugin({ maxEntries: 50 })],
    }),
    { denylist: [/\/api\//] },
  ),
);

// Fallback to cached page or /offline for navigation failures when offline.
self.addEventListener("fetch", (event: FetchEvent) => {
  if (event.request.mode !== "navigate") {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        return await fetch(event.request);
      } catch {
        const cachedNavigation = await caches.match(event.request, {
          ignoreSearch: true,
        });
        if (cachedNavigation) {
          return cachedNavigation;
        }

        const offlineFallback = await caches.match("/offline");
        if (offlineFallback) {
          return offlineFallback;
        }

        return Response.error();
      }
    })(),
  );
});

// ── Static assets (icons, screenshots) ──────────────────────────────────────
serwist.registerRoute(
  new Route(
    ({ url }: RouteMatchCallbackOptions) =>
      /^\/icons\//.test(url.pathname) || /^\/screenshots\//.test(url.pathname),
    new CacheFirst({
      cacheName: "static-assets",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 20,
          maxAgeSeconds: 60 * 60 * 24 * 30,
        }),
      ],
    }),
  ),
);

// ── API calls ────────────────────────────────────────────────────────────────
const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "";

serwist.registerRoute(
  new Route(
    ({ url, request }: RouteMatchCallbackOptions) =>
      request.mode !== "navigate" &&
      (url.pathname.startsWith("/api/") ||
        (apiBase !== "" && url.href.startsWith(apiBase))),
    new NetworkFirst({
      cacheName: "api-cache",
      networkTimeoutSeconds: 10,
      plugins: [
        new ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 60 * 5,
        }),
      ],
    }),
  ),
);

// ── Push notifications ───────────────────────────────────────────────────────
self.addEventListener("push", (event: PushEvent) => {
  if (!event.data) return;

  const { title, body, url, icon } = event.data.json() as {
    title: string;
    body: string;
    url?: string;
    icon?: string;
  };

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: icon ?? "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: url ?? "/dashboard" },
      vibrate: [200, 100, 200],
      tag: "teamfore-notification",
      renotify: true,
      actions: [
        { action: "open", title: "View" },
        { action: "dismiss", title: "Dismiss" },
      ],
    }),
  );
});

// ── Notification click ───────────────────────────────────────────────────────
self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const targetUrl: string =
    (event.notification.data as { url?: string })?.url ?? "/dashboard";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients: readonly WindowClient[]) => {
        for (const client of windowClients) {
          if (client.url === targetUrl && "focus" in client) {
            return client.focus();
          }
        }
        return self.clients.openWindow(targetUrl);
      }),
  );
});

serwist.addEventListeners();
