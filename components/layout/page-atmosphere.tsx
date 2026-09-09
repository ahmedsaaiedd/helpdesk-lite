import { cn } from "@/lib/utils";

export function PageAtmosphere({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("page-atmosphere", className)} />;
}
