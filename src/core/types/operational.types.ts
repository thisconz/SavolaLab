export interface ProductionLine {
  id: number;
  name: string;
  plant_id: string;
}

export interface Equipment {
  id: number;
  name: string;
  line_id: number;
  type: string;
  status: "OPERATIONAL" | "MAINTENANCE" | "DOWNTIME";
}

export interface Instrument {
  id: number;
  name: string;
  model: string;
  serial_number: string;
  status: "ACTIVE" | "CALIBRATION_DUE" | "INACTIVE";
  last_calibration: string;
  next_calibration: string;
}

export interface InventoryItem {
  id: number;
  name: string;
  type: string;
  quantity: number;
  unit: string;
  expiry_date: string;
  min_stock: number;
}

export interface Certificate {
  id: number;
  batch_id: string;
  status: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "RELEASED";
  version: number;
  created_at: string;
  approved_by?: string;
}
