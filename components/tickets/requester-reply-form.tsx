"use client";

import { LoaderCircle, MessageCircleReply, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { addRequesterReplyAction } from "@/app/actions/tickets";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function RequesterReplyForm({ ticketId, version }: { ticketId: string; version: number }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (content.trim().length < 2 || isSubmitting) return;
    setIsSubmitting(true);
    setError("");
    try {
      const result = await addRequesterReplyAction({ ticketId, content, expectedVersion: version });
      if (!result.ok) {
        setError(result.message);
        toast.error("Reply not sent", { description: result.message });
        return;
      }
      setContent("");
      toast.success("Reply sent", { description: result.message });
      router.refresh();
    } catch {
      const message = "We could not send your reply. Your text is still here, so you can try again.";
      setError(message);
      toast.error("Reply not sent", { description: message });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="surface-panel border-warning/35 p-5 sm:p-7">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-warning/10 text-warning">
          <MessageCircleReply className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-semibold">Support is waiting for your reply</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">Add the missing information here. Your request will return to In Progress automatically.</p>
        </div>
      </div>
      <form onSubmit={submit} className="mt-5">
        <label htmlFor="requester-reply" className="text-sm font-semibold">Your reply</label>
        <Textarea
          id="requester-reply"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          maxLength={1500}
          rows={4}
          placeholder="Add the requested details, an error message, or what you tried…"
          className="mt-2 min-h-28 rounded-xl text-base md:text-sm"
          aria-invalid={Boolean(error)}
        />
        <div className="mt-3 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div aria-live="polite">{error ? <p role="alert" className="text-sm text-destructive">{error}</p> : <p className="text-xs text-muted-foreground">Maximum 1,500 characters.</p>}</div>
          <Button type="submit" disabled={isSubmitting || content.trim().length < 2} className="h-10 rounded-xl px-4">
            {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}
            {isSubmitting ? "Sending…" : "Send reply"}
          </Button>
        </div>
      </form>
    </section>
  );
}
