import type { Metadata } from "next";
import { CheckCircle2, Clock3, LifeBuoy, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/components/auth/login-form";
import { homeForRole } from "@/lib/domain";

export const metadata: Metadata = { title: "Sign in" };

const promises = [
  [Clock3, "Clear status at a glance"],
  [ShieldCheck, "Role-protected access"],
  [CheckCircle2, "Every update recorded"],
] as const;

export default async function LoginPage() {
  const session = await auth();
  if (session?.user?.active && session.user.role) redirect(homeForRole(session.user.role));

  return (
    <main className="min-h-screen bg-[#081521] text-white lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(480px,0.95fr)]">
      <section className="relative hidden min-h-screen overflow-hidden p-12 lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="absolute inset-0 opacity-60 [background:radial-gradient(circle_at_18%_12%,rgba(91,208,194,0.22),transparent_34%),radial-gradient(circle_at_82%_82%,rgba(54,106,147,0.2),transparent_36%)]" />
        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,.9)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.9)_1px,transparent_1px)] [background-size:48px_48px]" />

        <div className="relative flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-[#62d6c9] text-[#08201f] shadow-[0_0_0_5px_rgba(98,214,201,0.09)]">
            <LifeBuoy className="size-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-lg font-bold tracking-tight">HelpDesk Lite</p>
            <p className="text-xs text-slate-400">Internal support workspace</p>
          </div>
        </div>

        <div className="relative max-w-xl pb-10">
          <p className="mb-5 text-xs font-bold uppercase tracking-[0.18em] text-[#62d6c9]">Maximum clarity. Minimum overhead.</p>
          <h1 className="balanced text-5xl font-semibold leading-[1.08] tracking-[-0.04em] xl:text-6xl">
            Support work stays visible, owned, and moving.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">
            One focused workspace for internal requests—from first report to final resolution.
          </p>
          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {promises.map(([Icon, label]) => (
              <div key={label} className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.045] p-3.5 text-sm text-slate-200">
                <Icon className="size-4 shrink-0 text-[#62d6c9]" aria-hidden="true" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-slate-500">Private workspace · Authorized staff only</p>
      </section>

      <section className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-background px-5 py-10 text-foreground sm:px-10 lg:rounded-l-[2rem]">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 lg:hidden">
          <div className="absolute inset-0 opacity-70 [background:radial-gradient(circle_at_10%_4%,rgba(91,208,194,0.18),transparent_32%),radial-gradient(circle_at_94%_88%,rgba(54,106,147,0.16),transparent_38%)]" />
          <div className="absolute inset-0 opacity-[0.1] [background-image:linear-gradient(rgba(91,208,194,.3)_1px,transparent_1px),linear-gradient(90deg,rgba(91,208,194,.3)_1px,transparent_1px)] [background-size:42px_42px] [mask-image:linear-gradient(to_bottom,black,transparent_92%)]" />
          <div className="absolute -right-32 top-[26%] size-72 rounded-full border border-primary/10" />
          <div className="absolute -right-16 top-[34%] size-44 rounded-full border border-primary/10" />
          <div className="absolute -left-24 bottom-[8%] size-56 rounded-full border border-primary/[0.08]" />
          <div className="absolute left-5 top-0 h-24 w-px bg-linear-to-b from-primary/45 to-transparent sm:left-10" />
        </div>

        <div className="relative z-10 w-full max-w-[430px]">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
              <LifeBuoy className="size-5" aria-hidden="true" />
            </div>
            <div>
              <p className="font-bold tracking-tight">HelpDesk Lite</p>
              <p className="text-xs text-muted-foreground">Internal support workspace</p>
            </div>
          </div>

          <p className="eyebrow">Welcome back</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.035em]">Sign in to your workspace</h2>
          <p className="mb-8 mt-3 text-base leading-7 text-muted-foreground">Use your work account to view and manage support requests.</p>
          <LoginForm showDemo={process.env.NODE_ENV !== "production"} />
        </div>
      </section>
    </main>
  );
}
