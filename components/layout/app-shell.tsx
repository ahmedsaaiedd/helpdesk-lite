"use client";

import type { Role } from "@prisma/client";
import {
  ClipboardList,
  Gauge,
  LifeBuoy,
  Menu,
  PlusCircle,
  SearchCheck,
  ShieldCheck,
  UserPlus,
  UsersRound,
  UserRoundCheck,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ROLE_LABELS } from "@/lib/domain";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ThemeMenu } from "./theme-menu";

type ShellUser = { name?: string | null; email?: string | null; role: Role };

const navigation = {
  EMPLOYEE: [
    { href: "/employee", label: "Overview", icon: Gauge },
    { href: "/employee/requests", label: "My Requests", icon: ClipboardList },
    { href: "/employee/requests/new", label: "New Request", icon: PlusCircle },
  ],
  SUPPORT: [
    { href: "/support", label: "Overview", icon: Gauge },
    { href: "/support/tickets", label: "Ticket Queue", icon: SearchCheck },
    { href: "/support/my-tickets", label: "My Tickets", icon: UserRoundCheck },
  ],
  MANAGER: [
    { href: "/manager", label: "Overview", icon: Gauge },
    { href: "/manager/requests", label: "Open Requests", icon: ClipboardList },
    { href: "/manager/workload", label: "Team Workload", icon: UsersRound },
    { href: "/manager/unassigned", label: "Unassigned", icon: ShieldCheck },
    { href: "/manager/users", label: "Users", icon: UserPlus },
  ],
} satisfies Record<Role, { href: string; label: string; icon: typeof Gauge }[]>;

function isActive(pathname: string, href: string) {
  if (pathname === href) return true;
  if (href.endsWith("/requests") || href.endsWith("/tickets")) return pathname.startsWith(href + "/");
  return false;
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-3 rounded-xl focus-visible:outline-offset-4">
      <span className="grid size-9 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-[0_0_0_4px_rgba(98,214,201,0.08)]">
        <LifeBuoy className="size-[18px]" aria-hidden="true" />
      </span>
      <span>
        <span className="block text-[15px] font-bold tracking-tight text-white">HelpDesk Lite</span>
        <span className="block text-[11px] text-slate-400">Internal support</span>
      </span>
    </Link>
  );
}

function NavLinks({ role, pathname, mobile = false }: { role: Role; pathname: string; mobile?: boolean }) {
  return (
    <nav aria-label="Primary" className="space-y-1.5">
      {navigation[role].map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        const link = (
          <Link
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-medium transition-colors",
              active ? "text-white" : "text-slate-400 hover:bg-sidebar-accent hover:text-white",
            )}
          >
            {active ? <motion.span layoutId={mobile ? "mobile-nav-active" : "nav-active"} className="absolute inset-0 rounded-xl bg-sidebar-accent" transition={{ duration: 0.2 }} /> : null}
            <Icon className={cn("relative size-[18px]", active && "text-sidebar-primary")} aria-hidden="true" />
            <span className="relative">{label}</span>
          </Link>
        );
        return mobile ? <SheetClose asChild key={href}>{link}</SheetClose> : <div key={href}>{link}</div>;
      })}
    </nav>
  );
}

function UserMenu({ user }: { user: ShellUser }) {
  const name = user.name || "Workspace user";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex min-h-11 max-w-[220px] items-center gap-3 rounded-xl p-1.5 pr-3 text-left transition-colors hover:bg-muted" aria-label="Open user menu">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/12 text-xs font-bold text-primary">{initials(name)}</span>
          <span className="min-w-0 hidden sm:block">
            <span className="block truncate text-sm font-semibold">{name}</span>
            <span className="block text-xs text-muted-foreground">{ROLE_LABELS[user.role]}</span>
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 rounded-xl p-1.5">
        <DropdownMenuLabel className="px-3 py-2">
          <span className="block truncate font-semibold">{name}</span>
          <span className="mt-0.5 block truncate text-xs font-normal text-muted-foreground">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <form action={signOutAction}>
          <DropdownMenuItem asChild className="rounded-lg">
            <button type="submit" className="w-full">Sign out</button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell({ user, children }: { user: ShellUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <a href="#main-content" className="fixed left-3 top-3 z-[100] -translate-y-20 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform focus:translate-y-0">Skip to main content</a>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-sidebar-border bg-sidebar px-4 py-5 text-sidebar-foreground lg:flex">
        <div className="px-2"><Brand /></div>
        <div className="mt-9 flex-1">
          <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">{ROLE_LABELS[user.role]} workspace</p>
          <NavLinks role={user.role} pathname={pathname} />
        </div>
        <div className="rounded-xl border border-sidebar-border bg-white/[0.035] p-3 text-xs leading-5 text-slate-400">
          <p className="font-semibold text-slate-200">Need quick help?</p>
          <p className="mt-1">Keep updates specific so everyone knows what happens next.</p>
        </div>
      </aside>

      <div className="min-w-0 lg:col-start-2">
        <div className="floating-header-wrap pointer-events-none sticky top-0 z-20 px-3 sm:px-4 lg:px-6 xl:px-8">
          <header className="floating-header pointer-events-auto flex h-14 items-center justify-between px-2.5 sm:px-4">
            <div className="flex min-w-0 items-center gap-2 lg:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-9 shrink-0 rounded-xl" aria-label="Open navigation">
                    <Menu className="size-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[290px] border-sidebar-border bg-sidebar p-0 text-sidebar-foreground">
                  <SheetHeader className="border-b border-sidebar-border p-5 text-left"><SheetTitle><Brand /></SheetTitle></SheetHeader>
                  <div className="p-4"><NavLinks role={user.role} pathname={pathname} mobile /></div>
                </SheetContent>
              </Sheet>
              <span className="truncate text-sm font-bold tracking-tight">HelpDesk Lite</span>
            </div>
            <div className="hidden lg:block">
              <p className="text-xs font-semibold text-muted-foreground">{ROLE_LABELS[user.role]} workspace</p>
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-1.5">
              <ThemeMenu />
              <div className="mx-0.5 h-6 w-px bg-border sm:mx-1" />
              <UserMenu user={user} />
            </div>
          </header>
        </div>

        <main id="main-content" className="mx-auto w-full max-w-[1480px] p-4 sm:p-6 lg:p-8 xl:p-10">
          <motion.div
            key={pathname}
            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2, ease: [0.2, 0.8, 0.2, 1] }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
