import { z } from "zod";

export const SAMPLE_TYPES = {
  SWEET_WATER: "Sweet water",
  VO6_12: "12VO6",
  POLISH_LIQUOR: "Polish liquor",
  FINE_LIQUOR: "Fine liquor",
  EVAPORATOR_LIQUOR: "Evaporator liquor",

  SAT_A: "SAT A",
  SAT_B: "SAT B",
  SAT_C: "SAT C",
  SAT_OUT: "SAT Out",

  UTILITY: "Utility samples",
  EFFLUENT: "Effluent samples",
  CLEAN_CONDENSATE: "Clean condensate",
  SCREEN_MELT: "Screen melt",

  WHITE_SUGAR: "White sugar",
  BROWN_SUGAR: "Brown sugar",
  RAW_SUGAR: "Raw sugar",

  MILK_LIME: "Milk lime",
  WASH_WATER: "Wash water",
  FILTER_SUPPLY: "Filter supply",

  ICING_SUGAR: "Icing sugar",
  FINE_SUGAR: "Fine sugar",
  EXTRA_FINE_SUGAR: "Extra fine sugar",
  COURSE_SUGAR: "Course sugar",
  SUPER_FINE_SUGAR: "Super fine sugar",

  MUD: "Mud",
} as const;

export const SugarTypesSchema = z.enum(SAMPLE_TYPES);
export type SugarType = z.infer<typeof SugarTypesSchema>;

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
