import type { Metadata } from "next";
import { TicketDetail } from "@/components/tickets/ticket-detail";
import { requireRole } from "@/lib/auth/require-user";
import { getSupportUsers, getTicket } from "@/lib/data/tickets";

export const metadata: Metadata = { title: "Request Details" };

export default async function ManagerTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole("MANAGER");
  const [ticket, supportUsers] = await Promise.all([getTicket(user, (await params).id), getSupportUsers()]);
  return <TicketDetail ticket={ticket} role={user.role} currentUserId={user.id} supportUsers={supportUsers} backHref="/manager/requests" />;
}
