import type { Metadata } from "next";
import type { Role } from "@prisma/client";
import { ShieldCheck, UserPlus, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { PageAtmosphere } from "@/components/layout/page-atmosphere";
import { CreateUserForm } from "@/components/users/create-user-form";
import { requireRole } from "@/lib/auth/require-user";
import { getUsers, type UserListItem } from "@/lib/data/users";
import { ROLE_LABELS } from "@/lib/domain";
import { formatExact, initials } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Users" };

const roleTone: Record<Role, string> = {
  EMPLOYEE: "bg-muted text-muted-foreground",
  SUPPORT: "bg-primary/10 text-primary",
  MANAGER: "bg-warning/10 text-warning",
};

export default async function UsersPage() {
  const manager = await requireRole("MANAGER");
  const users = await getUsers();
  const activeCount = users.filter((user) => user.active).length;

  return (
    <div className="page-with-atmosphere soft-enter">
      <PageAtmosphere />
      <PageHeader eyebrow="Access management" title="Users" description="Create controlled internal accounts and see who can access the workspace." icon={UsersRound} />

      <div className="grid items-start gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">
        <div className="xl:sticky xl:top-24">
          {manager.isDemo ? (
            <div className="surface-panel form-surface p-5 sm:p-6">
              <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="size-5" aria-hidden="true" />
              </span>
              <h2 className="mt-4 font-semibold">User management is protected</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                You can inspect the account directory in Demo Mode, but creating accounts is disabled to keep the public workspace safe.
              </p>
            </div>
          ) : <CreateUserForm />}
        </div>
        <section className="surface-panel overflow-hidden">
          <div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="font-semibold">Workspace accounts</h2>
              <p className="mt-1 text-sm text-muted-foreground">{activeCount} active · {users.length} total</p>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-success/10 px-3 py-1.5 text-xs font-semibold text-success"><ShieldCheck className="size-3.5" />Manager controlled</span>
          </div>

          {users.length ? <UserList users={users} /> : (
            <div className="relative grid min-h-72 place-items-center overflow-hidden p-8 text-center">
              <div aria-hidden="true" className="empty-state-pattern" />
              <div className="relative"><UserPlus className="mx-auto size-7 text-muted-foreground" /><p className="mt-3 font-semibold">No accounts yet</p></div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function UserList({ users }: { users: UserListItem[] }) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[680px] border-collapse text-left">
          <thead><tr className="border-b bg-muted/50 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground"><th scope="col" className="px-6 py-3.5">User</th><th scope="col" className="px-4 py-3.5">Role</th><th scope="col" className="px-4 py-3.5">Status</th><th scope="col" className="px-6 py-3.5 text-right">Created</th></tr></thead>
          <tbody className="divide-y">{users.map((user) => (
            <tr key={user.id} className="transition-colors hover:bg-accent/35">
              <td className="px-6 py-4"><div className="flex items-center gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-xs font-bold text-primary">{initials(user.name)}</span><div className="min-w-0"><p className="truncate text-sm font-semibold">{user.name}</p><p className="mt-0.5 truncate text-xs text-muted-foreground">{user.email}</p></div></div></td>
              <td className="px-4 py-4"><RoleBadge role={user.role} /></td>
              <td className="px-4 py-4"><span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold", user.active ? "text-success" : "text-muted-foreground")}><span className={cn("size-1.5 rounded-full", user.active ? "bg-success" : "bg-muted-foreground")} />{user.active ? "Active" : "Inactive"}</span></td>
              <td className="px-6 py-4 text-right text-xs text-muted-foreground"><time dateTime={user.createdAt.toISOString()} title={formatExact(user.createdAt)}>{formatExact(user.createdAt)}</time></td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      <div className="divide-y md:hidden">{users.map((user) => (
        <article key={user.id} className="p-4">
          <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-xs font-bold text-primary">{initials(user.name)}</span><div className="min-w-0 flex-1"><h3 className="truncate font-semibold">{user.name}</h3><p className="mt-0.5 truncate text-xs text-muted-foreground">{user.email}</p></div><RoleBadge role={user.role} /></div>
          <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground"><span className={user.active ? "font-semibold text-success" : ""}>{user.active ? "Active" : "Inactive"}</span><time dateTime={user.createdAt.toISOString()}>{formatExact(user.createdAt)}</time></div>
        </article>
      ))}</div>
    </>
  );
}

function RoleBadge({ role }: { role: Role }) {
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", roleTone[role])}>{ROLE_LABELS[role]}</span>;
}
