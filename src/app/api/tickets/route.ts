import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { tickets } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { createTicketSchema } from "@/lib/validators";
import { sendPushToAdmins } from "@/lib/push";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = session.user.accessLevel === "admin";

    const ticketList = await db.query.tickets.findMany({
      where: isAdmin ? undefined : eq(tickets.userId, session.user.id),
      orderBy: [desc(tickets.createdAt)],
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
          columns: {
            id: true,
          },
        },
      },
    });

    return NextResponse.json(ticketList);
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = createTicketSchema.parse(body);

    const [newTicket] = await db
      .insert(tickets)
      .values({
        userId: session.user.id,
        title: validated.title,
        description: validated.description,
        priority: validated.priority,
        status: "open",
      })
      .returning();

    // Send push notification to all admins
    await sendPushToAdmins({
      title: "New Support Ticket",
      body: `${session.user.name} submitted: ${validated.title}`,
      url: `/tickets/${newTicket.id}`,
    });

    return NextResponse.json(newTicket, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    console.error("Error creating ticket:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
