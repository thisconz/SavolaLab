import { z } from "zod";

export const QualityDataSchema = z.object({
  overallQuality: z.number(),
  trend: z.array(z.any()),
});

export const VolumeDataSchema = z.object({
  totalVolume: z.number(),
  trend: z.array(z.any()),
});

export const CapabilityDataSchema = z.object({
  cpk: z.number(),
  ppk: z.number(),
});

export const GetQualityResponseSchema = z.object({
  success: z.boolean(),
  data: QualityDataSchema,
});

export const GetVolumeResponseSchema = z.object({
  success: z.boolean(),
  data: VolumeDataSchema,
});

export const GetCapabilityResponseSchema = z.object({
  success: z.boolean(),
  data: CapabilityDataSchema,
});
