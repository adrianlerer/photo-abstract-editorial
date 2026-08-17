import { describe, expect, it } from "vitest";
import { compositionSchema, isFormat } from "./composition";

const valid = {
  title: "Measured Light",
  palette: ["#24313A", "#C78D53", "#6A7169"],
  marks: Array.from({ length: 5 }, (_, index) => ({
    type: "bar" as const,
    x: 0.1 + index * 0.1,
    y: 0.2,
    width: 0.04,
    height: 0.2,
    rotation: 0,
    colorIndex: index % 3,
    opacity: 0.9,
    strokeWidth: 0.01,
  })),
};

describe("composition schema", () => {
  it("accepts a bounded composition", () => {
    expect(compositionSchema.parse(valid).title).toBe("Measured Light");
  });

  it("rejects marks in the reserved title area", () => {
    const invalid = structuredClone(valid);
    invalid.marks[0].y = 0.9;
    expect(() => compositionSchema.parse(invalid)).toThrow();
  });
});

describe("format validation", () => {
  it("only accepts the supported formats", () => {
    expect(isFormat("editorial")).toBe(true);
    expect(isFormat("poster")).toBe(false);
  });
});
