import type { Prisma, Role, TicketStatus } from "@prisma/client";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ACTIVE_STATUSES, canAccessTicket, staleBefore } from "@/lib/domain";
import type { TicketFilters } from "@/lib/validation";

export const PAGE_SIZE = 15;

const listInclude = {
  requester: { select: { id: true, name: true, email: true } },
  assignee: { select: { id: true, name: true, email: true, active: true } },
} satisfies Prisma.TicketInclude;

const detailInclude = {
  ...listInclude,
  activities: {
    orderBy: { createdAt: "asc" as const },
    include: { actor: { select: { id: true, name: true, role: true } } },
  },
} satisfies Prisma.TicketInclude;

export type TicketListItem = Prisma.TicketGetPayload<{ include: typeof listInclude }>;
export type TicketDetail = Prisma.TicketGetPayload<{ include: typeof detailInclude }>;

type Actor = { id: string; role: Role };
type Scope = "all" | "mine" | "unassigned" | "open";

function buildWhere(actor: Actor, filters: TicketFilters, scope: Scope): Prisma.TicketWhereInput {
  const where: Prisma.TicketWhereInput = {};

  if (actor.role === "EMPLOYEE") where.requesterId = actor.id;
  if (scope === "mine") where.assigneeId = actor.id;
  if (scope === "unassigned" || filters.owner === "unassigned") where.assigneeId = null;
  if (scope === "open" || scope === "unassigned" || scope === "mine") where.status = { in: ACTIVE_STATUSES };
  if (filters.owner === "me" && actor.role === "SUPPORT") where.assigneeId = actor.id;
  if (filters.assignee && actor.role !== "EMPLOYEE") where.assigneeId = filters.assignee;
  if (filters.status && !(["open", "unassigned", "mine"].includes(scope) && filters.status === "RESOLVED")) where.status = filters.status;
  if (filters.priority) where.priority = filters.priority;
  if (filters.category) where.category = filters.category;
  if (filters.attention === "stale") {
    where.status = { in: ACTIVE_STATUSES };
    where.updatedAt = { lte: staleBefore() };
  }

  if (filters.q) {
    where.OR = [
      { displayId: { contains: filters.q, mode: "insensitive" } },
      { title: { contains: filters.q, mode: "insensitive" } },
      ...(actor.role === "EMPLOYEE"
        ? []
        : [{ requester: { name: { contains: filters.q, mode: "insensitive" as const } } }]),
    ];
  }

  return where;
}

function orderBy(sort: TicketFilters["sort"]): Prisma.TicketOrderByWithRelationInput[] {
  if (sort === "created") return [{ createdAt: "desc" }];
  if (sort === "priority") return [{ priority: "desc" }, { updatedAt: "desc" }];
  return [{ updatedAt: "desc" }];
}

export async function listTickets(actor: Actor, filters: TicketFilters, scope: Scope = "all") {
  const where = buildWhere(actor, filters, scope);
  const page = Math.max(1, filters.page);
  const [tickets, total] = await prisma.$transaction([
    prisma.ticket.findMany({
      where,
      include: listInclude,
      orderBy: orderBy(filters.sort),
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.ticket.count({ where }),
  ]);

  return { tickets, total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getTicket(actor: Actor, id: string) {
  const ticket = await prisma.ticket.findUnique({ where: { id }, include: detailInclude });
  if (!ticket || !canAccessTicket(actor.role, actor.id, ticket.requesterId)) notFound();
  return ticket;
}

export async function getSupportUsers() {
  return prisma.user.findMany({
    where: { role: "SUPPORT", active: true },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
}

export async function employeeOverview(userId: string) {
  const [open, recent, resolved, total] = await prisma.$transaction([
    prisma.ticket.count({ where: { requesterId: userId, status: { in: ACTIVE_STATUSES } } }),
    prisma.ticket.findMany({ where: { requesterId: userId }, include: listInclude, orderBy: { updatedAt: "desc" }, take: 5 }),
    prisma.ticket.count({ where: { requesterId: userId, status: "RESOLVED" } }),
    prisma.ticket.count({ where: { requesterId: userId } }),
  ]);
  return { open, recent, resolved, total };
}

export async function supportOverview(userId: string) {
  const [unassigned, assignedToMe, open, inProgress, recent] = await prisma.$transaction([
    prisma.ticket.count({ where: { assigneeId: null, status: { in: ACTIVE_STATUSES } } }),
    prisma.ticket.count({ where: { assigneeId: userId, status: { in: ACTIVE_STATUSES } } }),
    prisma.ticket.count({ where: { status: "OPEN" } }),
    prisma.ticket.count({ where: { status: "IN_PROGRESS" } }),
    prisma.ticket.findMany({ include: listInclude, orderBy: { updatedAt: "desc" }, take: 6 }),
  ]);
  return { unassigned, assignedToMe, open, inProgress, recent };
}

export async function managerOverview() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [open, inProgress, waiting, unassigned, stale, resolved, workload] = await Promise.all([
    prisma.ticket.count({ where: { status: "OPEN" } }),
    prisma.ticket.count({ where: { status: "IN_PROGRESS" } }),
    prisma.ticket.count({ where: { status: "WAITING" } }),
    prisma.ticket.count({ where: { assigneeId: null, status: { in: ACTIVE_STATUSES } } }),
    prisma.ticket.count({ where: { status: { in: ACTIVE_STATUSES }, updatedAt: { lte: staleBefore() } } }),
    prisma.ticket.count({ where: { status: "RESOLVED", resolvedAt: { gte: sevenDaysAgo } } }),
    getWorkload(),
  ]);
  return { open, inProgress, waiting, unassigned, stale, resolved, workload };
}

export async function getWorkload() {
  const [agents, priorityCounts] = await Promise.all([
    prisma.user.findMany({
      where: { role: "SUPPORT", active: true },
      select: {
        id: true,
        name: true,
        email: true,
        _count: { select: { assignedTickets: { where: { status: { in: ACTIVE_STATUSES } } } } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.ticket.groupBy({
      by: ["assigneeId"],
      where: {
        assigneeId: { not: null },
        status: { in: ACTIVE_STATUSES },
        priority: { in: ["HIGH", "URGENT"] },
      },
      _count: { _all: true },
    }),
  ]);
  const priorityByAgent = new Map(priorityCounts.map((item) => [item.assigneeId, item._count._all]));
  return agents.map((agent) => ({
    ...agent,
    activeCount: agent._count.assignedTickets,
    highPriorityCount: priorityByAgent.get(agent.id) ?? 0,
  }));
}

export function isActiveStatus(status: TicketStatus) {
  return ACTIVE_STATUSES.includes(status);
}
