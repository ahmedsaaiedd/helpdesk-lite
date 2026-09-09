import type { Metadata } from "next";
import { ClipboardList, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { Pagination } from "@/components/tickets/pagination";
import { TicketFilters } from "@/components/tickets/ticket-filters";
import { TicketList } from "@/components/tickets/ticket-list";
import { requireRole } from "@/lib/auth/require-user";
import { listTickets } from "@/lib/data/tickets";
import { parseTicketFilters } from "@/lib/validation";

export const metadata: Metadata = { title: "My Requests" };

export default async function MyRequestsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireRole("EMPLOYEE");
  const filters = parseTicketFilters(await searchParams);
  const result = await listTickets(user, filters);
  return (
    <div className="soft-enter">
      <PageHeader eyebrow="Your request history" title="My Requests" description="See ownership, progress, and the latest status for every request." icon={ClipboardList} action={<Button asChild className="h-11 rounded-xl"><Link href="/employee/requests/new"><Plus className="size-4" />New request</Link></Button>} />
      <TicketFilters role="EMPLOYEE" />
      <TicketList tickets={result.tickets} basePath="/employee/requests" emptyTitle={filters.q || filters.status || filters.category ? "No requests match these filters." : "No requests yet."} emptyDescription={filters.q || filters.status || filters.category ? "Clear a filter or try another search." : "Create your first support request when you need help."} emptyAction={!filters.q && !filters.status && !filters.category ? { href: "/employee/requests/new", label: "Create request" } : undefined} />
      <Pagination page={result.page} pages={result.pages} total={result.total} />
    </div>
  );
}
