import type { Metadata } from "next";
import { SearchCheck } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Pagination } from "@/components/tickets/pagination";
import { TicketFilters } from "@/components/tickets/ticket-filters";
import { TicketList } from "@/components/tickets/ticket-list";
import { requireRole } from "@/lib/auth/require-user";
import { listTickets } from "@/lib/data/tickets";
import { parseTicketFilters } from "@/lib/validation";

export const metadata: Metadata = { title: "Ticket Queue" };

export default async function TicketQueuePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireRole("SUPPORT");
  const filters = parseTicketFilters(await searchParams);
  const result = await listTickets(user, filters);
  return <div className="soft-enter"><PageHeader eyebrow="All support work" title="Ticket Queue" description="Search, filter, and move requests to the right owner." icon={SearchCheck} /><TicketFilters role="SUPPORT" /><TicketList tickets={result.tickets} basePath="/support/tickets" /><Pagination page={result.page} pages={result.pages} total={result.total} /></div>;
}
