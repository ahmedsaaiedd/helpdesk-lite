import type { Metadata } from "next";
import { CheckCircle2, CircleDotDashed, ClipboardList, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { PageAtmosphere } from "@/components/layout/page-atmosphere";
import { TicketList } from "@/components/tickets/ticket-list";
import { requireRole } from "@/lib/auth/require-user";
import { employeeOverview } from "@/lib/data/tickets";

export const metadata: Metadata = { title: "Overview" };

export default async function EmployeeOverviewPage() {
  const user = await requireRole("EMPLOYEE");
  const data = await employeeOverview(user.id);
  const firstName = user.name?.split(" ")[0] || "there";

  return (
    <div className="page-with-atmosphere soft-enter">
      <PageAtmosphere />
      <PageHeader
        eyebrow="Employee overview"
        title={"Good to see you, " + firstName}
        description="Everything you need to know about your support requests, without chasing an update."
        action={<Button asChild className="h-11 rounded-xl px-5"><Link href="/employee/requests/new"><Plus className="size-4" />New request</Link></Button>}
      />
      <section aria-label="Request summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Open requests" value={data.open} note="Requests still being worked on" href="/employee/requests?status=OPEN" icon={CircleDotDashed} tone="primary" />
        <StatCard label="Resolved" value={data.resolved} note="Completed requests in your history" href="/employee/requests?status=RESOLVED" icon={CheckCircle2} tone="success" />
        <StatCard label="Total requests" value={data.total} note="Every request in your history" href="/employee/requests" icon={ClipboardList} />
      </section>
      <section className="mt-8">
        <div className="mb-4 flex items-end justify-between gap-4"><div><h2 className="text-lg font-semibold">Recent requests</h2><p className="mt-1 text-sm text-muted-foreground">Sorted by latest activity</p></div><Link href="/employee/requests" className="text-sm font-semibold text-primary hover:underline">View all</Link></div>
        <TicketList tickets={data.recent} basePath="/employee/requests" emptyTitle="No requests yet." emptyDescription="When something needs attention, create a request and track it here." emptyAction={{ href: "/employee/requests/new", label: "Create request" }} />
      </section>
    </div>
  );
}
