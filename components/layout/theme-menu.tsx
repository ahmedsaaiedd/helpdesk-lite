"use client";

import { Check, Laptop, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ThemePreference } from "@/components/providers/theme-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppTheme } from "@/components/providers/theme-provider";

const themes = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Laptop },
] satisfies readonly { value: ThemePreference; label: string; icon: typeof Sun }[];

export function ThemeMenu() {
  const { theme, setTheme } = useAppTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-10 rounded-xl" aria-label="Choose appearance">
          {theme === "dark" ? <Moon className="size-[18px]" /> : theme === "system" ? <Laptop className="size-[18px]" /> : <Sun className="size-[18px]" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 rounded-xl p-1.5">
        {themes.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem key={value} onSelect={() => setTheme(value)} className="rounded-lg py-2">
            <Icon className="size-4" aria-hidden="true" />
            {label}
            {theme === value ? <Check className="ml-auto size-4 text-primary" aria-hidden="true" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
