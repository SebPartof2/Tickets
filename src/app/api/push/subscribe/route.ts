import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = subscribeSchema.parse(body);

    // Check if subscription already exists
    const existing = await db.query.pushSubscriptions.findFirst({
      where: eq(pushSubscriptions.endpoint, validated.endpoint),
    });

    if (existing) {
      // Update if exists
      await db
        .update(pushSubscriptions)
        .set({
          userId: session.user.id,
          p256dhKey: validated.keys.p256dh,
          authKey: validated.keys.auth,
        })
        .where(eq(pushSubscriptions.endpoint, validated.endpoint));
    } else {
      // Create new subscription
      await db.insert(pushSubscriptions).values({
        userId: session.user.id,
        endpoint: validated.endpoint,
        p256dhKey: validated.keys.p256dh,
        authKey: validated.keys.auth,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    console.error("Error saving subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
