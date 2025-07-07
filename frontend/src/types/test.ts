export interface Test {
  id: string;
  sample_batch_number: string;
  parameter: string;      // e.g. "colour"
  value: number;          // e.g. 36
  unit: string;           // e.g. "IU"
  status: string;         // e.g. "completed"
  entered_by: string;     // e.g. "QAZ001"
  entered_at: string;     // ISO date string
  notes?: string;
}

export interface TestCreate {
  sample_batch_number: string;
  parameter: string;      // e.g. "colour"
  value: number;          // e.g. 36
  unit: string;           // e.g. "IU"
  status: string;         // e.g. "completed"
  entered_by: string;     // e.g. "QAZ001"
  entered_at: string;     // ISO date string
  notes?: string;
}

export interface TestListProps {
  batch_number: string;
}

export interface Props {
  batch_number: string;
  onTestCreated: () => void;
}
