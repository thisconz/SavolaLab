import { z } from "zod";

export const PreferenceSchema = z.object({
  key: z.string(),
  value: z.string(),
});

export const GetPreferencesResponseSchema = z.object({
  success: z.boolean(),
  data: z.record(z.string(), z.string()),
});

export const TableRecordSchema = z.object({
  id: z.number().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
}).catchall(z.any());

export const GetTableResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(TableRecordSchema),
});

export const CreateRecordRequestSchema = z.record(z.string(), z.any());
export const UpdateRecordRequestSchema = z.record(z.string(), z.any());
