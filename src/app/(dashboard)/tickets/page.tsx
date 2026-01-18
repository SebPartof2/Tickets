import { auth } from "@/auth";
import { db } from "@/db";
import { tickets } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { TicketList } from "@/components/tickets/ticket-list";
import { TicketsHeader } from "@/components/tickets/tickets-header";

export default async function TicketsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const isAdmin = session.user.accessLevel === "admin";

  const ticketList = await db.query.tickets.findMany({
    where: isAdmin ? undefined : eq(tickets.userId, session.user.id),
    orderBy: [desc(tickets.createdAt)],
    with: {
      user: {
        columns: {
          givenName: true,
          familyName: true,
        },
      },
      responses: {
        columns: {
          id: true,
        },
      },
    },
  });

  return (
    <div className="p-4 space-y-4">
      <TicketsHeader title={isAdmin ? "All Tickets" : "My Tickets"} />
      <TicketList tickets={ticketList} showUser={isAdmin} />
    </div>
  );
}
