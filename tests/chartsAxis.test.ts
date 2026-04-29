import { describe, expect, it } from "vitest";
import {
  axisLabelPressure,
  categoryXAxisFit,
  categoryYAxisFit,
  numericAxisFit,
  truncateAxisLabel,
} from "@/lib/charts/axis";
import { formatValue } from "@/lib/charts/format";

describe("chart axis fitting", () => {
  it("detects category axes with enough label pressure to overflow", () => {
    const rows = [
      { category: "Extremely long category label", value: 10 },
      { category: "Short", value: 12 },
    ];

    expect(axisLabelPressure(rows, "category")).toEqual({
      count: 2,
      longestLabel: 29,
      risksOverflow: true,
    });
  });

  it("truncates long labels without changing short labels", () => {
    expect(truncateAxisLabel("short", 12)).toBe("short");
    expect(truncateAxisLabel("very long category name", 12)).toBe(
      "very long...",
    );
  });

  it("reduces visible x-axis ticks when category labels are dense", () => {
    const rows = Array.from({ length: 24 }, (_, index) => ({
      category: `Very long category label ${index + 1}`,
      value: index,
    }));

    const fit = categoryXAxisFit(rows, "category");

    expect(fit.interval).toBe(2);
    expect(fit.angle).toBe(-38);
    expect(fit.height).toBe(96);
    expect(fit.tickFormatter(rows[0].category).length).toBeLessThan(
      rows[0].category.length,
    );
  });

  it("keeps sparse short x-axis labels fully visible", () => {
    const rows = [
      { category: "North", value: 10 },
      { category: "South", value: 12 },
    ];

    const fit = categoryXAxisFit(rows, "category");

    expect(fit.interval).toBe(0);
    expect(fit.angle).toBe(0);
    expect(fit.tickFormatter("North")).toBe("North");
  });

  it("caps horizontal y-axis label width and truncates category labels", () => {
    const rows = [
      {
        category: "Extremely long product category that would crowd the plot",
        value: 10,
      },
    ];

    const fit = categoryYAxisFit(rows, "category");

    expect(fit.width).toBeGreaterThanOrEqual(96);
    expect(fit.width).toBeLessThanOrEqual(180);
    expect(fit.tickFormatter(rows[0].category).length).toBeLessThan(
      rows[0].category.length,
    );
  });

  it("expands numeric y-axis width for formatted monetary values", () => {
    const rows = [{ revenue: 123456789.12 }];

    const fit = numericAxisFit(rows, ["revenue"], formatValue);

    expect(fit.width).toBeGreaterThan(64);
    expect(fit.width).toBeLessThanOrEqual(96);
  });
});
