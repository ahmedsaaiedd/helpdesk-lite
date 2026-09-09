import type { Metadata } from "next";
import { ArrowUpRight, Flame, Inbox, UsersRound } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { requireRole } from "@/lib/auth/require-user";
import { getWorkload } from "@/lib/data/tickets";
import { initials } from "@/lib/format";

export const metadata: Metadata = { title: "Team Workload" };

export default async function WorkloadPage() {
  await requireRole("MANAGER");
  const workload = await getWorkload();
  return (
    <div className="soft-enter"><PageHeader eyebrow="Team capacity" title="Team Workload" description="Active assignments without rankings, scores, or vanity metrics." icon={UsersRound} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{workload.map((agent) => (
        <Link key={agent.id} href={"/manager/requests?assignee=" + agent.id} className="surface-panel group p-5 transition-[border-color,transform] hover:-translate-y-0.5 hover:border-primary/35">
          <div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-sm font-bold text-primary">{initials(agent.name)}</span><div><h2 className="font-semibold">{agent.name}</h2><p className="mt-0.5 text-xs text-muted-foreground">{agent.email}</p></div></div><ArrowUpRight className="size-4 text-muted-foreground" /></div>
          <div className="mt-6 grid grid-cols-2 divide-x rounded-xl bg-muted/55 py-3"><div className="px-4"><p className="text-2xl font-semibold tabular-nums">{agent.activeCount}</p><p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><Inbox className="size-3.5" />Active assigned</p></div><div className="px-4"><p className="text-2xl font-semibold tabular-nums">{agent.highPriorityCount}</p><p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><Flame className="size-3.5" />High or urgent</p></div></div>
        </Link>
      ))}</div>
    </div>
  );
}
