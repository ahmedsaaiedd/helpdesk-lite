import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TicketFilters } from "@/components/tickets/ticket-filters";

const navigation = vi.hoisted(() => ({
  params: new URLSearchParams(),
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/manager/requests",
  useRouter: () => ({ replace: navigation.replace }),
  useSearchParams: () => navigation.params,
}));

describe("TicketFilters", () => {
  beforeEach(() => {
    navigation.params = new URLSearchParams();
    navigation.replace.mockReset();
  });

  it("shows the default sort label in the closed trigger", () => {
    render(<TicketFilters role="MANAGER" activeOnly />);

    expect(screen.getByRole("combobox", { name: "Sort" })).toHaveTextContent("Recently updated");
  });

  it("falls back to the default label for an invalid sort query", () => {
    navigation.params = new URLSearchParams("sort=not-a-real-sort");
    render(<TicketFilters role="MANAGER" activeOnly />);

    expect(screen.getByRole("combobox", { name: "Sort" })).toHaveTextContent("Recently updated");
  });

  it("shows a shareable needs-attention filter", () => {
    navigation.params = new URLSearchParams("attention=stale");
    render(<TicketFilters role="MANAGER" activeOnly />);

    expect(screen.getByRole("combobox", { name: "Attention" })).toHaveTextContent("Needs attention");
  });
});
