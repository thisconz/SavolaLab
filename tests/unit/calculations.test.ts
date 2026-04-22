import { describe as d4, it as it4, expect as e4 } from "vitest";
import { calculateICUMSA } from "../../src/core/utils/calculations.util";

d4("calculateICUMSA", () => {
  it4("returns 0 when cellLength is 0 (division by zero guard)", () => {
    e4(calculateICUMSA(0.5, 60, 0)).toBe(0);
  });

  it4("returns 0 when brix is 0", () => {
    e4(calculateICUMSA(0.5, 0, 1)).toBe(0);
  });

  it4("produces a finite positive number for valid inputs", () => {
    const result = calculateICUMSA(0.3, 65, 1);
    e4(result).toBeGreaterThan(0);
    e4(Number.isFinite(result)).toBe(true);
  });

  it4("higher absorbance produces higher ICUMSA value", () => {
    const low = calculateICUMSA(0.1, 65, 1);
    const high = calculateICUMSA(0.5, 65, 1);
    e4(high).toBeGreaterThan(low);
  });

  it4("longer cell length produces lower ICUMSA (Beer-Lambert)", () => {
    const short = calculateICUMSA(0.3, 65, 0.5);
    const long = calculateICUMSA(0.3, 65, 2.0);
    e4(short).toBeGreaterThan(long);
  });
});
