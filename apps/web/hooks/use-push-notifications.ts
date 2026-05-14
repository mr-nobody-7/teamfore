"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/lib/axios";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const buf = new ArrayBuffer(raw.length);
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i++) {
    bytes[i] = raw.charCodeAt(i);
  }
  return bytes;
}

function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return "";
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] =
    useState<NotificationPermission>("default");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);
    setPermission(Notification.permission);

    // Check if already subscribed
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        setIsSubscribed(sub !== null);
      })
      .catch(() => {
        // Service worker not ready yet — this is fine in dev mode
      });
  }, []);

  async function subscribe() {
    setIsLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm === "denied") {
        toast.error(
          "Notification permission denied. Enable in browser settings to get leave updates.",
        );
        return;
      }

      const { data } = await api.get<{ publicKey: string }>(
        "/push/vapid-public-key",
      );
      const applicationServerKey = urlBase64ToUint8Array(data.publicKey);

      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      await api.post("/push/subscribe", {
        endpoint: sub.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(sub.getKey("p256dh")),
          auth: arrayBufferToBase64(sub.getKey("auth")),
        },
      });

      setIsSubscribed(true);
      toast.success("Notifications enabled ✅");
    } catch {
      toast.error("Could not enable notifications. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function unsubscribe() {
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();

      if (sub) {
        await sub.unsubscribe();
        await api.delete("/push/subscribe", {
          data: { endpoint: sub.endpoint },
        });
      }

      setIsSubscribed(false);
    } catch {
      toast.error("Could not disable notifications. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscribe,
    unsubscribe,
  };
}
