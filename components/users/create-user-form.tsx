"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Role } from "@prisma/client";
import { Eye, EyeOff, LoaderCircle, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { createUserAction } from "@/app/actions/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ROLE_LABELS } from "@/lib/domain";
import { createUserSchema, type CreateUserInput } from "@/lib/validation";

const roleHelp: Record<Role, string> = {
  EMPLOYEE: "Can submit and follow their own requests.",
  SUPPORT: "Can own and work on support tickets.",
  MANAGER: "Can view operations, edit tickets, and manage users.",
};

const defaults: CreateUserInput = {
  name: "",
  email: "",
  role: Role.EMPLOYEE,
  password: "",
  confirmPassword: "",
};

export function CreateUserForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: defaults,
  });
  const selectedRole = useWatch({ control, name: "role" });

  async function onSubmit(values: CreateUserInput) {
    setServerError("");
    const result = await createUserAction(values);
    if (!result.ok) {
      if (result.fieldErrors) {
        for (const [field, messages] of Object.entries(result.fieldErrors)) {
          setError(field as keyof CreateUserInput, { message: messages[0] });
        }
      }
      setServerError(result.message);
      return;
    }

    toast.success("Account created", { description: result.message });
    reset(defaults);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="surface-panel form-surface p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <UserPlus className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-semibold">Create an account</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">Add a verified internal user. There is no public sign-up.</p>
        </div>
      </div>

      <div className="mt-6 space-y-5">
        <div className="space-y-2">
          <label htmlFor="user-name" className="text-sm font-semibold">Full name</label>
          <Input id="user-name" autoComplete="name" maxLength={80} placeholder="e.g. Ahmed Saaied" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "user-name-error" : undefined} className="h-11 rounded-xl text-base md:text-sm" {...register("name")} />
          {errors.name ? <p id="user-name-error" className="text-sm text-destructive">{errors.name.message}</p> : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="user-email" className="text-sm font-semibold">Work email</label>
          <Input id="user-email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} placeholder="name@company.com" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "user-email-error" : undefined} className="h-11 rounded-xl text-base md:text-sm" {...register("email")} />
          {errors.email ? <p id="user-email-error" className="text-sm text-destructive">{errors.email.message}</p> : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold">Role</label>
          <Controller name="role" control={control} render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger aria-label="Role" aria-invalid={Boolean(errors.role)} className="h-11 w-full rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-xl">
                {Object.entries(ROLE_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
              </SelectContent>
            </Select>
          )} />
          <p className="text-xs leading-5 text-muted-foreground">{roleHelp[selectedRole]}</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="user-password" className="text-sm font-semibold">Initial password</label>
          <div className="relative">
            <Input id="user-password" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Create a strong password" aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? "user-password-error" : "user-password-help"} className="h-11 rounded-xl pr-11 text-base md:text-sm" {...register("password")} />
            <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label={showPassword ? "Hide passwords" : "Show passwords"}>
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {errors.password ? <p id="user-password-error" className="text-sm text-destructive">{errors.password.message}</p> : <p id="user-password-help" className="text-xs leading-5 text-muted-foreground">10+ characters with upper, lower, number, and symbol.</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="user-confirm-password" className="text-sm font-semibold">Confirm password</label>
          <Input id="user-confirm-password" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Repeat the password" aria-invalid={Boolean(errors.confirmPassword)} aria-describedby={errors.confirmPassword ? "user-confirm-password-error" : undefined} className="h-11 rounded-xl text-base md:text-sm" {...register("confirmPassword")} />
          {errors.confirmPassword ? <p id="user-confirm-password-error" className="text-sm text-destructive">{errors.confirmPassword.message}</p> : null}
        </div>
      </div>

      {serverError ? <div role="alert" aria-live="polite" className="mt-5 rounded-xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive">{serverError}</div> : null}

      <Button type="submit" disabled={isSubmitting} className="mt-6 h-11 w-full rounded-xl">
        {isSubmitting ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <UserPlus className="size-4" aria-hidden="true" />}
        {isSubmitting ? "Creating account…" : "Create user"}
      </Button>
    </form>
  );
}
