import { Skeleton } from "@/components/ui/skeleton";

export default function WorkspaceLoading() {
  return (
    <div aria-label="Loading workspace" className="animate-pulse space-y-6">
      <div className="space-y-3"><Skeleton className="h-4 w-28" /><Skeleton className="h-10 w-72 max-w-full" /><Skeleton className="h-5 w-[32rem] max-w-full" /></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-40 rounded-2xl" />)}</div>
      <Skeleton className="h-80 rounded-2xl" />
    </div>
  );
}
