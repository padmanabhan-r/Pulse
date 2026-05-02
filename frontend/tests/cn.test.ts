import { describe, expect, it } from "vitest";
import { cn } from "@/lib/cn";

describe("cn", () => {
  it("merges tailwind utility classes", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
  it("handles falsy values", () => {
    expect(cn("a", false && "b", null, undefined, "c")).toBe("a c");
  });
});
