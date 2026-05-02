import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { Ticker, type TickerEntry } from "@/components/ticker/Ticker";

const entries: TickerEntry[] = [
  { time: "09:42", user: "maya", text: "shipping auth flow", kind: "voice" },
  { time: "09:55", user: "san", text: "staging build failing", kind: "blocker" },
];

describe("Ticker", () => {
  it("renders entries with kind badges", () => {
    render(<Ticker entries={entries} />);
    expect(screen.getByText("@maya")).toBeInTheDocument();
    expect(screen.getByText("@san")).toBeInTheDocument();
    expect(screen.getAllByText(/voice|blocker/i).length).toBeGreaterThan(0);
  });

  it("uses log role with polite live region", () => {
    render(<Ticker entries={entries} />);
    const log = screen.getByRole("log");
    expect(log).toHaveAttribute("aria-live", "polite");
  });

  it("has no axe violations", async () => {
    const { container } = render(<Ticker entries={entries} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
