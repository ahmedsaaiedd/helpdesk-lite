import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AttentionBadge, PriorityBadge, StatusBadge } from "@/components/tickets/ticket-badges";

describe("ticket badges", () => {
  it("communicates status with visible text", () => {
    render(<StatusBadge status="IN_PROGRESS" />);
    expect(screen.getByText("In Progress")).toBeVisible();
  });

  it("communicates urgent priority without relying on color", () => {
    render(<PriorityBadge priority="URGENT" />);
    expect(screen.getByText("Urgent")).toBeVisible();
  });

  it("labels active tickets that have not moved for 48 hours", () => {
    render(<AttentionBadge status="OPEN" updatedAt={new Date(Date.now() - 49 * 60 * 60 * 1000)} />);
    expect(screen.getByText(/No update for/)).toBeVisible();
  });
});
