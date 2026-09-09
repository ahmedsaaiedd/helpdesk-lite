"use client";

import type { Role } from "@prisma/client";
import { LoaderCircle, RotateCcw, Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORY_LABELS, PRIORITY_LABELS, STATUS_LABELS } from "@/lib/domain";

export function TicketFilters({ role, hideOwner = false, activeOnly = false, supportUsers = [] }: { role: Role; hideOwner?: boolean; activeOnly?: boolean; supportUsers?: { id: string; name: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const paramsString = params.toString();
  const [query, setQuery] = useState(params.get("q") || "");
  const [isPending, startTransition] = useTransition();

  function update(key: string, value: string, defaultValue = "all") {
    const next = new URLSearchParams(params.toString());
    if (!value || value === defaultValue) next.delete(key);
    else next.set(key, value);
    next.delete("page");
    startTransition(() => router.replace(pathname + (next.size ? "?" + next.toString() : ""), { scroll: false }));
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const current = new URLSearchParams(paramsString);
      if (query.trim() === (current.get("q") || "")) return;
      if (query.trim()) current.set("q", query.trim()); else current.delete("q");
      current.delete("page");
      startTransition(() => router.replace(pathname + (current.size ? "?" + current.toString() : ""), { scroll: false }));
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [query, paramsString, pathname, router]);

  const hasFilters = Array.from(params.keys()).some((key) => ["q", "status", "priority", "category", "owner", "assignee", "attention", "sort"].includes(key));

  return (
    <div className="surface-panel mb-5 p-3.5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="relative min-w-0 flex-1 xl:max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={role === "EMPLOYEE" ? "Search ID or title" : "Search ID, title or requester"} aria-label="Search tickets" className="h-10 rounded-xl bg-background pl-10" />
          {isPending ? <LoaderCircle className="absolute right-3.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-primary" aria-label="Updating results" /> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterSelect label="Status" value={params.get("status") || "all"} onChange={(value) => update("status", value)} options={Object.entries(STATUS_LABELS).filter(([value]) => !activeOnly || value !== "RESOLVED")} />
          <FilterSelect label="Priority" value={params.get("priority") || "all"} onChange={(value) => update("priority", value)} options={Object.entries(PRIORITY_LABELS)} />
          <FilterSelect label="Category" value={params.get("category") || "all"} onChange={(value) => update("category", value)} options={Object.entries(CATEGORY_LABELS)} />
          {!hideOwner && role === "SUPPORT" ? <FilterSelect label="Owner" value={params.get("owner") || "all"} onChange={(value) => update("owner", value)} options={[["unassigned", "Unassigned"], ["me", "Assigned to me"]]} /> : null}
          {!hideOwner && role === "MANAGER" ? <FilterSelect label="Owner" value={params.get("assignee") || "all"} onChange={(value) => update("assignee", value)} options={supportUsers.map((person) => [person.id, person.name] as const)} /> : null}
          {role !== "EMPLOYEE" ? <FilterSelect label="Attention" value={params.get("attention") || "all"} onChange={(value) => update("attention", value)} options={[["stale", "Needs attention"]]} /> : null}
          <FilterSelect
            label="Sort"
            value={params.get("sort") || "updated"}
            defaultValue="updated"
            includeAll={false}
            onChange={(value) => update("sort", value, "updated")}
            options={[["updated", "Recently updated"], ["created", "Newest created"], ["priority", "Highest priority"]]}
          />
          {hasFilters ? (
            <Button variant="ghost" onClick={() => { setQuery(""); startTransition(() => router.replace(pathname, { scroll: false })); }} className="h-10 rounded-xl px-3 text-muted-foreground">
              <RotateCcw className="size-4" />Clear
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function FilterSelect({ label, value, options, onChange, allLabel = "All", includeAll = true, defaultValue = "all" }: { label: string; value: string; options: readonly (readonly [string, string])[]; onChange: (value: string) => void; allLabel?: string; includeAll?: boolean; defaultValue?: string }) {
  const selectedValue = (includeAll && value === "all") || options.some(([optionValue]) => optionValue === value)
    ? value
    : defaultValue;

  return (
    <Select value={selectedValue} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className="h-10 min-w-[126px] rounded-xl bg-background"><SelectValue placeholder={label} /></SelectTrigger>
      <SelectContent position="popper" className="rounded-xl">
        {includeAll ? <SelectItem value="all">{allLabel}</SelectItem> : null}
        {options.map(([value, text]) => <SelectItem key={value} value={value}>{text}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
