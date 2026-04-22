import { z } from "zod";

export const PreferenceSchema = z.object({
  key: z.string(),
  value: z.string(),
});

export const GetPreferencesResponseSchema = z.object({
  success: z.boolean(),
  data: z.record(z.string(), z.string()),
});

export const TableRecordSchema = z
  .object({
    id: z.number().nullish(),
    name: z.string().nullish(),
    description: z.string().nullish(),
    is_active: z.boolean().nullish(),
    created_at: z
      .union([z.string(), z.date()])
      .nullish()
      .transform((d) =>
        d ? (typeof d === "string" ? d : d.toISOString()) : null,
      ),
    updated_at: z
      .union([z.string(), z.date()])
      .nullish()
      .transform((d) =>
        d ? (typeof d === "string" ? d : d.toISOString()) : null,
      ),
  })
  .catchall(z.any());

export const GetTableResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(TableRecordSchema),
});

export const CreateRecordRequestSchema = z.record(z.string(), z.any());
export const UpdateRecordRequestSchema = z.record(z.string(), z.any());
