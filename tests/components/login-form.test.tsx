import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "@/components/auth/login-form";

const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
}));

describe("LoginForm", () => {
  beforeEach(() => {
    push.mockReset();
    refresh.mockReset();
  });

  it("keeps the form visible in the server HTML before hydration", () => {
    const html = renderToString(<LoginForm showDemo={false} />);

    expect(html).toContain("Work email");
    expect(html).toContain("Password");
    expect(html).not.toContain("opacity:0");
  });

  it("fills a selected development account without submitting", async () => {
    const user = userEvent.setup();
    render(<LoginForm showDemo />);

    await user.click(screen.getByRole("button", { name: "Support" }));

    expect(screen.getByLabelText("Work email")).toHaveValue("support@helpdesklite.local");
    expect(screen.getByLabelText("Password")).toHaveValue("HelpDesk123!");
    expect(push).not.toHaveBeenCalled();
  });

  it("toggles password visibility with an accessible control", async () => {
    const user = userEvent.setup();
    render(<LoginForm showDemo={false} />);
    const password = screen.getByLabelText("Password");

    expect(password).toHaveAttribute("type", "password");
    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(password).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Hide password" })).toBeVisible();
  });
});
