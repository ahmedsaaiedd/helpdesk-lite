"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { TicketPriority } from "@prisma/client";
import { ArrowRight, CheckCircle2, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { createTicketAction } from "@/app/actions/tickets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORY_LABELS, PRIORITY_LABELS } from "@/lib/domain";
import { newTicketSchema, type NewTicketInput } from "@/lib/validation";

type NewTicketFormInput = z.input<typeof newTicketSchema>;

export function NewTicketForm() {
  const router = useRouter();
  const [requestKey] = useState(() => globalThis.crypto.randomUUID());
  const [serverError, setServerError] = useState("");
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<NewTicketFormInput, undefined, NewTicketInput>({
    resolver: zodResolver(newTicketSchema),
    defaultValues: { title: "", description: "", category: undefined, priority: TicketPriority.MEDIUM, requestKey },
  });

  useEffect(() => {
    function beforeUnload(event: BeforeUnloadEvent) {
      if (isDirty && !isSubmitting) event.preventDefault();
    }
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [isDirty, isSubmitting]);

  async function onSubmit(values: NewTicketInput) {
    setServerError("");
    const result = await createTicketAction(values);
    if (!result.ok) {
      if (result.fieldErrors) {
        for (const [field, messages] of Object.entries(result.fieldErrors)) {
          setError(field as keyof NewTicketFormInput, { message: messages[0] });
        }
      }
      setServerError(result.message);
      return;
    }
    toast.success("Request created", { description: result.message });
    router.push("/employee/requests/" + result.data.id);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <section className="surface-panel form-surface p-5 sm:p-7">
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-semibold">Title <span className="text-destructive">*</span></label>
          <p className="text-sm text-muted-foreground">A short summary that makes the issue easy to recognize.</p>
          <Input id="title" maxLength={120} placeholder="e.g. Cannot access the shared finance drive" aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? "title-error" : undefined} className="h-12 rounded-xl text-base md:text-base" {...register("title")} />
          {errors.title ? <p id="title-error" className="text-sm text-destructive">{errors.title.message}</p> : null}
        </div>

        <div className="mt-6 space-y-2">
          <label htmlFor="description" className="text-sm font-semibold">Description <span className="text-destructive">*</span></label>
          <p className="text-sm text-muted-foreground">What happened, what you expected, and anything you already tried.</p>
          <Textarea id="description" maxLength={4000} rows={8} placeholder="Describe the issue and include any useful error message…" aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? "description-error" : undefined} className="min-h-48 resize-y rounded-xl text-base leading-7 md:text-base" {...register("description")} />
          {errors.description ? <p id="description-error" className="text-sm text-destructive">{errors.description.message}</p> : null}
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-semibold">Category <span className="text-destructive">*</span></label>
            <Controller name="category" control={control} render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger aria-label="Category" aria-invalid={Boolean(errors.category)} className="h-12 w-full rounded-xl"><SelectValue placeholder="Choose a category" /></SelectTrigger>
                <SelectContent className="rounded-xl">{Object.entries(CATEGORY_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
              </Select>
            )} />
            {errors.category ? <p className="text-sm text-destructive">{errors.category.message}</p> : null}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">Priority</label>
            <Controller name="priority" control={control} render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger aria-label="Priority" className="h-12 w-full rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl">{Object.entries(PRIORITY_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
              </Select>
            )} />
          </div>
        </div>

        {serverError ? <div role="alert" className="mt-6 rounded-xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive">{serverError}</div> : null}

        <div className="mt-7 flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">You can follow every update after submission.</p>
          <Button type="submit" disabled={isSubmitting} className="h-11 rounded-xl px-5">
            {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {isSubmitting ? "Creating…" : "Create request"}
            {!isSubmitting ? <ArrowRight className="size-4" /> : null}
          </Button>
        </div>
      </section>

      <aside className="surface-panel guide-surface h-fit p-5 lg:sticky lg:top-24">
        <p className="text-sm font-semibold">What happens next</p>
        <ol className="mt-4 space-y-4">
          {["Your request enters the support queue.", "A support teammate takes ownership.", "Progress and status changes appear in the timeline."].map((text, index) => (
            <li key={text} className="flex gap-3 text-sm leading-6 text-muted-foreground">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">{index + 1}</span>{text}
            </li>
          ))}
        </ol>
        <div className="mt-5 flex gap-2.5 rounded-xl bg-success/8 p-3 text-xs leading-5 text-muted-foreground"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" /><span>No need to send a follow-up message—updates stay with the request.</span></div>
      </aside>
    </form>
  );
}
