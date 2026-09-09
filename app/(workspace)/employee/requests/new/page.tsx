import type { Metadata } from "next";
import { PlusCircle } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { NewTicketForm } from "@/components/tickets/new-ticket-form";
import { requireRole } from "@/lib/auth/require-user";

export const metadata: Metadata = { title: "New Request" };

export default async function NewRequestPage() {
  await requireRole("EMPLOYEE");
  return <div className="soft-enter"><PageHeader eyebrow="Get support" title="New Request" description="Tell the support team what is happening. Only the essentials are required." icon={PlusCircle} /><NewTicketForm /></div>;
}
