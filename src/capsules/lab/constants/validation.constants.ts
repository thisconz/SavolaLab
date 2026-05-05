import { type TestType } from "../../../core/types";

export interface ValidationRule {
  min: number;
  max: number;
  unit: string;
  description: string;
  step?: string;
  suggestion?: string;
}

export const TEST_VALIDATION_RULES: Partial<Record<TestType, ValidationRule>> = {
  Colour: {
    min: 0,
    max: 10000,
    unit: "IU",
    description: "ICUMSA Colour index",
    step: "1",
  },
  Brix: {
    min: 0,
    max: 100,
    unit: "%",
    description: "Soluble solids content",
    step: "0.1",
  },
  Pol: {
    min: 0,
    max: 100,
    unit: "%",
    description: "Polarization (sucrose content)",
    step: "0.01",
  },
  Purity: {
    min: 0,
    max: 100,
    unit: "%",
    description: "Ratio of Pol to Brix",
    step: "0.01",
    suggestion: "Purity = (Pol / Brix) * 100",
  },
  Ash: {
    min: 0,
    max: 5,
    unit: "%",
    description: "Conductivity ash content",
    step: "0.001",
  },
  Moisture: {
    min: 0,
    max: 10,
    unit: "%",
    description: "Water content",
    step: "0.0001",
  },
  pH: {
    min: 0,
    max: 14,
    unit: "pH",
    description: "Acidity or alkalinity",
    step: "0.01",
  },
  Invert: {
    min: 0,
    max: 5,
    unit: "%",
    description: "Invert sugar content",
    step: "0.01",
  },
  Turbidity: {
    min: 0,
    max: 1000,
    unit: "NTU",
    description: "Clarity of the solution",
    step: "1",
  },
  TSS: {
    min: 0,
    max: 10000,
    unit: "mg/L",
    description: "Total Suspended Solids",
    step: "1",
  },
  Density: {
    min: 0.5,
    max: 2.0,
    unit: "g/cm³",
    description: "Specific gravity / density",
    step: "0.001",
  },
};
