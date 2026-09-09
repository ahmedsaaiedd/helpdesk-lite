import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider, THEME_STORAGE_KEY, useAppTheme } from "@/components/providers/theme-provider";

function ThemeProbe() {
  const { theme, setTheme } = useAppTheme();
  return <button onClick={() => setTheme("light")}>{theme}</button>;
}

describe("ThemeProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove("dark", "theme-changing");
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
    Object.defineProperty(window, "requestAnimationFrame", {
      configurable: true,
      value: (callback: FrameRequestCallback) => window.setTimeout(callback, 0),
    });
  });

  it("hydrates from the stored preference and applies it to the document", async () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
    render(<ThemeProvider><ThemeProbe /></ThemeProvider>);

    await waitFor(() => expect(screen.getByRole("button")).toHaveTextContent("dark"));
    expect(document.documentElement).toHaveClass("dark");
  });

  it("persists a new preference and updates the document", async () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
    render(<ThemeProvider><ThemeProbe /></ThemeProvider>);
    await waitFor(() => expect(screen.getByRole("button")).toHaveTextContent("dark"));

    fireEvent.click(screen.getByRole("button"));

    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    expect(document.documentElement).not.toHaveClass("dark");
  });

  it("keeps the server and first client render hydration-safe", async () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
    const view = <ThemeProvider><ThemeProbe /></ThemeProvider>;
    const container = document.createElement("div");
    container.innerHTML = renderToString(view);
    document.body.appendChild(container);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    render(view, { container, hydrate: true });

    await waitFor(() => expect(screen.getByRole("button")).toHaveTextContent("dark"));
    expect(consoleError.mock.calls.flat().join(" ")).not.toMatch(/hydration|didn't match/i);
    consoleError.mockRestore();
  });
});
