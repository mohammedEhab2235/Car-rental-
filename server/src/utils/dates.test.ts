import { describe, expect, it } from "vitest";
import { diffDaysInclusive, isOverlapping, isRangeValid } from "./dates.js";

describe("dates", () => {
  it("diffDaysInclusive يحسب الأيام بشكل شامل", () => {
    expect(diffDaysInclusive("2026-01-01", "2026-01-01")).toBe(1);
    expect(diffDaysInclusive("2026-01-01", "2026-01-02")).toBe(2);
  });

  it("isRangeValid يتحقق من ترتيب التاريخ", () => {
    expect(isRangeValid("2026-01-01", "2026-01-02")).toBe(true);
    expect(isRangeValid("2026-01-02", "2026-01-01")).toBe(false);
  });

  it("isOverlapping يكتشف التداخل", () => {
    expect(isOverlapping("2026-01-01", "2026-01-05", "2026-01-03", "2026-01-04")).toBe(true);
    expect(isOverlapping("2026-01-01", "2026-01-05", "2026-01-06", "2026-01-08")).toBe(false);
  });
});
