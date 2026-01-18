import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "./status-badge";
import { PriorityBadge } from "./priority-badge";
import { formatRelativeTime } from "@/lib/utils";
import type { Ticket, User } from "@/db/schema";

interface TicketCardProps {
  ticket: Ticket & {
    user: Pick<User, "givenName" | "familyName">;
    responses: { id: string }[];
  };
  showUser?: boolean;
}

export function TicketCard({ ticket, showUser = false }: TicketCardProps) {
  return (
    <Link href={`/tickets/${ticket.id}`}>
      <Card className="hover:bg-accent/50 transition-colors active:scale-[0.99]">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-medium line-clamp-2 flex-1">{ticket.title}</h3>
              <StatusBadge status={ticket.status} />
            </div>

            <p className="text-sm text-muted-foreground line-clamp-2">
              {ticket.description}
            </p>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-3">
                <PriorityBadge priority={ticket.priority} />
                {showUser && (
                  <span>
                    {ticket.user.givenName} {ticket.user.familyName}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {ticket.responses.length}
                </span>
                <span>{formatRelativeTime(ticket.createdAt)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
