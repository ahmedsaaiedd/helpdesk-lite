"use server";

import { Prisma } from "@prisma/client";
import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-user";
import { prisma } from "@/lib/prisma";
import { createUserSchema } from "@/lib/validation";

export type CreateUserActionResult =
  | { ok: true; data: { id: string; name: string }; message: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

export async function createUserAction(input: unknown): Promise<CreateUserActionResult> {
  await requireRole("MANAGER");
  const parsed = createUserSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the highlighted fields and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { name, email, role, password } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return {
      ok: false,
      message: "An account already uses this email.",
      fieldErrors: { email: ["This work email is already registered."] },
    };
  }

  try {
    const passwordHash = await hash(password, 12);
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: { name, email, role, passwordHash, active: true },
        select: { id: true, name: true },
      });
      await tx.authAttempt.deleteMany({ where: { email } });
      return created;
    });

    revalidatePath("/manager/users");
    revalidatePath("/manager/workload");
    revalidatePath("/manager");
    return { ok: true, data: user, message: user.name + " can now sign in." };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        ok: false,
        message: "An account already uses this email.",
        fieldErrors: { email: ["This work email is already registered."] },
      };
    }
    console.error("User creation failed", error);
    return { ok: false, message: "We could not create this account. Try again." };
  }
}
