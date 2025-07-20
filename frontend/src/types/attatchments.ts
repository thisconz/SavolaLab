export interface AttachmentWire {
  id: string;
  batch_number: string;        // <-- Add if backend includes; if not, derive.
  file_name: string;           // backend's stored/managed filename
  original_filename?: string;  // optional human-upload name (if backend sends)
  file_type?: string;          // backend classification or MIME major (e.g., "pdf")
  content_type?: string;       // full MIME type if provided (e.g., "application/pdf")
  tag?: string;                // "lab_sheet" | "device_output" | ...
  attachment_type?: string;    // Domain-level type; may duplicate file_type
  uploaded_by: string;         // employee_id/code
  uploaded_at: string;         // ISO string
  size_bytes?: number;
  file_url?: string;           // signed URL (short-lived)
  // Any backend-only fields also go here.
}

export interface UploadAttachmentOpts {
  tag?: string;              // e.g., "lab_sheet"
  attachmentType?: string;   // e.g., "pdf" | "image" | ...
  filenameOverride?: string; // to tell backend to store under this name
}

export interface AttachmentUrlResponse {
  url: string;
  expires_at: string; // ISO
}