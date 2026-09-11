import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "@/components/auth/login-form";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  signIn: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));

vi.mock("next-auth/react", () => ({
  signIn: mocks.signIn,
}));

describe("LoginForm", () => {
  beforeEach(() => {
    mocks.push.mockReset();
    mocks.refresh.mockReset();
    mocks.signIn.mockReset();
  });

  it("keeps the form visible in the server HTML before hydration", () => {
    const html = renderToString(<LoginForm />);

    expect(html).toContain("Work email");
    expect(html).toContain("Password");
    expect(html).not.toContain("opacity:0");
    expect(html).not.toContain("Development accounts");
    expect(html).not.toContain("Explore live demo");
  });

  it("opens a server-backed demo workspace without exposing credentials", async () => {
    mocks.signIn.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<LoginForm demoEnabled />);

    await user.click(screen.getByRole("button", { name: "Explore live demo" }));
    await user.click(screen.getByRole("button", { name: "Support" }));

    expect(mocks.signIn).toHaveBeenCalledWith("demo", { role: "SUPPORT", redirect: false });
    expect(mocks.push).toHaveBeenCalledWith("/");
    expect(screen.queryByText("support@helpdesklite.local")).not.toBeInTheDocument();
    expect(screen.queryByText("HelpDesk123!")).not.toBeInTheDocument();
  });

  it("toggles password visibility with an accessible control", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    const password = screen.getByLabelText("Password");

    expect(password).toHaveAttribute("type", "password");
    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(password).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Hide password" })).toBeVisible();
  });
});
