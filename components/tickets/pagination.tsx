"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export function Pagination({ page, pages, total }: { page: number; pages: number; total: number }) {
  const pathname = usePathname();
  const params = useSearchParams();
  if (pages <= 1) return total ? <p className="mt-4 text-sm text-muted-foreground">{total} ticket{total === 1 ? "" : "s"}</p> : null;

  function href(target: number) {
    const next = new URLSearchParams(params.toString());
    if (target === 1) next.delete("page"); else next.set("page", String(target));
    return pathname + (next.size ? "?" + next.toString() : "");
  }

  return (
    <nav aria-label="Ticket pages" className="mt-5 flex items-center justify-between gap-4">
      <p className="text-sm text-muted-foreground">Page {page} of {pages} · {total} tickets</p>
      <div className="flex gap-2">
        <Button asChild={page > 1} variant="outline" size="sm" disabled={page <= 1} className="rounded-xl">
          {page > 1 ? <Link href={href(page - 1)}><ChevronLeft className="size-4" />Previous</Link> : <span><ChevronLeft className="size-4" />Previous</span>}
        </Button>
        <Button asChild={page < pages} variant="outline" size="sm" disabled={page >= pages} className="rounded-xl">
          {page < pages ? <Link href={href(page + 1)}>Next<ChevronRight className="size-4" /></Link> : <span>Next<ChevronRight className="size-4" /></span>}
        </Button>
      </div>
    </nav>
  );
}
