"use server";

import { ActivityType, Prisma, TicketStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-user";
import { canEditTicket, canTransition } from "@/lib/domain";
import { prisma } from "@/lib/prisma";
import {
  assignmentSchema,
  newTicketSchema,
  progressSchema,
  requesterReplySchema,
  resolveSchema,
  statusSchema,
  triageSchema,
} from "@/lib/validation";

export type ActionResult<T = undefined> =
  | { ok: true; data: T; message: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

function refreshTicketViews() {
  revalidatePath("/employee");
  revalidatePath("/employee/requests");
  revalidatePath("/support");
  revalidatePath("/support/tickets");
  revalidatePath("/support/my-tickets");
  revalidatePath("/manager");
  revalidatePath("/manager/requests");
  revalidatePath("/manager/unassigned");
  revalidatePath("/manager/workload");
}

function validationFailure(error: { flatten: () => { fieldErrors: Record<string, string[]> } }): ActionResult<never> {
  return { ok: false, message: "Check the highlighted fields and try again.", fieldErrors: error.flatten().fieldErrors };
}

const editorSelect = {
  id: true,
  requesterId: true,
  assigneeId: true,
  status: true,
  priority: true,
  category: true,
} satisfies Prisma.TicketSelect;

async function editableTicket(ticketId: string) {
  const user = await requireRole("SUPPORT", "MANAGER");
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId }, select: editorSelect });
  if (!ticket) return { user, ticket: null, error: "This ticket no longer exists." };
  if (!canEditTicket(user.role, user.id, ticket.assigneeId)) {
    return { user, ticket: null, error: "Only the current owner or a manager can edit this ticket." };
  }
  return { user, ticket, error: null };
}

function editorScope(role: "EMPLOYEE" | "SUPPORT" | "MANAGER", userId: string) {
  return role === "SUPPORT" ? { assigneeId: userId } : {};
}

export async function createTicketAction(input: unknown): Promise<ActionResult<{ id: string; displayId: string }>> {
  const user = await requireRole("EMPLOYEE");
  const parsed = newTicketSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);

  const existing = await prisma.ticket.findUnique({ where: { requestKey: parsed.data.requestKey } });
  if (existing) {
    if (existing.requesterId !== user.id) return { ok: false, message: "This submission could not be verified. Refresh and try again." };
    return { ok: true, data: { id: existing.id, displayId: existing.displayId }, message: "Request already created." };
  }

  try {
    const ticket = await prisma.ticket.create({
      data: {
        requestKey: parsed.data.requestKey,
        title: parsed.data.title,
        description: parsed.data.description,
        category: parsed.data.category,
        priority: parsed.data.priority,
        requesterId: user.id,
        activities: {
          create: { actorId: user.id, type: ActivityType.CREATED, content: "Request submitted" },
        },
      },
      select: { id: true, displayId: true },
    });
    refreshTicketViews();
    return { ok: true, data: ticket, message: ticket.displayId + " was created." };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const duplicate = await prisma.ticket.findUnique({ where: { requestKey: parsed.data.requestKey } });
      if (duplicate?.requesterId === user.id) {
        return { ok: true, data: { id: duplicate.id, displayId: duplicate.displayId }, message: "Request already created." };
      }
    }
    console.error("Ticket creation failed", error);
    return { ok: false, message: "We could not create your request. Your text is still here, so you can try again." };
  }
}

export async function takeOwnershipAction(input: unknown): Promise<ActionResult> {
  const user = await requireRole("SUPPORT");
  const parsed = assignmentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "This ticket changed. Refresh and try again." };

  const claimed = await prisma.$transaction(async (tx) => {
    const result = await tx.ticket.updateMany({
      where: {
        id: parsed.data.ticketId,
        version: parsed.data.expectedVersion,
        assigneeId: null,
        status: { not: TicketStatus.RESOLVED },
      },
      data: { assigneeId: user.id, version: { increment: 1 } },
    });
    if (result.count !== 1) return false;
    await tx.ticketActivity.create({
      data: { ticketId: parsed.data.ticketId, actorId: user.id, type: ActivityType.ASSIGNED, content: "Took ownership" },
    });
    return true;
  });

  if (!claimed) return { ok: false, message: "This ticket was just assigned or updated by another team member." };
  refreshTicketViews();
  return { ok: true, data: undefined, message: "Ticket assigned to you." };
}

export async function reassignTicketAction(input: unknown): Promise<ActionResult> {
  const parsed = assignmentSchema.safeParse(input);
  if (!parsed.success || !parsed.data.assigneeId) return { ok: false, message: "Choose an active support teammate." };

  const access = await editableTicket(parsed.data.ticketId);
  if (!access.ticket) return { ok: false, message: access.error };
  const { user, ticket: current } = access;

  const assignee = await prisma.user.findFirst({
    where: { id: parsed.data.assigneeId, role: "SUPPORT", active: true },
    select: { id: true, name: true },
  });
  if (!assignee) return { ok: false, message: "That teammate is no longer available for assignment." };
  if (current.assigneeId === assignee.id) return { ok: true, data: undefined, message: "Owner is already up to date." };

  const changed = await prisma.$transaction(async (tx) => {
    const result = await tx.ticket.updateMany({
      where: {
        id: parsed.data.ticketId,
        version: parsed.data.expectedVersion,
        status: { not: "RESOLVED" },
        ...editorScope(user.role, user.id),
      },
      data: { assigneeId: assignee.id, version: { increment: 1 } },
    });
    if (result.count !== 1) return false;
    await tx.ticketActivity.create({
      data: {
        ticketId: parsed.data.ticketId,
        actorId: user.id,
        type: current.assigneeId ? ActivityType.REASSIGNED : ActivityType.ASSIGNED,
        content: "Assigned to " + assignee.name,
        metadata: { from: current.assigneeId, to: assignee.id },
      },
    });
    return true;
  });

  if (!changed) return { ok: false, message: "This ticket changed while you were viewing it. Refresh and try again." };
  refreshTicketViews();
  return { ok: true, data: undefined, message: "Ticket assigned to " + assignee.name + "." };
}

export async function updateStatusAction(input: unknown): Promise<ActionResult> {
  const parsed = statusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Choose a valid status." };

  const access = await editableTicket(parsed.data.ticketId);
  if (!access.ticket) return { ok: false, message: access.error };
  const { user, ticket: current } = access;
  if (current.status === parsed.data.status) return { ok: true, data: undefined, message: "Status is already up to date." };
  if (!canTransition(current.status, parsed.data.status) || parsed.data.status === "RESOLVED") {
    return { ok: false, message: "Use the resolve action to complete this ticket." };
  }

  const changed = await prisma.$transaction(async (tx) => {
    const result = await tx.ticket.updateMany({
      where: {
        id: parsed.data.ticketId,
        version: parsed.data.expectedVersion,
        status: current.status,
        ...editorScope(user.role, user.id),
      },
      data: { status: parsed.data.status, version: { increment: 1 } },
    });
    if (result.count !== 1) return false;
    await tx.ticketActivity.create({
      data: {
        ticketId: parsed.data.ticketId,
        actorId: user.id,
        type: ActivityType.STATUS_CHANGED,
        content: "Status changed from " + current.status + " to " + parsed.data.status,
        metadata: { from: current.status, to: parsed.data.status },
      },
    });
    return true;
  });

  if (!changed) return { ok: false, message: "Someone updated this ticket first. Refresh to see the latest status." };
  refreshTicketViews();
  return { ok: true, data: undefined, message: "Status updated." };
}

export async function addProgressAction(input: unknown): Promise<ActionResult> {
  const parsed = progressSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);

  const access = await editableTicket(parsed.data.ticketId);
  if (!access.ticket) return { ok: false, message: access.error };
  const { user } = access;

  const added = await prisma.$transaction(async (tx) => {
    const result = await tx.ticket.updateMany({
      where: {
        id: parsed.data.ticketId,
        version: parsed.data.expectedVersion,
        status: { not: "RESOLVED" },
        ...editorScope(user.role, user.id),
      },
      data: { version: { increment: 1 }, updatedAt: new Date() },
    });
    if (result.count !== 1) return false;
    await tx.ticketActivity.create({
      data: {
        ticketId: parsed.data.ticketId,
        actorId: user.id,
        type: ActivityType.PROGRESS_UPDATE,
        content: parsed.data.content,
      },
    });
    return true;
  });

  if (!added) return { ok: false, message: "This ticket changed or was resolved. Refresh before posting your update." };
  refreshTicketViews();
  return { ok: true, data: undefined, message: "Progress update posted." };
}

export async function updateTriageAction(input: unknown): Promise<ActionResult> {
  const parsed = triageSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Choose a valid priority and category." };

  const access = await editableTicket(parsed.data.ticketId);
  if (!access.ticket) return { ok: false, message: access.error };
  const { user, ticket: current } = access;
  const priorityChanged = current.priority !== parsed.data.priority;
  const categoryChanged = current.category !== parsed.data.category;
  if (!priorityChanged && !categoryChanged) return { ok: true, data: undefined, message: "Triage details are already up to date." };

  const changed = await prisma.$transaction(async (tx) => {
    const result = await tx.ticket.updateMany({
      where: {
        id: parsed.data.ticketId,
        version: parsed.data.expectedVersion,
        status: { not: TicketStatus.RESOLVED },
        ...editorScope(user.role, user.id),
      },
      data: {
        priority: parsed.data.priority,
        category: parsed.data.category,
        version: { increment: 1 },
      },
    });
    if (result.count !== 1) return false;

    const activities: Prisma.TicketActivityCreateManyInput[] = [];
    if (priorityChanged) {
      activities.push({
        ticketId: parsed.data.ticketId,
        actorId: user.id,
        type: "PRIORITY_CHANGED" as ActivityType,
        content: "Priority changed from " + current.priority + " to " + parsed.data.priority,
        metadata: { from: current.priority, to: parsed.data.priority },
      });
    }
    if (categoryChanged) {
      activities.push({
        ticketId: parsed.data.ticketId,
        actorId: user.id,
        type: "CATEGORY_CHANGED" as ActivityType,
        content: "Category changed from " + current.category + " to " + parsed.data.category,
        metadata: { from: current.category, to: parsed.data.category },
      });
    }
    await tx.ticketActivity.createMany({ data: activities });
    return true;
  });

  if (!changed) return { ok: false, message: "This ticket changed or you are no longer its owner. Refresh and try again." };
  refreshTicketViews();
  return { ok: true, data: undefined, message: "Priority and category updated." };
}

export async function addRequesterReplyAction(input: unknown): Promise<ActionResult> {
  const user = await requireRole("EMPLOYEE");
  const parsed = requesterReplySchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);

  const current = await prisma.ticket.findUnique({
    where: { id: parsed.data.ticketId },
    select: { requesterId: true, status: true },
  });
  if (!current || current.requesterId !== user.id) {
    return { ok: false, message: "This request could not be found." };
  }
  if (current.status !== TicketStatus.WAITING) {
    return { ok: false, message: "A reply can only be added while support is waiting for your information." };
  }

  const added = await prisma.$transaction(async (tx) => {
    const result = await tx.ticket.updateMany({
      where: {
        id: parsed.data.ticketId,
        requesterId: user.id,
        version: parsed.data.expectedVersion,
        status: TicketStatus.WAITING,
      },
      data: {
        status: TicketStatus.IN_PROGRESS,
        version: { increment: 1 },
      },
    });
    if (result.count !== 1) return false;
    await tx.ticketActivity.create({
      data: {
        ticketId: parsed.data.ticketId,
        actorId: user.id,
        type: "REQUESTER_REPLY" as ActivityType,
        content: parsed.data.content,
        metadata: { statusFrom: TicketStatus.WAITING, statusTo: TicketStatus.IN_PROGRESS },
      },
    });
    return true;
  });

  if (!added) return { ok: false, message: "This request changed while you were replying. Refresh and try again." };
  refreshTicketViews();
  return { ok: true, data: undefined, message: "Reply sent. The request is back in progress." };
}

export async function resolveTicketAction(input: unknown): Promise<ActionResult> {
  const parsed = resolveSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);

  const access = await editableTicket(parsed.data.ticketId);
  if (!access.ticket) return { ok: false, message: access.error };
  const { user } = access;

  const resolved = await prisma.$transaction(async (tx) => {
    const result = await tx.ticket.updateMany({
      where: {
        id: parsed.data.ticketId,
        version: parsed.data.expectedVersion,
        status: { not: TicketStatus.RESOLVED },
        ...editorScope(user.role, user.id),
      },
      data: { status: TicketStatus.RESOLVED, resolvedAt: new Date(), version: { increment: 1 } },
    });
    if (result.count !== 1) return false;
    await tx.ticketActivity.create({
      data: {
        ticketId: parsed.data.ticketId,
        actorId: user.id,
        type: ActivityType.RESOLVED,
        content: parsed.data.note || "Ticket resolved",
      },
    });
    return true;
  });

  if (!resolved) return { ok: false, message: "This ticket was already resolved or changed. Refresh to see the latest state." };
  refreshTicketViews();
  return { ok: true, data: undefined, message: "Ticket resolved." };
}
