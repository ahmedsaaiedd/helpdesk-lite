import type { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/auth";
import { homeForRole } from "@/lib/domain";
import { prisma } from "@/lib/prisma";

const currentUser = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true, active: true },
  });
  return user ? { ...user, isDemo: session.user.demo === true } : null;
});

export async function requireUser() {
  const user = await currentUser();
  if (!user?.active || !user.role) redirect("/login?reason=session");
  return user;
}

export async function requireRole(...roles: Role[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/forbidden");
  return user;
}

export async function redirectToWorkspace() {
  const user = await requireUser();
  redirect(homeForRole(user.role));
}
