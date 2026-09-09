import type { Metadata } from "next";
import { Inbox } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Pagination } from "@/components/tickets/pagination";
import { TicketFilters } from "@/components/tickets/ticket-filters";
import { TicketList } from "@/components/tickets/ticket-list";
import { requireRole } from "@/lib/auth/require-user";
import { listTickets } from "@/lib/data/tickets";
import { parseTicketFilters } from "@/lib/validation";

export const metadata: Metadata = { title: "Unassigned Requests" };

export default async function UnassignedPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireRole("MANAGER");
  const filters = parseTicketFilters(await searchParams);
  const result = await listTickets(user, filters, "unassigned");
  return <div className="soft-enter"><PageHeader eyebrow="Ownership check" title="Unassigned" description="Requests still waiting for a support owner." icon={Inbox} /><TicketFilters role="MANAGER" hideOwner activeOnly /><TicketList tickets={result.tickets} basePath="/manager/requests" emptyTitle="Everything currently has an owner." emptyDescription="There are no unresolved requests waiting for assignment." /><Pagination page={result.page} pages={result.pages} total={result.total} /></div>;
}
