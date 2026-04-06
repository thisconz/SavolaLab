import { z } from "zod";

export const SUGAR_STAGES = [
  "Raw Handling",
  "Refining",
  "Carbonation",
  "Filtration",
  "Evaporation",
  "Crystallization",
  "Centrifuge",
  "Drying",
  "Packaging",
  "Sweet water",
  "12VO6",
  "Polish liquor",
  "Fine liquor",
  "Evaporator liquor",
  "SAT A",
  "SAT B",
  "SAT C",
  "SAT Out",
  "Utility samples",
  "Effluent samples",
  "Clean condensate",
  "Screen melt",
  "White sugar",
  "Brown sugar",
  "Raw sugar",
  "Milk lime",
  "Wash water",
  "Filter supply",
  "Icing sugar",
  "Fine sugar",
  "Extra fine sugar",
  "Course sugar",
  "Super fine sugar",
  "Mud",
] as const;

export const SugarStageSchema = z.enum(SUGAR_STAGES);
export type SugarStage = z.infer<typeof SugarStageSchema>;

export const TEST_TYPES = [
  "pH",
  "TDS",
  "Colour",
  "Density",
  "Turbidity",
  "TSS",
  "Minute sugar",
  "Ash",
  "Sediment",
  "Starch",
  "Particles size",
  "CaO",
  "Purity",
  "Moisture (LOD)",
  "Sucrose test",
  "Brix",
  "Pol",
  "Moisture",
  "Invert",
] as const;

export const TestTypeSchema = z.enum(TEST_TYPES);
export type TestType = z.infer<typeof TestTypeSchema>;
