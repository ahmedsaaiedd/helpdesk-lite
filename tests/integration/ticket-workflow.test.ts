import { randomUUID } from "node:crypto";
import { hash } from "bcryptjs";
import { ActivityType } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const actor = vi.hoisted(() => ({
  user: { id: "", name: "Integration Employee", email: "", role: "EMPLOYEE" as "EMPLOYEE" | "SUPPORT" | "MANAGER", active: true },
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth/require-user", () => ({
  requireRole: async (...roles: string[]) => {
    if (!roles.includes(actor.user.role)) throw new Error("FORBIDDEN");
    return actor.user;
  },
}));

import {
  addProgressAction,
  addRequesterReplyAction,
  createTicketAction,
  resolveTicketAction,
  takeOwnershipAction,
  updateStatusAction,
  updateTriageAction,
} from "@/app/actions/tickets";
import { employeeOverview } from "@/lib/data/tickets";
import { prisma } from "@/lib/prisma";

const marker = randomUUID();
const employeeEmail = "integration.employee." + marker + "@helpdesklite.local";
const supportEmail = "integration.support." + marker + "@helpdesklite.local";
const managerEmail = "integration.manager." + marker + "@helpdesklite.local";
let supportId = "";
let managerId = "";
let ticketId = "";

describe("database-backed ticket workflow", () => {
  beforeAll(async () => {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for integration tests.");
    const passwordHash = await hash("Integration123!", 4);
    const [employee, support, manager] = await Promise.all([
      prisma.user.create({ data: { name: "Integration Employee", email: employeeEmail, role: "EMPLOYEE", passwordHash } }),
      prisma.user.create({ data: { name: "Integration Support", email: supportEmail, role: "SUPPORT", passwordHash } }),
      prisma.user.create({ data: { name: "Integration Manager", email: managerEmail, role: "MANAGER", passwordHash } }),
    ]);
    supportId = support.id;
    managerId = manager.id;
    actor.user = { id: employee.id, name: employee.name, email: employee.email, role: employee.role, active: true };
  });

  afterAll(async () => {
    if (ticketId) await prisma.ticket.deleteMany({ where: { id: ticketId } });
    await prisma.user.deleteMany({ where: { email: { in: [employeeEmail, supportEmail, managerEmail] } } });
    await prisma.$disconnect();
  });

  it("creates an idempotent ticket with a database-generated display ID", async () => {
    const overviewBefore = await employeeOverview(actor.user.id);
    const requestKey = randomUUID();
    const input = {
      title: "Integration printer test",
      description: "The printer queue pauses after a completed document during the integration test.",
      category: "IT_HARDWARE",
      priority: "HIGH",
      requestKey,
    } as const;

    const first = await createTicketAction(input);
    const duplicate = await createTicketAction(input);
    expect(first.ok).toBe(true);
    expect(duplicate.ok).toBe(true);
    if (!first.ok || !duplicate.ok) return;
    ticketId = first.data.id;
    expect(first.data.displayId).toMatch(/^HD-\d{6,}$/);
    expect(duplicate.data.id).toBe(first.data.id);
    expect(await prisma.ticket.count({ where: { requestKey } })).toBe(1);
    const overviewAfter = await employeeOverview(actor.user.id);
    expect(overviewAfter.open).toBe(overviewBefore.open + 1);
    expect(overviewAfter.total).toBe(overviewBefore.total + 1);
    expect(overviewAfter.recent.some((ticket) => ticket.id === first.data.id)).toBe(true);
  });

  it("allows only one concurrent ownership claim", async () => {
    actor.user = { id: supportId, name: "Integration Support", email: supportEmail, role: "SUPPORT", active: true };
    const attempts = await Promise.all([
      takeOwnershipAction({ ticketId, expectedVersion: 1 }),
      takeOwnershipAction({ ticketId, expectedVersion: 1 }),
    ]);
    expect(attempts.filter((result) => result.ok)).toHaveLength(1);
    const ticket = await prisma.ticket.findUniqueOrThrow({ where: { id: ticketId } });
    expect(ticket.assigneeId).toBe(supportId);
    expect(ticket.version).toBe(2);
  });

  it("blocks a support teammate who is not the owner", async () => {
    actor.user = { id: "another-support-id", name: "Another Support", email: "another@helpdesklite.local", role: "SUPPORT", active: true };
    const result = await updateStatusAction({ ticketId, status: "IN_PROGRESS", expectedVersion: 2 });
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/current owner or a manager/i);
    expect((await prisma.ticket.findUniqueOrThrow({ where: { id: ticketId } })).version).toBe(2);
  });

  it("lets a manager correct triage without taking ownership", async () => {
    actor.user = { id: managerId, name: "Integration Manager", email: managerEmail, role: "MANAGER", active: true };
    expect((await updateTriageAction({ ticketId, priority: "URGENT", category: "NETWORK", expectedVersion: 2 })).ok).toBe(true);
    const ticket = await prisma.ticket.findUniqueOrThrow({ where: { id: ticketId } });
    expect(ticket).toMatchObject({ assigneeId: supportId, priority: "URGENT", category: "NETWORK", version: 3 });
  });

  it("returns a waiting ticket to its owner after the requester replies", async () => {
    actor.user = { id: supportId, name: "Integration Support", email: supportEmail, role: "SUPPORT", active: true };
    expect((await updateStatusAction({ ticketId, status: "WAITING", expectedVersion: 3 })).ok).toBe(true);

    const ticket = await prisma.ticket.findUniqueOrThrow({ where: { id: ticketId }, select: { requester: true } });
    actor.user = { id: ticket.requester.id, name: ticket.requester.name, email: ticket.requester.email, role: "EMPLOYEE", active: true };
    expect((await addRequesterReplyAction({ ticketId, content: "The printer now shows error code Q-401.", expectedVersion: 4 })).ok).toBe(true);

    const updated = await prisma.ticket.findUniqueOrThrow({ where: { id: ticketId } });
    expect(updated).toMatchObject({ status: "IN_PROGRESS", assigneeId: supportId, version: 5 });
    expect(await prisma.ticketActivity.count({ where: { ticketId, type: "REQUESTER_REPLY" as ActivityType } })).toBe(1);
  });

  it("records progress and resolution without stale overwrites", async () => {
    actor.user = { id: supportId, name: "Integration Support", email: supportEmail, role: "SUPPORT", active: true };
    expect((await addProgressAction({ ticketId, content: "Printer policy reset is being tested.", expectedVersion: 5 })).ok).toBe(true);
    expect((await resolveTicketAction({ ticketId, note: "Queue remained stable after the reset.", expectedVersion: 6 })).ok).toBe(true);
    expect((await resolveTicketAction({ ticketId, note: "Repeated request", expectedVersion: 6 })).ok).toBe(false);

    const ticket = await prisma.ticket.findUniqueOrThrow({ where: { id: ticketId }, include: { activities: true } });
    expect(ticket.status).toBe("RESOLVED");
    expect(ticket.resolvedAt).toBeInstanceOf(Date);
    expect(ticket.version).toBe(7);
    expect(ticket.activities.map((activity) => activity.type)).toEqual(expect.arrayContaining(["CREATED", "ASSIGNED", "PRIORITY_CHANGED", "CATEGORY_CHANGED", "STATUS_CHANGED", "REQUESTER_REPLY", "PROGRESS_UPDATE", "RESOLVED"]));
  });
});
