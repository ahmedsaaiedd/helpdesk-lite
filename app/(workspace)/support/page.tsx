import type { Metadata } from "next";
import { CircleDotDashed, Inbox, TimerReset, UserRoundCheck } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { PageAtmosphere } from "@/components/layout/page-atmosphere";
import { TicketList } from "@/components/tickets/ticket-list";
import { requireRole } from "@/lib/auth/require-user";
import { supportOverview } from "@/lib/data/tickets";

export const metadata: Metadata = { title: "Support Overview" };

export default async function SupportOverviewPage() {
  const user = await requireRole("SUPPORT");
  const data = await supportOverview(user.id);
  return (
    <div className="page-with-atmosphere soft-enter">
      <PageAtmosphere />
      <PageHeader eyebrow="Support overview" title="Keep the queue moving" description="Start with unassigned work, then focus on the tickets already in your hands." />
      <section aria-label="Queue summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Unassigned" value={data.unassigned} note="Waiting for an owner" href="/support/tickets?owner=unassigned" icon={Inbox} tone="warning" />
        <StatCard label="Assigned to me" value={data.assignedToMe} note="Active tickets you own" href="/support/my-tickets" icon={UserRoundCheck} tone="primary" />
        <StatCard label="Open" value={data.open} note="New requests in the queue" href="/support/tickets?status=OPEN" icon={CircleDotDashed} />
        <StatCard label="In progress" value={data.inProgress} note="Work currently underway" href="/support/tickets?status=IN_PROGRESS" icon={TimerReset} tone="success" />
      </section>
      <section className="mt-8"><div className="mb-4"><h2 className="text-lg font-semibold">Recently updated</h2><p className="mt-1 text-sm text-muted-foreground">The latest movement across support</p></div><TicketList tickets={data.recent} basePath="/support/tickets" emptyTitle="You are all caught up." emptyDescription="New and updated requests will appear here." /></section>
    </div>
  );
}
