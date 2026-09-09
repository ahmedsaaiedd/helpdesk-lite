"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginSchema } from "@/lib/validation";

type LoginValues = z.infer<typeof loginSchema>;

const demos = [
  ["Employee", "employee@helpdesklite.local"],
  ["Support", "support@helpdesklite.local"],
  ["Manager", "manager@helpdesklite.local"],
] as const;

export function LoginForm({ showDemo }: { showDemo: boolean }) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginValues) {
    setServerError("");
    try {
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });
      if (result?.error) {
        setServerError("The email or password is incorrect, or this account is unavailable.");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setServerError("We could not reach the service. Check your connection and try again.");
    }
  }

  function applyDemo(email: string) {
    setValue("email", email, { shouldValidate: true });
    setValue("password", "HelpDesk123!", { shouldValidate: true });
    setServerError("");
  }

  return (
    <div className="soft-enter w-full">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-semibold">Work email</label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
              placeholder="name@company.com"
              className="h-12 rounded-xl bg-background pl-10 text-base md:text-base"
              {...register("email")}
            />
          </div>
          {errors.email && <p id="email-error" className="text-sm text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-semibold">Password</label>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "password-error" : undefined}
              placeholder="Enter your password"
              className="h-12 rounded-xl bg-background px-10 text-base md:text-base"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {errors.password && <p id="password-error" className="text-sm text-destructive">{errors.password.message}</p>}
        </div>

        {serverError && (
          <div role="alert" aria-live="polite" className="rounded-xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive">
            {serverError}
          </div>
        )}

        <Button type="submit" disabled={isSubmitting} className="h-12 w-full rounded-xl text-base font-semibold shadow-[0_8px_24px_rgb(15_118_110_/_0.22)]">
          {isSubmitting ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      {showDemo && (
        <div className="mt-7 border-t pt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Development accounts</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {demos.map(([label, email]) => (
              <button
                key={email}
                type="button"
                onClick={() => applyDemo(email)}
                className="min-h-10 rounded-lg border bg-background px-2 text-sm font-medium transition-[background,transform] hover:bg-accent active:scale-[0.98]"
              >
                {label}
              </button>
            ))}
          </div>
          <p className="mt-2.5 text-xs text-muted-foreground">Choose a role, then press Sign in.</p>
        </div>
      )}
    </div>
  );
}
