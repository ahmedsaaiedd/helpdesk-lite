import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-background p-6">
      <section className="surface-panel w-full max-w-md p-8 text-center">
        <div className="mx-auto mb-5 grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <FileQuestion aria-hidden="true" />
        </div>
        <p className="eyebrow">404</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">We could not find that page</h1>
        <p className="mt-3 text-muted-foreground">The link may be outdated, or the item may no longer be available.</p>
        <Button asChild className="mt-7 h-11 rounded-xl px-5">
          <Link href="/">Return to HelpDesk Lite</Link>
        </Button>
      </section>
    </main>
  );
}
