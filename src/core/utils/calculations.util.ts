/**
 * Shared Calculation Utilities
 */

/**
 * Calculates ICUMSA Color
 * Formula: (Absorbance * 1000) / (CellLength * (Brix * Density / 100))
 * For simplicity in this demo, we use a simplified version.
 */
export const calculateICUMSA = (absorbance: number, brix: number, cellLength: number): number => {
  if (!cellLength || !brix) return 0;
  // Simplified ICUMSA formula for demo purposes
  // Real formula involves density correction
  const concentration = (brix * 1.2) / 100; // 1.2 is a rough density factor for sugar solutions
  return (absorbance * 1000) / (cellLength * concentration);
};
