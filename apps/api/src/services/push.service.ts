import webpush from "web-push";
import { prisma } from "../lib/db.js";

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_CONTACT_EMAIL ?? ""}`,
  process.env.VAPID_PUBLIC_KEY ?? "",
  process.env.VAPID_PRIVATE_KEY ?? "",
);

export async function saveSubscription(
  userId: string,
  subscription: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
    userAgent?: string;
  },
) {
  return prisma.pushSubscription.upsert({
    where: { userId_endpoint: { userId, endpoint: subscription.endpoint } },
    create: {
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userAgent: subscription.userAgent ?? null,
    },
    update: {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userAgent: subscription.userAgent ?? null,
    },
  });
}

export async function removeSubscription(userId: string, endpoint: string) {
  await prisma.pushSubscription.deleteMany({ where: { userId, endpoint } });
}

export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; url: string; icon?: string },
) {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  if (subscriptions.length === 0) return;

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload),
        );
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 410) {
          // Subscription expired — clean it up
          await prisma.pushSubscription.deleteMany({ where: { id: sub.id } });
        } else {
          console.error("[push] sendNotification error:", err);
        }
      }
    }),
  );
}

export async function sendPushToAll(
  workspaceId: string,
  payload: { title: string; body: string; url: string },
) {
  const users = await prisma.user.findMany({
    where: { workspaceId, isActive: true },
    select: { id: true },
  });

  if (users.length === 0) return;

  const results = await Promise.allSettled(
    users.map((u) => sendPushToUser(u.id, payload)),
  );

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  console.log(
    `[push] sendPushToAll: attempted=${users.length} succeeded=${succeeded}`,
  );
}
