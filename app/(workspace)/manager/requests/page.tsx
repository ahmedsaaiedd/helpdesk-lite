import type { Metadata } from "next";
import { ClipboardList } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Pagination } from "@/components/tickets/pagination";
import { TicketFilters } from "@/components/tickets/ticket-filters";
import { TicketList } from "@/components/tickets/ticket-list";
import { requireRole } from "@/lib/auth/require-user";
import { getSupportUsers, listTickets } from "@/lib/data/tickets";
import { parseTicketFilters } from "@/lib/validation";

export const metadata: Metadata = { title: "Open Requests" };

export default async function ManagerRequestsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireRole("MANAGER");
  const filters = parseTicketFilters(await searchParams);
  const [result, supportUsers] = await Promise.all([listTickets(user, filters, "open"), getSupportUsers()]);
  return <div className="soft-enter"><PageHeader eyebrow="Operational visibility" title="Open Requests" description="Inspect unresolved work by status, priority, or owner." icon={ClipboardList} /><TicketFilters role="MANAGER" activeOnly supportUsers={supportUsers} /><TicketList tickets={result.tickets} basePath="/manager/requests" /><Pagination page={result.page} pages={result.pages} total={result.total} /></div>;
}
