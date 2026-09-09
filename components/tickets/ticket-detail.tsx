import type { Role } from "@prisma/client";
import { ArrowLeft, CalendarDays, Clock3, MessageSquareText, UserRound, Wrench } from "lucide-react";
import Link from "next/link";
import { ACTIVITY_LABELS, CATEGORY_LABELS, PRIORITY_LABELS, STATUS_LABELS, type TicketActivityKind } from "@/lib/domain";
import { formatElapsed, formatExact, formatRelative, initials } from "@/lib/format";
import type { TicketDetail as TicketDetailType } from "@/lib/data/tickets";
import { AttentionBadge, PriorityBadge, StatusBadge } from "./ticket-badges";
import { RequesterReplyForm } from "./requester-reply-form";
import { SupportControls } from "./support-controls";

export function TicketDetail({
  ticket,
  role,
  currentUserId,
  supportUsers = [],
  backHref,
}: {
  ticket: TicketDetailType;
  role: Role;
  currentUserId: string;
  supportUsers?: { id: string; name: string; email: string }[];
  backHref: string;
}) {
  return (
    <div className="soft-enter">
      <Link href={backHref} className="mb-5 inline-flex min-h-10 items-center gap-2 rounded-lg px-1 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" />Back to tickets
      </Link>

      <header className="ticket-hero mb-6 px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="font-mono text-xs font-bold tracking-[0.08em] text-primary">{ticket.displayId}</span>
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
          <AttentionBadge status={ticket.status} updatedAt={ticket.updatedAt} />
        </div>
        <h1 className="balanced mt-3 max-w-4xl text-3xl font-semibold leading-tight tracking-[-0.035em] sm:text-[2.15rem]">{ticket.title}</h1>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
        <div className="space-y-6">
          <section className="surface-panel p-5 sm:p-7">
            <div className="flex items-center gap-2 text-sm font-semibold"><MessageSquareText className="size-4 text-primary" />Original request</div>
            <p className="mt-4 whitespace-pre-wrap break-words text-[1rem] leading-7 text-foreground/90">{ticket.description}</p>
          </section>

          {role === "EMPLOYEE" && ticket.status === "WAITING" ? <RequesterReplyForm ticketId={ticket.id} version={ticket.version} /> : null}

          <section className="surface-panel p-5 sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm font-semibold"><Clock3 className="size-4 text-primary" />Activity</div>
              <span className="text-xs text-muted-foreground">{ticket.activities.length} update{ticket.activities.length === 1 ? "" : "s"}</span>
            </div>
            <ol className="relative mt-6 space-y-0 before:absolute before:bottom-4 before:left-[17px] before:top-4 before:w-px before:bg-border">
              {ticket.activities.map((activity) => (
                <li key={activity.id} className="relative flex gap-4 pb-7 last:pb-0">
                  <span className="relative z-10 grid size-9 shrink-0 place-items-center rounded-xl border bg-card text-[10px] font-bold text-primary shadow-sm">{initials(activity.actor.name)}</span>
                  <div className="min-w-0 pt-0.5">
                    <p className="text-sm leading-6"><span className="font-semibold">{activity.actor.name}</span> <span className="text-muted-foreground">{ACTIVITY_LABELS[activity.type]}</span></p>
                    {activity.content ? <p className="mt-1 whitespace-pre-wrap break-words rounded-xl bg-muted/65 px-3.5 py-2.5 text-sm leading-6">{friendlyActivityContent(activity.type, activity.content)}</p> : null}
                    <time dateTime={activity.createdAt.toISOString()} title={formatExact(activity.createdAt)} className="mt-1.5 block text-xs text-muted-foreground">{formatRelative(activity.createdAt)}</time>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="surface-panel p-5">
            <h2 className="text-sm font-semibold">Ticket information</h2>
            <dl className="mt-4 space-y-4">
              <Meta icon={UserRound} label="Requester" value={ticket.requester.name} />
              <Meta icon={Wrench} label="Owner" value={ticket.assignee?.name || "Unassigned"} />
              <Meta icon={CalendarDays} label="Category" value={CATEGORY_LABELS[ticket.category]} />
              <Meta icon={Clock3} label="Open for" value={formatElapsed(ticket.createdAt)} />
              <Meta icon={CalendarDays} label="Created" value={formatExact(ticket.createdAt)} />
              <Meta icon={Clock3} label="Last updated" value={formatExact(ticket.updatedAt)} />
              {ticket.resolvedAt ? <Meta icon={Clock3} label="Resolved" value={formatExact(ticket.resolvedAt)} /> : null}
            </dl>
          </section>

          {role === "SUPPORT" || role === "MANAGER" ? (
            <section className="surface-panel p-5">
              <div className="mb-4">
                <p className="text-sm font-semibold">{role === "MANAGER" ? "Manager controls" : "Support controls"}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">Only the current owner or a manager can edit. Changes are recorded in activity.</p>
              </div>
              <SupportControls key={ticket.id + "-" + ticket.version} ticketId={ticket.id} version={ticket.version} role={role} status={ticket.status} priority={ticket.priority} category={ticket.category} assigneeId={ticket.assigneeId} currentUserId={currentUserId} supportUsers={supportUsers} />
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function Meta({ icon: Icon, label, value }: { icon: typeof UserRound; label: string; value: string }) {
  return (
    <div className="grid grid-cols-[28px_1fr] gap-2.5">
      <span className="grid size-7 place-items-center rounded-lg bg-muted text-muted-foreground"><Icon className="size-3.5" aria-hidden="true" /></span>
      <div className="min-w-0"><dt className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">{label}</dt><dd className="mt-0.5 break-words text-sm font-medium">{value}</dd></div>
    </div>
  );
}

function friendlyActivityContent(type: TicketActivityKind, content: string) {
  if (type === "STATUS_CHANGED") return replaceLabels(content, STATUS_LABELS);
  if (type === "PRIORITY_CHANGED") return replaceLabels(content, PRIORITY_LABELS);
  if (type === "CATEGORY_CHANGED") return replaceLabels(content, CATEGORY_LABELS);
  return content;
}

function replaceLabels(content: string, labels: Record<string, string>) {
  return Object.entries(labels).reduce((value, [key, label]) => value.replaceAll(key, label), content);
}
