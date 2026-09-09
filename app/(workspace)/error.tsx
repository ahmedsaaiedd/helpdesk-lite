"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function WorkspaceError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("Workspace render failed", error); }, [error]);
  return (
    <section className="surface-panel grid min-h-[430px] place-items-center p-8 text-center">
      <div>
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-warning/10 text-warning"><AlertTriangle className="size-5" /></span>
        <h1 className="mt-4 text-xl font-semibold">This view did not load</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">We could not load the latest ticket data. Nothing was changed.</p>
        <Button onClick={reset} className="mt-5 rounded-xl"><RotateCcw className="size-4" />Try again</Button>
      </div>
    </section>
  );
}
