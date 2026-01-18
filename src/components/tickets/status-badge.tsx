import { Badge } from "@/components/ui/badge";
import type { TicketStatus } from "@/db/schema";

interface StatusBadgeProps {
  status: TicketStatus;
}

const statusLabels: Record<TicketStatus, string> = {
  open: "Open",
  "in-progress": "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return <Badge variant={status}>{statusLabels[status]}</Badge>;
}
