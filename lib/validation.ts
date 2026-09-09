import {
  Role,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "@prisma/client";
import { z } from "zod";

const trimmed = (min: number, max: number, field: string) =>
  z
    .string()
    .trim()
    .min(min, field + " must be at least " + min + " characters.")
    .max(max, field + " must be at most " + max + " characters.");

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid work email."),
  password: z.string().min(8, "Password must be at least 8 characters.").max(128),
});

export const createUserSchema = z
  .object({
    name: trimmed(2, 80, "Name"),
    email: z.string().trim().toLowerCase().email("Enter a valid work email."),
    role: z.nativeEnum(Role),
    password: z
      .string()
      .min(10, "Password must be at least 10 characters.")
      .max(128, "Password must be at most 128 characters.")
      .regex(/[a-z]/, "Password needs a lowercase letter.")
      .regex(/[A-Z]/, "Password needs an uppercase letter.")
      .regex(/[0-9]/, "Password needs a number.")
      .regex(/[^A-Za-z0-9]/, "Password needs a symbol."),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const newTicketSchema = z.object({
  title: trimmed(4, 120, "Title"),
  description: trimmed(12, 4000, "Description"),
  category: z.nativeEnum(TicketCategory),
  priority: z.nativeEnum(TicketPriority).default(TicketPriority.MEDIUM),
  requestKey: z.string().uuid("Invalid submission key."),
});

export const progressSchema = z.object({
  ticketId: z.string().cuid(),
  content: trimmed(2, 1500, "Progress update"),
  expectedVersion: z.coerce.number().int().positive(),
});

export const requesterReplySchema = z.object({
  ticketId: z.string().cuid(),
  content: trimmed(2, 1500, "Reply"),
  expectedVersion: z.coerce.number().int().positive(),
});

export const triageSchema = z.object({
  ticketId: z.string().cuid(),
  priority: z.nativeEnum(TicketPriority),
  category: z.nativeEnum(TicketCategory),
  expectedVersion: z.coerce.number().int().positive(),
});

export const assignmentSchema = z.object({
  ticketId: z.string().cuid(),
  assigneeId: z.string().cuid().optional(),
  expectedVersion: z.coerce.number().int().positive(),
});

export const statusSchema = z.object({
  ticketId: z.string().cuid(),
  status: z.nativeEnum(TicketStatus),
  expectedVersion: z.coerce.number().int().positive(),
});

export const resolveSchema = z.object({
  ticketId: z.string().cuid(),
  note: z.string().trim().max(1500).optional(),
  expectedVersion: z.coerce.number().int().positive(),
});

export const ticketFiltersSchema = z.object({
  q: z.string().trim().max(100).catch(""),
  status: z.nativeEnum(TicketStatus).optional().catch(undefined),
  priority: z.nativeEnum(TicketPriority).optional().catch(undefined),
  category: z.nativeEnum(TicketCategory).optional().catch(undefined),
  owner: z.enum(["all", "unassigned", "me"]).catch("all"),
  assignee: z.string().cuid().optional().catch(undefined),
  attention: z.enum(["all", "stale"]).catch("all"),
  sort: z.enum(["updated", "created", "priority"]).catch("updated"),
  page: z.coerce.number().int().positive().catch(1),
});

export const roleSchema = z.nativeEnum(Role);

export type NewTicketInput = z.infer<typeof newTicketSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type TicketFilters = z.infer<typeof ticketFiltersSchema>;

export function parseTicketFilters(raw: Record<string, string | string[] | undefined>) {
  const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
  return ticketFiltersSchema.parse({
    q: first(raw.q),
    status: first(raw.status),
    priority: first(raw.priority),
    category: first(raw.category),
    owner: first(raw.owner),
    assignee: first(raw.assignee),
    attention: first(raw.attention),
    sort: first(raw.sort),
    page: first(raw.page),
  });
}
