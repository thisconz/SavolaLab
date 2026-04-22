export interface AuditLog {
  id: number;
  employee_number: string;
  action: string;
  details: string;
  ip_address?: string;
  created_at: string;
}
