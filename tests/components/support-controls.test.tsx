import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SupportControls } from "@/components/tickets/support-controls";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/app/actions/tickets", () => ({
  addProgressAction: vi.fn(),
  reassignTicketAction: vi.fn(),
  resolveTicketAction: vi.fn(),
  takeOwnershipAction: vi.fn(),
  updateStatusAction: vi.fn(),
  updateTriageAction: vi.fn(),
}));

const base = {
  ticketId: "clz1234567890abcdefghijk",
  version: 2,
  status: "IN_PROGRESS" as const,
  priority: "MEDIUM" as const,
  category: "SOFTWARE" as const,
  currentUserId: "support-1",
  supportUsers: [
    { id: "support-1", name: "Sarah Nabil", email: "support@helpdesklite.local" },
    { id: "support-2", name: "Youssef Adel", email: "youssef@helpdesklite.local" },
  ],
};

describe("SupportControls permissions", () => {
  it("keeps a non-owner support teammate read-only", () => {
    render(<SupportControls {...base} role="SUPPORT" assigneeId="support-2" />);

    expect(screen.getByText("Owner-only editing")).toBeVisible();
    expect(screen.queryByRole("combobox", { name: "Status" })).not.toBeInTheDocument();
  });

  it("requires unassigned support work to be claimed first", () => {
    render(<SupportControls {...base} role="SUPPORT" assigneeId={null} />);

    expect(screen.getByRole("button", { name: "Take ownership" })).toBeVisible();
    expect(screen.queryByRole("combobox", { name: "Priority" })).not.toBeInTheDocument();
  });

  it("gives managers the complete editing controls", () => {
    render(<SupportControls {...base} role="MANAGER" assigneeId="support-2" />);

    expect(screen.getByRole("combobox", { name: "Owner" })).toBeVisible();
    expect(screen.getByRole("combobox", { name: "Status" })).toBeVisible();
    expect(screen.getByRole("combobox", { name: "Priority" })).toBeVisible();
    expect(screen.getByRole("combobox", { name: "Category" })).toBeVisible();
  });
});
