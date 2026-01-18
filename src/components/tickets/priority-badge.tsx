import { Badge } from "@/components/ui/badge";
import type { TicketPriority } from "@/db/schema";

interface PriorityBadgeProps {
  priority: TicketPriority;
}

const priorityLabels: Record<TicketPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  return <Badge variant={priority}>{priorityLabels[priority]}</Badge>;
}
