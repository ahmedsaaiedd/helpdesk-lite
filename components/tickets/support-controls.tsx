"use client";

import type { Role, TicketCategory, TicketPriority, TicketStatus } from "@prisma/client";
import { CheckCircle2, LoaderCircle, LockKeyhole, Send, UserCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  addProgressAction,
  reassignTicketAction,
  resolveTicketAction,
  takeOwnershipAction,
  updateTriageAction,
  updateStatusAction,
} from "@/app/actions/tickets";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORY_LABELS, PRIORITY_LABELS, STATUS_LABELS } from "@/lib/domain";

type SupportUser = { id: string; name: string; email: string };

export function SupportControls({
  ticketId,
  version,
  role,
  status,
  priority,
  category,
  assigneeId,
  currentUserId,
  supportUsers,
}: {
  ticketId: string;
  version: number;
  role: Role;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  assigneeId: string | null;
  currentUserId: string;
  supportUsers: SupportUser[];
}) {
  const router = useRouter();
  const [localVersion, setLocalVersion] = useState(version);
  const [localStatus, setLocalStatus] = useState(status);
  const [localPriority, setLocalPriority] = useState(priority);
  const [localCategory, setLocalCategory] = useState(category);
  const [localAssignee, setLocalAssignee] = useState(assigneeId);
  const [progress, setProgress] = useState("");
  const [resolutionNote, setResolutionNote] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function run(key: string, action: () => Promise<{ ok: boolean; message: string }>, onSuccess?: () => void) {
    setBusy(key);
    setError("");
    try {
      const result = await action();
      if (!result.ok) {
        setError(result.message);
        toast.error("Update not saved", { description: result.message });
        return false;
      }
      setLocalVersion((value) => value + 1);
      onSuccess?.();
      toast.success(result.message);
      router.refresh();
      return true;
    } catch {
      const message = "We could not update this ticket. Your previous data is still safe. Try again.";
      setError(message);
      toast.error("Update not saved", { description: message });
      return false;
    } finally {
      setBusy(null);
    }
  }

  if (localStatus === "RESOLVED") {
    return (
      <div className="rounded-xl border border-success/25 bg-success/8 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-success"><CheckCircle2 className="size-4" />Resolution complete</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">This ticket is read-only because it has been resolved.</p>
      </div>
    );
  }

  if (role === "SUPPORT" && !localAssignee) {
    return (
      <div className="space-y-3">
        <p className="text-xs leading-5 text-muted-foreground">Take ownership before changing status, triage, or updates.</p>
        <Button
          className="h-11 w-full rounded-xl"
          disabled={Boolean(busy)}
          onClick={() => run("claim", () => takeOwnershipAction({ ticketId, expectedVersion: localVersion }), () => setLocalAssignee(currentUserId))}
        >
          {busy === "claim" ? <LoaderCircle className="size-4 animate-spin" /> : <UserCheck className="size-4" />}
          {busy === "claim" ? "Taking ownership…" : "Take ownership"}
        </Button>
        {error ? <p role="alert" className="rounded-xl border border-destructive/25 bg-destructive/8 p-3 text-sm text-destructive">{error}</p> : null}
      </div>
    );
  }

  if (role === "SUPPORT" && localAssignee !== currentUserId) {
    return (
      <div className="rounded-xl border bg-muted/45 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold"><LockKeyhole className="size-4 text-muted-foreground" />Owner-only editing</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">This ticket is assigned to another teammate. Only its current owner or a manager can change it.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">Owner</label>
        <Select
          value={localAssignee || "unassigned"}
          disabled={Boolean(busy)}
          onValueChange={(value) => {
            if (value === "unassigned" || value === localAssignee) return;
            run("owner", () => reassignTicketAction({ ticketId, assigneeId: value, expectedVersion: localVersion }), () => setLocalAssignee(value));
          }}
        >
          <SelectTrigger aria-label="Owner" className="h-11 w-full rounded-xl"><SelectValue placeholder="Choose owner" /></SelectTrigger>
          <SelectContent className="rounded-xl">
            {!localAssignee ? <SelectItem value="unassigned">Unassigned</SelectItem> : null}
            {supportUsers.map((person) => <SelectItem key={person.id} value={person.id}>{person.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">Status</label>
        <Select
          value={localStatus}
          disabled={Boolean(busy)}
          onValueChange={(value) => {
            const next = value as TicketStatus;
            if (next === localStatus) return;
            run("status", () => updateStatusAction({ ticketId, status: next, expectedVersion: localVersion }), () => setLocalStatus(next));
          }}
        >
          <SelectTrigger aria-label="Status" className="h-11 w-full rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent className="rounded-xl">
            {(["OPEN", "IN_PROGRESS", "WAITING"] as TicketStatus[]).map((value) => <SelectItem key={value} value={value}>{STATUS_LABELS[value]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 border-t pt-5 sm:grid-cols-2 xl:grid-cols-1">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">Priority</label>
          <Select
            value={localPriority}
            disabled={Boolean(busy)}
            onValueChange={(value) => {
              const next = value as TicketPriority;
              if (next === localPriority) return;
              run("priority", () => updateTriageAction({ ticketId, priority: next, category: localCategory, expectedVersion: localVersion }), () => setLocalPriority(next));
            }}
          >
            <SelectTrigger aria-label="Priority" className="h-11 w-full rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent className="rounded-xl">{Object.entries(PRIORITY_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">Category</label>
          <Select
            value={localCategory}
            disabled={Boolean(busy)}
            onValueChange={(value) => {
              const next = value as TicketCategory;
              if (next === localCategory) return;
              run("category", () => updateTriageAction({ ticketId, priority: localPriority, category: next, expectedVersion: localVersion }), () => setLocalCategory(next));
            }}
          >
            <SelectTrigger aria-label="Category" className="h-11 w-full rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent className="rounded-xl">{Object.entries(CATEGORY_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <div className="border-t pt-5">
        <label htmlFor="progress" className="text-sm font-semibold">Progress update</label>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">Visible to the requester and recorded in the timeline.</p>
        <Textarea id="progress" value={progress} onChange={(event) => setProgress(event.target.value)} maxLength={1500} rows={4} placeholder="What changed, and what happens next?" className="mt-3 min-h-28 rounded-xl" />
        <Button
          variant="secondary"
          className="mt-3 h-10 w-full rounded-xl"
          disabled={Boolean(busy) || progress.trim().length < 2}
          onClick={() => run("progress", () => addProgressAction({ ticketId, content: progress, expectedVersion: localVersion }), () => setProgress(""))}
        >
          {busy === "progress" ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}
          {busy === "progress" ? "Posting…" : "Post update"}
        </Button>
      </div>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" className="h-11 w-full rounded-xl border-success/35 text-success hover:bg-success/10 hover:text-success" disabled={Boolean(busy)}>
            <CheckCircle2 className="size-4" />Resolve ticket
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Resolve this ticket?</AlertDialogTitle>
            <AlertDialogDescription>This marks the work complete and makes the ticket read-only. Add a short closing note if it helps the requester.</AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea value={resolutionNote} onChange={(event) => setResolutionNote(event.target.value)} maxLength={1500} rows={4} placeholder="Optional resolution note" className="rounded-xl" />
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Keep open</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-success text-white hover:bg-success/90"
              onClick={(event) => {
                event.preventDefault();
                void run("resolve", () => resolveTicketAction({ ticketId, note: resolutionNote, expectedVersion: localVersion }), () => setLocalStatus("RESOLVED"));
              }}
            >
              {busy === "resolve" ? <LoaderCircle className="size-4 animate-spin" /> : null}Resolve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {error ? <p role="alert" className="rounded-xl border border-destructive/25 bg-destructive/8 p-3 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
