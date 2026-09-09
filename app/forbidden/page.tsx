import Link from "next/link";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/require-user";
import { homeForRole } from "@/lib/domain";

export default async function ForbiddenPage() {
  const user = await requireUser();
  return (
    <main className="grid min-h-screen place-items-center bg-background p-6">
      <section className="surface-panel w-full max-w-md p-8 text-center">
        <div className="mx-auto mb-5 grid size-12 place-items-center rounded-2xl bg-destructive/10 text-destructive">
          <ShieldX aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">That area is restricted</h1>
        <p className="mt-3 text-muted-foreground">Your {user.role.toLowerCase()} account does not have permission to open this page.</p>
        <Button asChild className="mt-7 h-11 rounded-xl px-5">
          <Link href={homeForRole(user.role)}>Back to your workspace</Link>
        </Button>
      </section>
    </main>
  );
}
