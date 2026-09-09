import type { Metadata } from "next";
import { UserRoundCheck } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Pagination } from "@/components/tickets/pagination";
import { TicketFilters } from "@/components/tickets/ticket-filters";
import { TicketList } from "@/components/tickets/ticket-list";
import { requireRole } from "@/lib/auth/require-user";
import { listTickets } from "@/lib/data/tickets";
import { parseTicketFilters } from "@/lib/validation";

export const metadata: Metadata = { title: "My Tickets" };

export default async function MyTicketsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireRole("SUPPORT");
  const rawParams = await searchParams;
  const filters = parseTicketFilters(rawParams);
  if (!rawParams.sort) filters.sort = "priority";
  const result = await listTickets(user, filters, "mine");
  return <div className="soft-enter"><PageHeader eyebrow="Your active work" title="My Tickets" description="Urgent and recently updated requests stay easy to find." icon={UserRoundCheck} /><TicketFilters role="SUPPORT" hideOwner activeOnly /><TicketList tickets={result.tickets} basePath="/support/tickets" emptyTitle="No active tickets are assigned to you." emptyDescription="Take ownership from the queue when you are ready for the next request." /><Pagination page={result.page} pages={result.pages} total={result.total} /></div>;
}
