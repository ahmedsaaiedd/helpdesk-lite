import { describe, expect, it } from "vitest";
import { createUserSchema, newTicketSchema, parseTicketFilters, progressSchema, requesterReplySchema, triageSchema } from "@/lib/validation";

describe("new ticket validation", () => {
  const valid = {
    title: "Cannot access payroll portal",
    description: "The payroll portal shows an access denied message after sign in.",
    category: "ACCOUNT_ACCESS",
    requestKey: "3f54cd98-7bda-4ec6-94e9-b3f7f71c2a4e",
  };

  it("trims useful input and defaults priority", () => {
    const result = newTicketSchema.parse({ ...valid, title: "  Cannot access payroll portal  " });
    expect(result.title).toBe("Cannot access payroll portal");
    expect(result.priority).toBe("MEDIUM");
  });

  it("rejects whitespace-only fields and invalid enums", () => {
    expect(newTicketSchema.safeParse({ ...valid, title: "    " }).success).toBe(false);
    expect(newTicketSchema.safeParse({ ...valid, category: "ANYTHING" }).success).toBe(false);
  });

  it("enforces progress limits", () => {
    expect(progressSchema.safeParse({ ticketId: "clz1234567890abcdefghijk", expectedVersion: 1, content: " " }).success).toBe(false);
  });

  it("validates requester replies and triage changes", () => {
    const base = { ticketId: "clz1234567890abcdefghijk", expectedVersion: 2 };
    expect(requesterReplySchema.safeParse({ ...base, content: "Here is the missing error message." }).success).toBe(true);
    expect(requesterReplySchema.safeParse({ ...base, content: " " }).success).toBe(false);
    expect(triageSchema.safeParse({ ...base, priority: "URGENT", category: "NETWORK" }).success).toBe(true);
    expect(triageSchema.safeParse({ ...base, priority: "UNKNOWN", category: "NETWORK" }).success).toBe(false);
  });
});

describe("user account validation", () => {
  const valid = {
    name: "  Nour Ali  ",
    email: "  NOUR@COMPANY.COM ",
    role: "EMPLOYEE",
    password: "StrongPass1!",
    confirmPassword: "StrongPass1!",
  };

  it("normalizes identity fields and accepts a strong matching password", () => {
    const result = createUserSchema.parse(valid);
    expect(result.name).toBe("Nour Ali");
    expect(result.email).toBe("nour@company.com");
  });

  it("rejects weak, mismatched, and invalid-role accounts", () => {
    expect(createUserSchema.safeParse({ ...valid, password: "password", confirmPassword: "password" }).success).toBe(false);
    expect(createUserSchema.safeParse({ ...valid, confirmPassword: "Different1!" }).success).toBe(false);
    expect(createUserSchema.safeParse({ ...valid, role: "ADMIN" }).success).toBe(false);
  });
});

describe("URL filter validation", () => {
  it("safely falls back for malformed values", () => {
    const result = parseTicketFilters({ status: "BROKEN", page: "-5", sort: "random", attention: "old" });
    expect(result.status).toBeUndefined();
    expect(result.page).toBe(1);
    expect(result.sort).toBe("updated");
    expect(result.attention).toBe("all");
  });

  it("keeps valid shareable filters", () => {
    const result = parseTicketFilters({ status: "WAITING", priority: "URGENT", attention: "stale", page: "3" });
    expect(result).toMatchObject({ status: "WAITING", priority: "URGENT", attention: "stale", page: 3 });
  });
});
