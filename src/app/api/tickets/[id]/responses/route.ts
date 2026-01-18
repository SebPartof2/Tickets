import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { tickets, responses } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createResponseSchema } from "@/lib/validators";
import { sendPushToUser, sendPushToAdmins } from "@/lib/push";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const isAdmin = session.user.accessLevel === "admin";

    // Verify ticket access
    const ticket = await db.query.tickets.findFirst({
      where: isAdmin
        ? eq(tickets.id, id)
        : and(eq(tickets.id, id), eq(tickets.userId, session.user.id)),
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const responseList = await db.query.responses.findMany({
      where: eq(responses.ticketId, id),
      with: {
        user: {
          columns: {
            id: true,
            givenName: true,
            familyName: true,
            accessLevel: true,
          },
        },
      },
      orderBy: (responses, { asc }) => [asc(responses.createdAt)],
    });

    return NextResponse.json(responseList);
  } catch (error) {
    console.error("Error fetching responses:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const isAdmin = session.user.accessLevel === "admin";

    // Verify ticket access
    const ticket = await db.query.tickets.findFirst({
      where: isAdmin
        ? eq(tickets.id, id)
        : and(eq(tickets.id, id), eq(tickets.userId, session.user.id)),
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const body = await request.json();
    const validated = createResponseSchema.parse(body);

    const [newResponse] = await db
      .insert(responses)
      .values({
        ticketId: id,
        userId: session.user.id,
        content: validated.content,
        isAdminResponse: isAdmin,
      })
      .returning();

    // Update ticket's updatedAt
    await db
      .update(tickets)
      .set({ updatedAt: new Date() })
      .where(eq(tickets.id, id));

    // Send push notifications
    if (isAdmin) {
      // Admin responded, notify ticket owner
      await sendPushToUser(ticket.userId, {
        title: "New Response",
        body: `Admin responded to your ticket: ${ticket.title}`,
        url: `/tickets/${id}`,
      });
    } else {
      // User responded, notify all admins
      await sendPushToAdmins({
        title: "New Response",
        body: `${session.user.name} responded to: ${ticket.title}`,
        url: `/tickets/${id}`,
      });
    }

    // Fetch the response with user data
    const responseWithUser = await db.query.responses.findFirst({
      where: eq(responses.id, newResponse.id),
      with: {
        user: {
          columns: {
            id: true,
            givenName: true,
            familyName: true,
            accessLevel: true,
          },
        },
      },
    });

    return NextResponse.json(responseWithUser, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    console.error("Error creating response:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
