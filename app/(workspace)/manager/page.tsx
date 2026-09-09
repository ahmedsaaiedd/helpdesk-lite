import type { Metadata } from "next";
import { AlertTriangle, CheckCircle2, CircleDotDashed, CirclePause, Inbox, TimerReset } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { PageAtmosphere } from "@/components/layout/page-atmosphere";
import { requireRole } from "@/lib/auth/require-user";
import { managerOverview } from "@/lib/data/tickets";

export const metadata: Metadata = { title: "Manager Overview" };

export default async function ManagerOverviewPage() {
  await requireRole("MANAGER");
  const data = await managerOverview();
  return (
    <div className="page-with-atmosphere soft-enter">
      <PageAtmosphere />
      <PageHeader eyebrow="Operations overview" title="Support workload, clearly" description="See what is open, what is waiting, and where ownership is needed." />
      <section aria-label="Operational summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard label="Open" value={data.open} note="New requests" href="/manager/requests?status=OPEN" icon={CircleDotDashed} />
        <StatCard label="In progress" value={data.inProgress} note="Work underway" href="/manager/requests?status=IN_PROGRESS" icon={TimerReset} tone="primary" />
        <StatCard label="Waiting" value={data.waiting} note="Pending input" href="/manager/requests?status=WAITING" icon={CirclePause} tone="warning" />
        <StatCard label="Unassigned" value={data.unassigned} note="Needs ownership" href="/manager/unassigned" icon={Inbox} tone="warning" />
        <StatCard label="Needs attention" value={data.stale} note="No update for 48+ hours" href="/manager/requests?attention=stale" icon={AlertTriangle} tone="warning" />
        <StatCard label="Recently resolved" value={data.resolved} note="Completed in the last 7 days" icon={CheckCircle2} tone="success" />
      </section>
      <section className="surface-panel mt-8 overflow-hidden">
        <div className="flex items-end justify-between gap-4 border-b p-5 sm:p-6"><div><h2 className="text-lg font-semibold">Team workload</h2><p className="mt-1 text-sm text-muted-foreground">Active tickets by support teammate</p></div><Link href="/manager/workload" className="text-sm font-semibold text-primary hover:underline">View details</Link></div>
        <div className="divide-y">{data.workload.map((agent) => <Link key={agent.id} href={"/manager/requests?assignee=" + agent.id} className="grid grid-cols-[1fr_auto] items-center gap-5 p-5 transition-colors hover:bg-accent/40 sm:px-6"><div><p className="font-semibold">{agent.name}</p><p className="mt-1 text-xs text-muted-foreground">{agent.highPriorityCount} high or urgent</p></div><div className="text-right"><p className="text-2xl font-semibold tabular-nums">{agent.activeCount}</p><p className="text-xs text-muted-foreground">active</p></div></Link>)}</div>
      </section>
    </div>
  );
}
