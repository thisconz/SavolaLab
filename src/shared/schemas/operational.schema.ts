import { z } from "zod";

export const ProductionLineStatusSchema = z.enum([
  "ACTIVE",
  "INACTIVE",
  "MAINTENANCE",
]);
export type ProductionLineStatus = z.infer<typeof ProductionLineStatusSchema>;

export const ProductionLineSchema = z.object({
  id: z.number(),
  name: z.string(),
  plant_id: z.string().optional(),
  description: z.string().optional().nullable(),
  status: ProductionLineStatusSchema,
});

export const EquipmentStatusSchema = z.enum([
  "OPERATIONAL",
  "MAINTENANCE",
  "DOWNTIME",
]);
export type EquipmentStatus = z.infer<typeof EquipmentStatusSchema>;

export const EquipmentSchema = z.object({
  id: z.number(),
  production_line_id: z.number(),
  name: z.string(),
  type: z.string(),
  status: EquipmentStatusSchema,
});

export const InstrumentStatusSchema = z.enum([
  "ACTIVE",
  "CALIBRATION_DUE",
  "INACTIVE",
]);
export type InstrumentStatus = z.infer<typeof InstrumentStatusSchema>;

export const InstrumentSchema = z.object({
  id: z.number(),
  name: z.string(),
  model: z.string(),
  serial_number: z.string(),
  status: InstrumentStatusSchema,
  last_calibrated: z.string().optional().nullable(),
  next_calibration: z.string().optional().nullable(),
});

export const InventoryItemSchema = z.object({
  id: z.number(),
  item_name: z.string(),
  type: z.string().optional(),
  quantity: z.number(),
  unit: z.string(),
  reorder_level: z.number(),
  expiry_date: z.string().optional(),
  location: z.string().optional().nullable(),
});

export const CertificateStatusSchema = z.enum([
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "RELEASED",
]);
export type CertificateStatus = z.infer<typeof CertificateStatusSchema>;

export const CertificateSchema = z.object({
  id: z.number(),
  batch_id: z.string(),
  product_name: z.string(),
  status: CertificateStatusSchema,
  version: z.number().optional(),
  created_at: z.string(),
  approved_by: z.string().optional().nullable(),
});

export const PlantIntelSchema = z.object({
  overall_efficiency: z.number(),
  active_alerts: z.number(),
  recent_events: z.array(z.any()),
});
