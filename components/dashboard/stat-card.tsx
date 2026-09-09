import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  note,
  href,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: number;
  note: string;
  href?: string;
  icon: LucideIcon;
  tone?: "neutral" | "primary" | "warning" | "success";
}) {
  const card = (
    <div className={cn("surface-panel group relative h-full overflow-hidden p-5 transition-[border-color,transform]", href && "hover:-translate-y-0.5 hover:border-primary/35")}>
      <div className="flex items-start justify-between gap-4">
        <span className={cn(
          "grid size-10 place-items-center rounded-xl",
          tone === "primary" && "bg-primary/10 text-primary",
          tone === "warning" && "bg-warning/10 text-warning",
          tone === "success" && "bg-success/10 text-success",
          tone === "neutral" && "bg-muted text-muted-foreground",
        )}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
        {href ? <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" /> : null}
      </div>
      <p className="mt-5 text-3xl font-semibold tracking-[-0.04em] tabular-nums">{value}</p>
      <p className="mt-1 text-sm font-semibold">{label}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{note}</p>
    </div>
  );

  return href ? <Link href={href} className="block rounded-[var(--radius)]">{card}</Link> : card;
}
