import type { TicketPriority, TicketStatus } from "@prisma/client";
import { AlertTriangle, Circle, CircleCheck, CircleDashed, Clock3, Flame, Minus, SignalHigh, SignalLow } from "lucide-react";
import { isTicketStale, PRIORITY_LABELS, STATUS_LABELS } from "@/lib/domain";
import { formatElapsed, formatExact } from "@/lib/format";
import { cn } from "@/lib/utils";

const statusStyle: Record<TicketStatus, string> = {
  OPEN: "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  IN_PROGRESS: "border-primary/25 bg-primary/10 text-primary",
  WAITING: "border-warning/25 bg-warning/10 text-warning",
  RESOLVED: "border-success/25 bg-success/10 text-success",
};

const statusIcon = {
  OPEN: Circle,
  IN_PROGRESS: Clock3,
  WAITING: CircleDashed,
  RESOLVED: CircleCheck,
};

const priorityStyle: Record<TicketPriority, string> = {
  LOW: "text-muted-foreground",
  MEDIUM: "text-foreground",
  HIGH: "text-warning",
  URGENT: "text-destructive",
};

const priorityIcon = { LOW: SignalLow, MEDIUM: Minus, HIGH: SignalHigh, URGENT: Flame };

export function StatusBadge({ status }: { status: TicketStatus }) {
  const Icon = statusIcon[status];
  return (
    <span className={cn("inline-flex min-h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold", statusStyle[status])}>
      <Icon className="size-3.5" aria-hidden="true" />
      {STATUS_LABELS[status]}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const Icon = priorityIcon[priority];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold", priorityStyle[priority])}>
      <Icon className="size-3.5" aria-hidden="true" />
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

export function AttentionBadge({ status, updatedAt, className }: { status: TicketStatus; updatedAt: Date; className?: string }) {
  if (!isTicketStale({ status, updatedAt })) return null;
  return (
    <span
      title={"Last updated " + formatExact(updatedAt)}
      className={cn("inline-flex min-h-7 items-center gap-1.5 rounded-full border border-destructive/25 bg-destructive/10 px-2.5 text-xs font-semibold text-destructive", className)}
    >
      <AlertTriangle className="size-3.5" aria-hidden="true" />
      No update for {formatElapsed(updatedAt)}
    </span>
  );
}
