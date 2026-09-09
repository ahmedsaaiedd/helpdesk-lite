import { Inbox, UserRound } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CATEGORY_LABELS } from "@/lib/domain";
import { formatElapsed, formatExact, formatRelative, initials } from "@/lib/format";
import type { TicketListItem } from "@/lib/data/tickets";
import { AttentionBadge, PriorityBadge, StatusBadge } from "./ticket-badges";

export function TicketList({
  tickets,
  basePath,
  emptyTitle = "No tickets match this view.",
  emptyDescription = "Try clearing a filter or check again later.",
  emptyAction,
}: {
  tickets: TicketListItem[];
  basePath: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: { href: string; label: string };
}) {
  if (!tickets.length) {
    return (
      <div className="surface-panel relative grid min-h-72 place-items-center overflow-hidden p-8 text-center">
        <div aria-hidden="true" className="empty-state-pattern" />
        <div className="relative">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground"><Inbox className="size-5" aria-hidden="true" /></span>
          <h2 className="mt-4 text-lg font-semibold">{emptyTitle}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{emptyDescription}</p>
          {emptyAction ? <Button asChild className="mt-5 rounded-xl"><Link href={emptyAction.href}>{emptyAction.label}</Link></Button> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="surface-panel overflow-hidden">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[860px] border-collapse text-left">
          <thead>
            <tr className="border-b bg-muted/50 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              <th scope="col" className="px-5 py-3.5">Ticket</th>
              <th scope="col" className="px-4 py-3.5">Requester</th>
              <th scope="col" className="px-4 py-3.5">Priority</th>
              <th scope="col" className="px-4 py-3.5">Status</th>
              <th scope="col" className="px-4 py-3.5">Owner</th>
              <th scope="col" className="px-5 py-3.5 text-right">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="group soft-enter transition-colors hover:bg-accent/45">
                <td className="max-w-[360px] px-5 py-4">
                  <Link href={basePath + "/" + ticket.id} className="block rounded-md focus-visible:outline-offset-4">
                    <span className="font-mono text-[11px] font-bold tracking-wide text-primary">{ticket.displayId}</span>
                    <span className="mt-1 block truncate text-sm font-semibold group-hover:text-primary">{ticket.title}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">{CATEGORY_LABELS[ticket.category]}</span>
                    <AttentionBadge status={ticket.status} updatedAt={ticket.updatedAt} className="mt-2" />
                  </Link>
                </td>
                <td className="px-4 py-4 text-sm">{ticket.requester.name}</td>
                <td className="px-4 py-4"><PriorityBadge priority={ticket.priority} /></td>
                <td className="px-4 py-4"><StatusBadge status={ticket.status} /></td>
                <td className="px-4 py-4">
                  {ticket.assignee ? (
                    <span className="flex items-center gap-2 text-sm"><span className="grid size-7 place-items-center rounded-lg bg-muted text-[10px] font-bold">{initials(ticket.assignee.name)}</span>{ticket.assignee.name}</span>
                  ) : <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground"><UserRound className="size-3.5" />Unassigned</span>}
                </td>
                <td className="px-5 py-4 text-right text-xs text-muted-foreground"><time dateTime={ticket.updatedAt.toISOString()} title={formatExact(ticket.updatedAt)}>{formatRelative(ticket.updatedAt)}</time></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y md:hidden">
        {tickets.map((ticket) => (
          <Link key={ticket.id} href={basePath + "/" + ticket.id} className="soft-enter block p-4 transition-colors hover:bg-accent/45">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <span className="font-mono text-[11px] font-bold tracking-wide text-primary">{ticket.displayId}</span>
                <h3 className="mt-1 line-clamp-2 font-semibold leading-5">{ticket.title}</h3>
              </div>
              <PriorityBadge priority={ticket.priority} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2"><StatusBadge status={ticket.status} /><AttentionBadge status={ticket.status} updatedAt={ticket.updatedAt} /><span className="text-xs text-muted-foreground">{CATEGORY_LABELS[ticket.category]}</span></div>
            <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground"><span className="truncate">{ticket.assignee?.name || "Unassigned"} · open {formatElapsed(ticket.createdAt)}</span><time title={formatExact(ticket.updatedAt)}>{formatRelative(ticket.updatedAt)}</time></div>
          </Link>
        ))}
      </div>
    </div>
  );
}
