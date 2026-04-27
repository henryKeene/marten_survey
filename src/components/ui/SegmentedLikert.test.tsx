import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SegmentedLikert } from "./SegmentedLikert";

describe("SegmentedLikert", () => {
  const fiveAnchors = ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"];

  it("renders one radio per anchor", () => {
    render(
      <SegmentedLikert
        value={null}
        onChange={() => {}}
        leftLabel="Disagree"
        rightLabel="Agree"
        anchors={fiveAnchors}
      />,
    );
    expect(screen.getAllByRole("radio")).toHaveLength(5);
  });

  it("shows 'Tap an option.' when value is null", () => {
    render(
      <SegmentedLikert
        value={null}
        onChange={() => {}}
        leftLabel="Disagree"
        rightLabel="Agree"
        anchors={fiveAnchors}
      />,
    );
    expect(screen.getByText(/Tap an option/)).toBeTruthy();
  });

  it("maps a tap to the evenly spaced anchor value", () => {
    const onChange = vi.fn();
    render(
      <SegmentedLikert
        value={null}
        onChange={onChange}
        leftLabel="Disagree"
        rightLabel="Agree"
        anchors={fiveAnchors}
      />,
    );
    const radios = screen.getAllByRole("radio");
    fireEvent.click(radios[2]); // middle = 50
    expect(onChange).toHaveBeenCalledWith(50);
    fireEvent.click(radios[4]); // last = 100
    expect(onChange).toHaveBeenCalledWith(100);
    fireEvent.click(radios[0]); // first = 0
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it("marks the nearest anchor checked for an arbitrary numeric value", () => {
    render(
      <SegmentedLikert
        value={75}
        onChange={() => {}}
        leftLabel="Disagree"
        rightLabel="Agree"
        anchors={fiveAnchors}
      />,
    );
    const radios = screen.getAllByRole("radio");
    expect(radios[3].getAttribute("aria-checked")).toBe("true");
    expect(radios[3].getAttribute("aria-label")).toMatch(/Agree/);
  });

  it("supports asymmetric 7-anchor scales", () => {
    const sevenAnchors = ["A", "B", "C", "D", "E", "F", "G"];
    const onChange = vi.fn();
    render(
      <SegmentedLikert
        value={null}
        onChange={onChange}
        leftLabel="A"
        rightLabel="G"
        anchors={sevenAnchors}
      />,
    );
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(7);
    fireEvent.click(radios[3]); // middle of 7 = 50
    expect(onChange).toHaveBeenCalledWith(50);
  });
});
