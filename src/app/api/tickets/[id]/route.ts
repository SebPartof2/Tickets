import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { tickets } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { updateTicketSchema } from "@/lib/validators";
import { sendPushToUser } from "@/lib/push";

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

    const ticket = await db.query.tickets.findFirst({
      where: isAdmin
        ? eq(tickets.id, id)
        : and(eq(tickets.id, id), eq(tickets.userId, session.user.id)),
      with: {
        user: {
          columns: {
            id: true,
            givenName: true,
            familyName: true,
            email: true,
          },
        },
        responses: {
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
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("Error fetching ticket:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    // Find the ticket
    const existingTicket = await db.query.tickets.findFirst({
      where: eq(tickets.id, id),
    });

    if (!existingTicket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Check permissions
    const isOwner = existingTicket.userId === session.user.id;
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validated = updateTicketSchema.parse(body);

    // Non-admins can only update title and description of their own tickets
    const updateData: Partial<typeof validated> & { updatedAt: Date } = {
      updatedAt: new Date(),
    };

    if (isAdmin) {
      if (validated.status) updateData.status = validated.status;
      if (validated.priority) updateData.priority = validated.priority;
    }

    if (isOwner) {
      if (validated.title) updateData.title = validated.title;
      if (validated.description) updateData.description = validated.description;
    }

    const [updatedTicket] = await db
      .update(tickets)
      .set(updateData)
      .where(eq(tickets.id, id))
      .returning();

    // Notify ticket owner if status changed by admin
    if (isAdmin && validated.status && !isOwner) {
      await sendPushToUser(existingTicket.userId, {
        title: "Ticket Updated",
        body: `Your ticket "${existingTicket.title}" status changed to ${validated.status}`,
        url: `/tickets/${id}`,
      });
    }

    return NextResponse.json(updatedTicket);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    console.error("Error updating ticket:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = session.user.accessLevel === "admin";
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    await db.delete(tickets).where(eq(tickets.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting ticket:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
