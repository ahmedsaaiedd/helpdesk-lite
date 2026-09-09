import type {
  ActivityType,
  Role,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "@prisma/client";

export type TicketActivityKind = ActivityType | "PRIORITY_CHANGED" | "CATEGORY_CHANGED" | "REQUESTER_REPLY";

export const ROLE_LABELS: Record<Role, string> = {
  EMPLOYEE: "Employee",
  SUPPORT: "Support",
  MANAGER: "Manager",
};

export const STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  WAITING: "Waiting",
  RESOLVED: "Resolved",
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export const CATEGORY_LABELS: Record<TicketCategory, string> = {
  IT_HARDWARE: "IT Hardware",
  SOFTWARE: "Software",
  ACCOUNT_ACCESS: "Account Access",
  NETWORK: "Network",
  FACILITIES: "Facilities",
  HR_PEOPLE: "HR & People",
  OTHER: "Other",
};

export const ACTIVITY_LABELS: Record<TicketActivityKind, string> = {
  CREATED: "created this request",
  ASSIGNED: "took ownership",
  REASSIGNED: "reassigned this request",
  STATUS_CHANGED: "changed the status",
  PRIORITY_CHANGED: "changed the priority",
  CATEGORY_CHANGED: "changed the category",
  PROGRESS_UPDATE: "posted a progress update",
  REQUESTER_REPLY: "replied with more information",
  RESOLVED: "resolved this request",
};

export const ACTIVE_STATUSES: TicketStatus[] = ["OPEN", "IN_PROGRESS", "WAITING"];
export const STALE_AFTER_HOURS = 48;

export const STATUS_TRANSITIONS: Record<TicketStatus, readonly TicketStatus[]> = {
  OPEN: ["IN_PROGRESS", "WAITING", "RESOLVED"],
  IN_PROGRESS: ["OPEN", "WAITING", "RESOLVED"],
  WAITING: ["OPEN", "IN_PROGRESS", "RESOLVED"],
  RESOLVED: [],
};

export function homeForRole(role: Role) {
  if (role === "EMPLOYEE") return "/employee";
  if (role === "SUPPORT") return "/support";
  return "/manager";
}

export function canAccessTicket(role: Role, userId: string, requesterId: string) {
  return role !== "EMPLOYEE" || userId === requesterId;
}

export function canEditTicket(role: Role, userId: string, assigneeId: string | null) {
  return role === "MANAGER" || (role === "SUPPORT" && assigneeId === userId);
}

export function canTransition(from: TicketStatus, to: TicketStatus) {
  return STATUS_TRANSITIONS[from].includes(to);
}

export function staleBefore(now = new Date()) {
  return new Date(now.getTime() - STALE_AFTER_HOURS * 60 * 60 * 1000);
}

export function isTicketStale(ticket: { status: TicketStatus; updatedAt: Date }, now = new Date()) {
  return ACTIVE_STATUSES.includes(ticket.status) && ticket.updatedAt <= staleBefore(now);
}
