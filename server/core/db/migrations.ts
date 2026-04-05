import { db, TransactionClient } from "./client";

export type Migration = {
  version: number;
  up: (client: TransactionClient) => Promise<void>;
};

export const migrations: Migration[] = [
  {
    version: 1,
    up: async (client) => {
      await client.execute(`
        CREATE TABLE IF NOT EXISTS user_permissions (
          role TEXT PRIMARY KEY,
          view_results INTEGER DEFAULT 0,
          input_data INTEGER DEFAULT 0,
          edit_formulas INTEGER DEFAULT 0,
          change_specs INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS employees (
          employee_number TEXT PRIMARY KEY,
          national_id TEXT UNIQUE NOT NULL,
          dob TEXT NOT NULL,
          name TEXT NOT NULL,
          role TEXT NOT NULL,
          department TEXT NOT NULL,
          email TEXT UNIQUE,
          status TEXT DEFAULT 'ACTIVE',
          CONSTRAINT fk_role FOREIGN KEY(role) REFERENCES user_permissions(role)
        );
      `);
    },
  },
  {
    version: 2,
    up: async (client) => {
      await client.execute(`
        CREATE TABLE IF NOT EXISTS users (
          employee_number TEXT PRIMARY KEY,
          password_hash TEXT NOT NULL,
          pin_hash TEXT NOT NULL,
          status TEXT DEFAULT 'PENDING_ACTIVATION',
          last_login TIMESTAMP,
          CONSTRAINT fk_employee FOREIGN KEY(employee_number) REFERENCES employees(employee_number)
        );
      `);
    },
  },
  {
    version: 3,
    up: async (client) => {
      await client.execute(`
        CREATE TABLE IF NOT EXISTS otp_codes (
          id SERIAL PRIMARY KEY,
          employee_number TEXT NOT NULL,
          code TEXT NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          CONSTRAINT fk_employee_otp FOREIGN KEY(employee_number) REFERENCES employees(employee_number)
        );
      `);
    },
  },
  {
    version: 4,
    up: async (client) => {
      await client.execute(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id SERIAL PRIMARY KEY,
          employee_number TEXT NOT NULL,
          action TEXT NOT NULL,
          details TEXT NOT NULL,
          ip_address TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
    },
  },
  {
    version: 5,
    up: async (client) => {
      await client.execute(`
        CREATE TABLE IF NOT EXISTS samples (
          id SERIAL PRIMARY KEY,
          batch_id TEXT,
          source_stage TEXT,
          line_id TEXT,
          equipment_id TEXT,
          shift_id TEXT,
          status TEXT DEFAULT 'REGISTERED',
          priority TEXT DEFAULT 'NORMAL',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          technician_id TEXT,
          CONSTRAINT fk_technician FOREIGN KEY(technician_id) REFERENCES employees(employee_number)
        );
      `);
    },
  },
  {
    version: 6,
    up: async (client) => {
      await client.execute(`
        CREATE TABLE IF NOT EXISTS tests (
          id SERIAL PRIMARY KEY,
          sample_id INTEGER NOT NULL,
          test_type TEXT NOT NULL,
          raw_value DOUBLE PRECISION,
          calculated_value DOUBLE PRECISION,
          unit TEXT,
          status TEXT DEFAULT 'PENDING',
          performed_at TIMESTAMP,
          performer_id TEXT,
          reviewer_id TEXT,
          review_at TIMESTAMP,
          review_comment TEXT,
          notes TEXT,
          params TEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_sample FOREIGN KEY(sample_id) REFERENCES samples(id) ON DELETE RESTRICT,
          CONSTRAINT fk_performer FOREIGN KEY(performer_id) REFERENCES employees(employee_number),
          CONSTRAINT fk_reviewer FOREIGN KEY(reviewer_id) REFERENCES employees(employee_number)
        );
      `);
      await client.execute(
        `CREATE INDEX IF NOT EXISTS idx_tests_sample_id ON tests(sample_id);`,
      );
    },
  },
  {
    version: 7,
    up: async (client) => {
      await client.execute(`
        CREATE TABLE IF NOT EXISTS workflows (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          target_stage TEXT,
          is_active INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS workflow_steps (
          id SERIAL PRIMARY KEY,
          workflow_id INTEGER,
          test_type TEXT,
          sequence_order INTEGER,
          min_value DOUBLE PRECISION,
          max_value DOUBLE PRECISION,
          CONSTRAINT fk_workflow FOREIGN KEY(workflow_id) REFERENCES workflows(id)
        );

        CREATE TABLE IF NOT EXISTS workflow_executions (
          id SERIAL PRIMARY KEY,
          workflow_id INTEGER,
          sample_id INTEGER,
          status TEXT DEFAULT 'PENDING',
          started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          completed_at TIMESTAMP,
          CONSTRAINT fk_workflow_exec FOREIGN KEY(workflow_id) REFERENCES workflows(id),
          CONSTRAINT fk_sample_exec FOREIGN KEY(sample_id) REFERENCES samples(id)
        );

        CREATE TABLE IF NOT EXISTS workflow_step_executions (
          id SERIAL PRIMARY KEY,
          execution_id INTEGER,
          step_id INTEGER,
          test_id INTEGER,
          result_value DOUBLE PRECISION,
          status TEXT DEFAULT 'PENDING',
          started_at TIMESTAMP,
          completed_at TIMESTAMP,
          CONSTRAINT fk_execution FOREIGN KEY(execution_id) REFERENCES workflow_executions(id),
          CONSTRAINT fk_step FOREIGN KEY(step_id) REFERENCES workflow_steps(id),
          CONSTRAINT fk_test FOREIGN KEY(test_id) REFERENCES tests(id)
        );
      `);
    },
  },
  {
    version: 8,
    up: async (client) => {
      await client.execute(`
        CREATE TABLE IF NOT EXISTS production_lines (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          plant_id TEXT DEFAULT 'PLANT-01'
        );

        CREATE TABLE IF NOT EXISTS equipment (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          line_id INTEGER,
          type TEXT,
          status TEXT DEFAULT 'OPERATIONAL',
          CONSTRAINT fk_line FOREIGN KEY(line_id) REFERENCES production_lines(id)
        );

        CREATE TABLE IF NOT EXISTS instruments (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          model TEXT,
          serial_number TEXT,
          status TEXT DEFAULT 'ACTIVE',
          last_calibration TIMESTAMP,
          next_calibration TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS inventory (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          type TEXT,
          quantity DOUBLE PRECISION,
          unit TEXT,
          expiry_date TIMESTAMP,
          min_stock DOUBLE PRECISION
        );
      `);
    },
  },
  {
    version: 9,
    up: async (client) => {
      await client.execute(`
        CREATE TABLE IF NOT EXISTS certificates (
          id SERIAL PRIMARY KEY,
          batch_id TEXT,
          status TEXT DEFAULT 'DRAFT',
          version INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          approved_by TEXT,
          CONSTRAINT fk_approved_by FOREIGN KEY(approved_by) REFERENCES employees(employee_number)
        );

        CREATE TABLE IF NOT EXISTS notifications (
          id SERIAL PRIMARY KEY,
          employee_number TEXT,
          type TEXT,
          message TEXT,
          is_read INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_employee_notify FOREIGN KEY(employee_number) REFERENCES employees(employee_number)
        );

        CREATE TABLE IF NOT EXISTS sample_types (
          id SERIAL PRIMARY KEY,
          name TEXT UNIQUE NOT NULL,
          description TEXT
        );

        CREATE TABLE IF NOT EXISTS process_stages (
          id SERIAL PRIMARY KEY,
          name TEXT UNIQUE NOT NULL,
          description TEXT
        );

        CREATE TABLE IF NOT EXISTS measurement_units (
          id SERIAL PRIMARY KEY,
          name TEXT UNIQUE NOT NULL,
          symbol TEXT
        );

        CREATE TABLE IF NOT EXISTS test_methods (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          sop_steps TEXT,
          formula TEXT,
          min_range DOUBLE PRECISION,
          max_range DOUBLE PRECISION,
          version INTEGER DEFAULT 1,
          is_active INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS system_preferences (
          key TEXT PRIMARY KEY,
          value TEXT
        );
      `);
    },
  },
  {
    version: 10,
    up: async (client) => {
      await client.execute(`
        CREATE TABLE IF NOT EXISTS shifts (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          start_time TIMESTAMP,
          end_time TIMESTAMP
        );
      `);
    },
  },
  {
    version: 11,
    up: async (client) => {
      await client.execute(`
        CREATE TABLE IF NOT EXISTS notification_rules (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          condition TEXT,
          action TEXT,
          is_active INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
    },
  },
  {
    version: 12,
    up: async (client) => {
      await client.execute(`
        CREATE TABLE IF NOT EXISTS clients (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT,
          phone TEXT,
          address TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
    },
  },
  {
    version: 13,
    up: async (client) => {
      await client.execute(`
        CREATE TABLE IF NOT EXISTS stat_requests (
          id SERIAL PRIMARY KEY,
          department TEXT NOT NULL,
          reason TEXT NOT NULL,
          urgency TEXT DEFAULT 'NORMAL',
          status TEXT DEFAULT 'OPEN',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
    },
  },
  {
    version: 14,
    up: async (client) => {
      await client.execute(
        `ALTER TABLE users ALTER COLUMN pin_hash DROP NOT NULL`,
      );
    },
  },
  {
    version: 15,
    up: async (client) => {
      await client.execute(`
      -- Samples: primary queue queries filter by status and sort by priority + date
      CREATE INDEX IF NOT EXISTS idx_samples_status 
        ON samples(status);
      CREATE INDEX IF NOT EXISTS idx_samples_created_at 
        ON samples(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_samples_priority_created 
        ON samples(priority, created_at DESC);

      -- Tests: filter by status and date
      CREATE INDEX IF NOT EXISTS idx_tests_status 
        ON tests(status);
      CREATE INDEX IF NOT EXISTS idx_tests_performed_at 
        ON tests(performed_at DESC);
      CREATE INDEX IF NOT EXISTS idx_tests_sample_status 
        ON tests(sample_id, status);

      -- Audit logs: always queried by date range
      CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at 
        ON audit_logs(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_employee 
        ON audit_logs(employee_number, created_at DESC);

      -- Notifications: always filtered by employee + read status
      CREATE INDEX IF NOT EXISTS idx_notifications_employee_read 
        ON notifications(employee_number, is_read, created_at DESC);

      -- Workflow executions: queried by sample_id constantly
      CREATE INDEX IF NOT EXISTS idx_workflow_executions_sample 
        ON workflow_executions(sample_id, status);

      -- OTP codes: queried by employee_number + expiry on every login attempt
      CREATE INDEX IF NOT EXISTS idx_otp_codes_employee_expiry 
        ON otp_codes(employee_number, expires_at);
    `);
    },
  },
  {
    version: 16,
    up: async (client) => {
      await client.execute(`
        ALTER TABLE users
          ADD COLUMN IF NOT EXISTS failed_attempts INTEGER DEFAULT 0,
          ADD COLUMN IF NOT EXISTS locked_until    TIMESTAMP;
      `);
    },
  },
  {
    version: 17,
    up: async (client) => {
      await client.execute(`
        CREATE TABLE IF NOT EXISTS shipments (
          id SERIAL PRIMARY KEY,
          shipment_id TEXT NOT NULL UNIQUE,
          client_name TEXT NOT NULL,
          destination TEXT NOT NULL,
          status TEXT DEFAULT 'Pending',
          eta TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
    },
  },
  {
    version: 18,
    up: async (client) => {
      await client.execute(`
        ALTER TABLE samples
        ADD COLUMN IF NOT EXISTS sample_type TEXT;
      `);
    },
  },
];
