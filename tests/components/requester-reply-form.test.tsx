import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RequesterReplyForm } from "@/components/tickets/requester-reply-form";

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  reply: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));

vi.mock("@/app/actions/tickets", () => ({
  addRequesterReplyAction: mocks.reply,
}));

describe("RequesterReplyForm", () => {
  beforeEach(() => {
    mocks.refresh.mockReset();
    mocks.reply.mockReset();
  });

  it("sends the employee reply with the current ticket version", async () => {
    mocks.reply.mockResolvedValue({ ok: true, data: undefined, message: "Reply sent." });
    const user = userEvent.setup();
    render(<RequesterReplyForm ticketId="clz1234567890abcdefghijk" version={4} />);

    const submit = screen.getByRole("button", { name: "Send reply" });
    expect(submit).toBeDisabled();
    await user.type(screen.getByLabelText("Your reply"), "The error code is VPN-401.");
    await user.click(submit);

    await waitFor(() => expect(mocks.reply).toHaveBeenCalledWith({
      ticketId: "clz1234567890abcdefghijk",
      content: "The error code is VPN-401.",
      expectedVersion: 4,
    }));
    expect(mocks.refresh).toHaveBeenCalled();
  });
});
