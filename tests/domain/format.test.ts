import { describe, expect, it } from "vitest";
import { initials } from "@/lib/format";

describe("initials", () => {
  it("handles long and extra-spaced names", () => {
    expect(initials("  Maya   Hassan El-Sayed ")).toBe("MH");
  });

  it("handles a single name", () => {
    expect(initials("Maya")).toBe("M");
  });
});
