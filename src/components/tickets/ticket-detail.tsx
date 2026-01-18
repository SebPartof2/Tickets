"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "./status-badge";
import { PriorityBadge } from "./priority-badge";
import { formatDate, cn } from "@/lib/utils";
import type { Ticket, Response, User as UserType, TicketStatus, TicketPriority } from "@/db/schema";

interface TicketDetailProps {
  ticket: Ticket & {
    user: Pick<UserType, "id" | "givenName" | "familyName" | "email">;
    responses: (Response & {
      user: Pick<UserType, "id" | "givenName" | "familyName" | "accessLevel">;
    })[];
  };
  currentUserId: string;
  isAdmin: boolean;
}

const statusOptions = [
  { value: "open", label: "Open" },
  { value: "in-progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const priorityOptions = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export function TicketDetail({
  ticket,
  currentUserId,
  isAdmin,
}: TicketDetailProps) {
  const router = useRouter();
  const [responseContent, setResponseContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<TicketStatus>(ticket.status);
  const [priority, setPriority] = useState<TicketPriority>(ticket.priority);

  async function handleSubmitResponse(e: React.FormEvent) {
    e.preventDefault();
    if (!responseContent.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/tickets/${ticket.id}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: responseContent }),
      });

      if (response.ok) {
        setResponseContent("");
        router.refresh();
      }
    } catch (error) {
      console.error("Error submitting response:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    setStatus(newStatus as TicketStatus);
    try {
      await fetch(`/api/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      router.refresh();
    } catch (error) {
      console.error("Error updating status:", error);
      setStatus(ticket.status);
    }
  }

  async function handlePriorityChange(newPriority: string) {
    setPriority(newPriority as TicketPriority);
    try {
      await fetch(`/api/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: newPriority }),
      });
      router.refresh();
    } catch (error) {
      console.error("Error updating priority:", error);
      setPriority(ticket.priority);
    }
  }

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/tickets">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-xl font-semibold flex-1 line-clamp-1">
          {ticket.title}
        </h1>
      </div>

      {/* Ticket Info */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={status} />
            <PriorityBadge priority={priority} />
            <span className="text-sm text-muted-foreground ml-auto">
              {formatDate(ticket.createdAt)}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>
              {ticket.user.givenName} {ticket.user.familyName}
            </span>
          </div>

          {/* Admin controls */}
          {isAdmin && (
            <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">
                  Status
                </label>
                <Select
                  options={statusOptions}
                  value={status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">
                  Priority
                </label>
                <Select
                  options={priorityOptions}
                  value={priority}
                  onChange={(e) => handlePriorityChange(e.target.value)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Responses */}
      <div className="space-y-3">
        <h2 className="font-medium">
          Responses ({ticket.responses.length})
        </h2>

        {ticket.responses.map((response) => (
          <Card
            key={response.id}
            className={cn(
              response.isAdminResponse && "border-primary/30 bg-primary/5"
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium text-sm">
                  {response.user.givenName} {response.user.familyName}
                </span>
                {response.isAdminResponse && (
                  <span className="text-xs px-1.5 py-0.5 bg-primary text-primary-foreground rounded">
                    Admin
                  </span>
                )}
                <span className="text-xs text-muted-foreground ml-auto">
                  {formatDate(response.createdAt)}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{response.content}</p>
            </CardContent>
          </Card>
        ))}

        {ticket.responses.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            No responses yet
          </p>
        )}
      </div>

      {/* Response Form */}
      {ticket.status !== "closed" && (
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleSubmitResponse} className="space-y-3">
              <Textarea
                placeholder="Write a response..."
                value={responseContent}
                onChange={(e) => setResponseContent(e.target.value)}
                className="min-h-[100px]"
              />
              <Button
                type="submit"
                disabled={isSubmitting || !responseContent.trim()}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? "Sending..." : "Send Response"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {ticket.status === "closed" && (
        <p className="text-sm text-muted-foreground text-center py-4">
          This ticket is closed and cannot receive new responses
        </p>
      )}
    </div>
  );
}
