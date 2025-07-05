interface Test {
  id: string;
  sample_batch_number: string;
  parameter: string;
  value: number;
  unit: string;
  status: string;
  entered_by: string;
  entered_at: string;
  notes?: string;
}

interface TestListProps {
  batch_number: string;
}