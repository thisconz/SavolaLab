import { db, TransactionClient } from "./client";

export type Migration = {
  version: number;
  up: (client: TransactionClient) => Promise<void>;
};

export const migrations: Migration[] = [
  {
    version: 1,
    up: async (client) => {
      // PRIMARY INDEPENDENT TABLES
      await client.execute(`
        CREATE TABLE IF NOT EXISTS user_permissions (
          role TEXT PRIMARY KEY,
          view_results INTEGER DEFAULT 0,
          input_data INTEGER DEFAULT 0,
          edit_formulas INTEGER DEFAULT 0,
          change_specs INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS sample_types (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          category TEXT NOT NULL,
          line_id INTEGER NULL,
          description TEXT
        );

        CREATE TABLE IF NOT EXISTS production_lines (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          plant_id TEXT DEFAULT 'PLANT-01'
        );

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
    version: 2,
    up: async (client) => {
      // TABLES DEPENDENT ON PERMISSIONS & INFRASTRUCTURE
      await client.execute(`
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

        CREATE TABLE IF NOT EXISTS equipment (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          line_id INTEGER,
          type TEXT,
          status TEXT DEFAULT 'OPERATIONAL',
          CONSTRAINT fk_line FOREIGN KEY(line_id) REFERENCES production_lines(id)
        );
      `);
    },
  },

  {
    version: 3,
    up: async (client) => {
      // TRANSACTIONAL CORE (SAMPLES & USERS)
      await client.execute(`
        CREATE TABLE IF NOT EXISTS users (
          employee_number TEXT PRIMARY KEY,
          password_hash TEXT NOT NULL,
          pin_hash TEXT,
          status TEXT DEFAULT 'PENDING_ACTIVATION',
          last_login TIMESTAMP,
          failed_attempts INTEGER DEFAULT 0,
          locked_until TIMESTAMP,
          CONSTRAINT fk_employee FOREIGN KEY(employee_number) REFERENCES employees(employee_number)
        );

        CREATE TABLE IF NOT EXISTS samples (
          id SERIAL PRIMARY KEY,
          batch_id TEXT,
          sample_type TEXT,
          source_stage TEXT,
          line_id INTEGER,
          equipment_id INTEGER,
          shift_id INTEGER,
          status TEXT DEFAULT 'REGISTERED',
          priority TEXT DEFAULT 'NORMAL',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          technician_id TEXT,
          CONSTRAINT fk_technician FOREIGN KEY(technician_id) REFERENCES employees(employee_number),
          CONSTRAINT fk_line_ref FOREIGN KEY(line_id) REFERENCES production_lines(id)
        );
      `);
    },
  },

  {
    version: 4,
    up: async (client) => {
      // METHODS & WORKFLOWS
      await client.execute(`
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
    },
  },

  {
    version: 5,
    up: async (client) => {
      // LOGGING & UTILS
      await client.execute(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id SERIAL PRIMARY KEY,
          employee_number TEXT NOT NULL,
          action TEXT NOT NULL,
          details TEXT NOT NULL,
          ip_address TEXT,
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
    version: 6,
    up: async (client) => {
      // INDEXING FOR PERFORMANCE
      await client.execute(`
        CREATE INDEX IF NOT EXISTS idx_samples_status ON samples(status);
        CREATE INDEX IF NOT EXISTS idx_samples_priority_created ON samples(priority, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_tests_sample_status ON tests(sample_id, status);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
      `);
    },
  },

  {
    version: 7,
    up: async (client) => {
      // INSTRUMENTS & INVENTORY
      await client.execute(`
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
    version: 8,
    up: async (client) => {
      // WORKFLOW ENGINE
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
          workflow_id INTEGER REFERENCES workflows(id),
          test_type TEXT NOT NULL,
          sequence_order INTEGER,
          min_value DOUBLE PRECISION,
          max_value DOUBLE PRECISION
        );

        CREATE TABLE IF NOT EXISTS workflow_executions (
          id SERIAL PRIMARY KEY,
          workflow_id INTEGER REFERENCES workflows(id),
          sample_id INTEGER REFERENCES samples(id),
          status TEXT DEFAULT 'PENDING',
          started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          completed_at TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS workflow_step_executions (
          id SERIAL PRIMARY KEY,
          execution_id INTEGER REFERENCES workflow_executions(id) ON DELETE CASCADE,
          step_id INTEGER REFERENCES workflow_steps(id),
          test_id INTEGER REFERENCES tests(id),
          result_value DOUBLE PRECISION,
          status TEXT DEFAULT 'PENDING',
          started_at TIMESTAMP,
          completed_at TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_wse_execution ON workflow_step_executions(execution_id);
      `);
    },
  },

  {
    version: 9,
    up: async (client) => {
      // COMMUNICATION & OUTPUT
      await client.execute(`
        CREATE TABLE IF NOT EXISTS certificates (
          id SERIAL PRIMARY KEY,
          batch_id TEXT,
          status TEXT DEFAULT 'DRAFT',
          version INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          approved_by TEXT REFERENCES employees(employee_number)
        );

        CREATE TABLE IF NOT EXISTS notifications (
          id SERIAL PRIMARY KEY,
          employee_number TEXT REFERENCES employees(employee_number),
          type TEXT,
          message TEXT,
          is_read INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS notification_rules (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          condition TEXT,
          action TEXT,
          is_active INTEGER DEFAULT 1
        );
      `);
    },
  },

  {
    version: 10,
    up: async (client) => {
      // EXTERNAL ENTITIES & SPECIAL REQUESTS
      await client.execute(`
        CREATE TABLE IF NOT EXISTS clients (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT,
          phone TEXT,
          address TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS shipments (
          id SERIAL PRIMARY KEY,
          shipment_id TEXT NOT NULL UNIQUE,
          client_name TEXT NOT NULL,
          destination TEXT NOT NULL,
          status TEXT DEFAULT 'Pending',
          eta TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

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
    version: 11,
    up: async (client) => {
      // OTP AUTHENTICATION TABLE
      await client.execute(`
        CREATE TABLE IF NOT EXISTS otp_codes (
          id SERIAL PRIMARY KEY,
          employee_number TEXT NOT NULL REFERENCES employees(employee_number) ON DELETE CASCADE,
          code TEXT NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_otp_employee ON otp_codes(employee_number);
        CREATE INDEX IF NOT EXISTS idx_otp_expires ON otp_codes(expires_at);
      `);
    },
  },

  {
    version: 12,
    up: async (client) => {
      // NOTIFICATION INDEX
      await client.execute(`
        CREATE INDEX IF NOT EXISTS idx_notifications_employee ON notifications(employee_number);
        CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_workflow_executions_sample ON workflow_executions(sample_id);
        CREATE INDEX IF NOT EXISTS idx_tests_updated ON tests(updated_at DESC);
      `);
    },
  },
  {
    version: 13,
    up: async (client) => {
      // Refresh tokens table for persistent sessions
      await client.execute(`
        CREATE TABLE IF NOT EXISTS refresh_tokens (
          id              SERIAL PRIMARY KEY,
          employee_number TEXT NOT NULL REFERENCES employees(employee_number) ON DELETE CASCADE,
          token_hash      TEXT NOT NULL UNIQUE,
          created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          expires_at      TIMESTAMP NOT NULL,
          revoked_at      TIMESTAMP,
          user_agent      TEXT,
          ip_address      TEXT
        );
 
        CREATE INDEX IF NOT EXISTS idx_refresh_tokens_employee ON refresh_tokens(employee_number);
        CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash     ON refresh_tokens(token_hash);
        CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires  ON refresh_tokens(expires_at);
      `);
    },
  },
 
  {
    version: 14,
    up: async (client) => {
      // Prevent duplicate overdue notifications within the same hour
      await client.execute(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_dedup
          ON notifications(employee_number, type, DATE_TRUNC('hour', created_at))
          WHERE type = 'OVERDUE_TEST';
 
        -- Performance index for unread count queries
        CREATE INDEX IF NOT EXISTS idx_notifications_unread
          ON notifications(employee_number, is_read)
          WHERE is_read = FALSE;
      `);
    },
  },
 
  {
    version: 15,
    up: async (client) => {
      // Add source tracking columns to tests
      await client.execute(`
        ALTER TABLE tests
          ADD COLUMN IF NOT EXISTS updated_by TEXT REFERENCES employees(employee_number),
          ADD COLUMN IF NOT EXISTS version     INTEGER DEFAULT 1;
 
        -- Version bump trigger for append-only audit trail
        CREATE OR REPLACE FUNCTION bump_test_version()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.version = COALESCE(OLD.version, 0) + 1;
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
 
        DROP TRIGGER IF EXISTS bump_test_version_trigger ON tests;
        CREATE TRIGGER bump_test_version_trigger
          BEFORE UPDATE ON tests
          FOR EACH ROW EXECUTE FUNCTION bump_test_version();
      `);
    },
  },
 
  {
    version: 16,
    up: async (client) => {
      // Composite indexes for the most common archive queries
      await client.execute(`
        CREATE INDEX IF NOT EXISTS idx_tests_type_status
          ON tests(test_type, status);
 
        CREATE INDEX IF NOT EXISTS idx_tests_sample_performed
          ON tests(sample_id, performed_at DESC);
 
        CREATE INDEX IF NOT EXISTS idx_samples_batch
          ON samples(batch_id);
 
        CREATE INDEX IF NOT EXISTS idx_samples_stage_created
          ON samples(source_stage, created_at DESC);
 
        -- Partial index for active samples only (most-queried subset)
        CREATE INDEX IF NOT EXISTS idx_samples_active
          ON samples(created_at DESC)
          WHERE status NOT IN ('COMPLETED', 'ARCHIVED');
      `);
    },
  },
];