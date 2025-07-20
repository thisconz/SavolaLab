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

export type TestEditProps = {
  test: Test;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export interface TestProps {
  batch_number: string;
  refreshTests: boolean;
}

export interface AvgTestResult {
  sample_type: string;
  avg_test_result: number;
}