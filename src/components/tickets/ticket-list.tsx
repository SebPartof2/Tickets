"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TicketCard } from "./ticket-card";
import type { Ticket, User } from "@/db/schema";

type TicketWithRelations = Ticket & {
  user: Pick<User, "givenName" | "familyName">;
  responses: { id: string }[];
};

interface TicketListProps {
  tickets: TicketWithRelations[];
  showUser: boolean;
}

export function TicketList({ tickets, showUser }: TicketListProps) {
  const activeTickets = tickets.filter(
    (t) => t.status === "open" || t.status === "in-progress"
  );
  const closedTickets = tickets.filter(
    (t) => t.status === "resolved" || t.status === "closed"
  );

  if (tickets.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">No tickets yet</p>
        <Button asChild>
          <Link href="/tickets/new">Create your first ticket</Link>
        </Button>
      </div>
    );
  }

  return (
    <Tabs defaultValue="active" className="w-full">
      <TabsList className="w-full grid grid-cols-2">
        <TabsTrigger value="active">
          Active ({activeTickets.length})
        </TabsTrigger>
        <TabsTrigger value="closed">
          Closed ({closedTickets.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="active">
        {activeTickets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No active tickets
          </div>
        ) : (
          <div className="space-y-3">
            {activeTickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                showUser={showUser}
              />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="closed">
        {closedTickets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No closed tickets
          </div>
        ) : (
          <div className="space-y-3">
            {closedTickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                showUser={showUser}
              />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
