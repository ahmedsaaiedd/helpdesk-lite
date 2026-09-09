import type { Metadata } from "next";
import { TicketDetail } from "@/components/tickets/ticket-detail";
import { requireRole } from "@/lib/auth/require-user";
import { getTicket } from "@/lib/data/tickets";

export const metadata: Metadata = { title: "Request Details" };

export default async function EmployeeTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole("EMPLOYEE");
  const ticket = await getTicket(user, (await params).id);
  return <TicketDetail ticket={ticket} role={user.role} currentUserId={user.id} backHref="/employee/requests" />;
}
