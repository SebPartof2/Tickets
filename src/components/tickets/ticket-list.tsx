"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TicketCard } from "./ticket-card";
import { cn } from "@/lib/utils";
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
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const isPulling = useRef(false);
  const threshold = 80;

  const activeTickets = tickets.filter(
    (t) => t.status === "open" || t.status === "in-progress"
  );
  const closedTickets = tickets.filter(
    (t) => t.status === "resolved" || t.status === "closed"
  );

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isPulling.current || refreshing) return;

      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;

      if (diff > 0 && window.scrollY === 0) {
        setPullDistance(Math.min(diff * 0.5, threshold * 1.5));
      }
    },
    [refreshing]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current) return;
    isPulling.current = false;

    if (pullDistance >= threshold && !refreshing) {
      setRefreshing(true);
      router.refresh();
      await new Promise((resolve) => setTimeout(resolve, 500));
      setRefreshing(false);
    }

    setPullDistance(0);
  }, [pullDistance, refreshing, router]);

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
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      <div
        className={cn(
          "flex items-center justify-center transition-all duration-200 overflow-hidden -mt-4 mb-2",
          pullDistance === 0 && "hidden"
        )}
        style={{ height: pullDistance }}
      >
        <RefreshCw
          className={cn(
            "h-5 w-5 text-muted-foreground transition-transform",
            refreshing && "animate-spin",
            pullDistance >= threshold && !refreshing && "text-primary"
          )}
          style={{
            transform: refreshing ? undefined : `rotate(${(pullDistance / threshold) * 180}deg)`,
          }}
        />
      </div>

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
    </div>
  );
}
