export interface Sample {
  id: string;
  batch_number: string;
  sample_type: string;
  collected_at: string;
  location: string;
  assigned_to?: string;
  notes_text?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SampleCreate {
  batch_number: string;
  sample_type: string;
  collected_at: string;
  location: string;
  notes_text?: string;
  assigned_to?: string;
}

export interface Props {
  batch_number: string;
}