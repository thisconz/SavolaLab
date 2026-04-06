import { z } from "zod";
import { 
  ProductionLineSchema, 
  EquipmentSchema, 
  InstrumentSchema, 
  InventoryItemSchema, 
  CertificateSchema 
} from "../../shared/schemas/operational.schema";

export type ProductionLine = z.infer<typeof ProductionLineSchema>;
export type Equipment = z.infer<typeof EquipmentSchema>;
export type Instrument = z.infer<typeof InstrumentSchema>;
export type InventoryItem = z.infer<typeof InventoryItemSchema>;
export type Certificate = z.infer<typeof CertificateSchema>;
