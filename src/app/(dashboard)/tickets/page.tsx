import Link from "next/link";
import { Plus } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/db";
import { tickets } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { TicketCard } from "@/components/tickets/ticket-card";

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
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          {isAdmin ? "All Tickets" : "My Tickets"}
        </h1>
        <Button asChild size="sm" className="hidden md:flex">
          <Link href="/tickets/new">
            <Plus className="h-4 w-4" />
            New Ticket
          </Link>
        </Button>
      </div>

      {ticketList.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No tickets yet</p>
          <Button asChild>
            <Link href="/tickets/new">Create your first ticket</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {ticketList.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              showUser={isAdmin}
            />
          ))}
        </div>
      )}
    </div>
  );
}
