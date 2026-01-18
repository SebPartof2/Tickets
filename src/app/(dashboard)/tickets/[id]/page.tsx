import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { tickets } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { TicketDetail } from "@/components/tickets/ticket-detail";

interface TicketPageProps {
  params: Promise<{ id: string }>;
}

export default async function TicketPage({ params }: TicketPageProps) {
  const session = await auth();
  if (!session?.user) return null;

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
    notFound();
  }

  return (
    <TicketDetail
      ticket={ticket}
      currentUserId={session.user.id}
      isAdmin={isAdmin}
    />
  );
}
