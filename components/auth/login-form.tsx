"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Headphones, LoaderCircle, LockKeyhole, Mail, Play, ShieldCheck, UserRound } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginSchema } from "@/lib/validation";

type LoginValues = z.infer<typeof loginSchema>;
type DemoRole = "EMPLOYEE" | "SUPPORT" | "MANAGER";

const demoRoles = [
  { role: "EMPLOYEE", label: "Employee", icon: UserRound },
  { role: "SUPPORT", label: "Support", icon: Headphones },
  { role: "MANAGER", label: "Manager", icon: ShieldCheck },
] as const;

export function LoginForm({ demoEnabled = false }: { demoEnabled?: boolean }) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showDemoRoles, setShowDemoRoles] = useState(false);
  const [demoLoading, setDemoLoading] = useState<DemoRole | null>(null);
  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
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

  async function enterDemo(role: DemoRole) {
    setServerError("");
    setDemoLoading(role);
    try {
      const result = await signIn("demo", { role, redirect: false });
      if (result?.error) {
        setServerError("The live demo is temporarily unavailable. Please try again.");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setServerError("We could not open the live demo. Check your connection and try again.");
    } finally {
      setDemoLoading(null);
    }
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

        <Button type="submit" disabled={isSubmitting || demoLoading !== null} className="h-12 w-full rounded-xl text-base font-semibold shadow-[0_8px_24px_rgb(15_118_110_/_0.22)]">
          {isSubmitting ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      {demoEnabled ? (
        <div className="mt-7">
          <div className="flex items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">or</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          {!showDemoRoles ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDemoRoles(true)}
              className="mt-5 h-12 w-full rounded-xl text-base font-semibold"
            >
              <Play className="size-4" aria-hidden="true" />
              Explore live demo
            </Button>
          ) : (
            <div className="mt-5 rounded-2xl border bg-muted/30 p-3.5">
              <div className="mb-3 px-1">
                <p className="text-sm font-semibold">Choose a workspace</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">Explore sample data without entering a password.</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {demoRoles.map(({ role, label, icon: Icon }) => {
                  const loading = demoLoading === role;
                  return (
                    <button
                      key={role}
                      type="button"
                      disabled={demoLoading !== null}
                      onClick={() => enterDemo(role)}
                      className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border bg-background px-2 text-sm font-semibold transition-[border-color,background,transform] hover:border-primary/35 hover:bg-accent active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
                    >
                      {loading ? <LoaderCircle className="size-4 animate-spin text-primary" aria-hidden="true" /> : <Icon className="size-4 text-primary" aria-hidden="true" />}
                      <span>{loading ? "Opening…" : label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : null}

    </div>
  );
}
