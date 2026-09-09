import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CreateUserForm } from "@/components/users/create-user-form";

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  createUser: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));

vi.mock("@/app/actions/users", () => ({
  createUserAction: mocks.createUser,
}));

describe("CreateUserForm", () => {
  beforeEach(() => {
    mocks.refresh.mockReset();
    mocks.createUser.mockReset();
  });

  it("creates a validated employee account and refreshes the list", async () => {
    mocks.createUser.mockResolvedValue({ ok: true, data: { id: "user-1", name: "Nour Ali" }, message: "Nour Ali can now sign in." });
    const user = userEvent.setup();
    render(<CreateUserForm />);

    await user.type(screen.getByLabelText("Full name"), "Nour Ali");
    await user.type(screen.getByLabelText("Work email"), "NOUR@COMPANY.COM");
    await user.type(screen.getByLabelText("Initial password"), "StrongPass1!");
    await user.type(screen.getByLabelText("Confirm password"), "StrongPass1!");
    await user.click(screen.getByRole("button", { name: "Create user" }));

    await waitFor(() => expect(mocks.createUser).toHaveBeenCalledWith({
      name: "Nour Ali",
      email: "nour@company.com",
      role: "EMPLOYEE",
      password: "StrongPass1!",
      confirmPassword: "StrongPass1!",
    }));
    expect(mocks.refresh).toHaveBeenCalled();
  });
});
