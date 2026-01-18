import webpush from "web-push";
import { db } from "@/db";
import { pushSubscriptions, users } from "@/db/schema";
import { eq } from "drizzle-orm";

// Configure VAPID keys if available
if (
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
  process.env.VAPID_PRIVATE_KEY &&
  process.env.VAPID_EMAIL
) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
}

export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<void> {
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    console.log("Push notifications not configured, skipping");
    return;
  }

  try {
    const subscriptions = await db.query.pushSubscriptions.findMany({
      where: eq(pushSubscriptions.userId, userId),
    });

    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dhKey,
                auth: sub.authKey,
              },
            },
            JSON.stringify(payload)
          );
        } catch (error: unknown) {
          const statusCode = (error as { statusCode?: number }).statusCode;
          // Remove invalid subscriptions
          if (statusCode === 410 || statusCode === 404) {
            await db
              .delete(pushSubscriptions)
              .where(eq(pushSubscriptions.endpoint, sub.endpoint));
          }
          throw error;
        }
      })
    );
  } catch (error) {
    console.error("Error sending push notification:", error);
  }
}

export async function sendPushToAdmins(payload: PushPayload): Promise<void> {
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    console.log("Push notifications not configured, skipping");
    return;
  }

  try {
    const adminUsers = await db.query.users.findMany({
      where: eq(users.accessLevel, "admin"),
    });

    await Promise.allSettled(
      adminUsers.map((admin) => sendPushToUser(admin.id, payload))
    );
  } catch (error) {
    console.error("Error sending push to admins:", error);
  }
}
