export interface Sample {
  id?: string;
  batch_number: string;
  sample_type: string;
  collected_at: string;
  location: string;
  assigned_to?: string;
  notes_text?: string;
}
