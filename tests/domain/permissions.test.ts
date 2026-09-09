import { describe, expect, it } from "vitest";
import { canAccessTicket, canEditTicket, canTransition, homeForRole, isTicketStale } from "@/lib/domain";

describe("role permissions", () => {
  it("only lets an employee read their own ticket", () => {
    expect(canAccessTicket("EMPLOYEE", "employee-1", "employee-1")).toBe(true);
    expect(canAccessTicket("EMPLOYEE", "employee-1", "employee-2")).toBe(false);
  });

  it("lets operational roles inspect tickets", () => {
    expect(canAccessTicket("SUPPORT", "support-1", "employee-1")).toBe(true);
    expect(canAccessTicket("MANAGER", "manager-1", "employee-1")).toBe(true);
  });

  it("lets only the current support owner or a manager edit", () => {
    expect(canEditTicket("SUPPORT", "support-1", "support-1")).toBe(true);
    expect(canEditTicket("SUPPORT", "support-1", "support-2")).toBe(false);
    expect(canEditTicket("SUPPORT", "support-1", null)).toBe(false);
    expect(canEditTicket("MANAGER", "manager-1", "support-2")).toBe(true);
    expect(canEditTicket("EMPLOYEE", "employee-1", "employee-1")).toBe(false);
  });

  it("routes every role to its own workspace", () => {
    expect(homeForRole("EMPLOYEE")).toBe("/employee");
    expect(homeForRole("SUPPORT")).toBe("/support");
    expect(homeForRole("MANAGER")).toBe("/manager");
  });
});

describe("attention rules", () => {
  const now = new Date("2026-09-03T12:00:00.000Z");

  it("marks active tickets without an update for 48 hours as stale", () => {
    expect(isTicketStale({ status: "OPEN", updatedAt: new Date("2026-09-01T11:59:59.000Z") }, now)).toBe(true);
    expect(isTicketStale({ status: "IN_PROGRESS", updatedAt: new Date("2026-09-02T12:01:00.000Z") }, now)).toBe(false);
  });

  it("never marks resolved tickets as stale", () => {
    expect(isTicketStale({ status: "RESOLVED", updatedAt: new Date("2026-08-01T00:00:00.000Z") }, now)).toBe(false);
  });
});

describe("workflow transitions", () => {
  it("allows the lightweight active workflow", () => {
    expect(canTransition("OPEN", "IN_PROGRESS")).toBe(true);
    expect(canTransition("IN_PROGRESS", "WAITING")).toBe(true);
    expect(canTransition("WAITING", "IN_PROGRESS")).toBe(true);
  });

  it("does not reopen a resolved ticket", () => {
    expect(canTransition("RESOLVED", "OPEN")).toBe(false);
  });
});
