import Link from "next/link";
import { Plus } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/db";
import { tickets } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { TicketList } from "@/components/tickets/ticket-list";

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

      <TicketList tickets={ticketList} showUser={isAdmin} />
    </div>
  );
}
