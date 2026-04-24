import { db, TransactionClient } from "./client";
import { logger } from "../logger";
import argon2 from "argon2";

// ─────────────────────────────────────────────
// Hash helper (same config as auth service)
// ─────────────────────────────────────────────

async function hash(plain: string): Promise<string> {
  return argon2.hash(plain, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });
}

// ─────────────────────────────────────────────
// Seed data
// ─────────────────────────────────────────────

const ROLE_PERMISSIONS = [
  {
    role: "ADMIN",
    view_results: 1,
    input_data: 1,
    edit_formulas: 1,
    change_specs: 1,
  },
  {
    role: "CHEMIST",
    view_results: 1,
    input_data: 1,
    edit_formulas: 1,
    change_specs: 1,
  },
  {
    role: "SHIFT_CHEMIST",
    view_results: 1,
    input_data: 1,
    edit_formulas: 1,
    change_specs: 1,
  },
  {
    role: "ASSISTING_MANAGER",
    view_results: 1,
    input_data: 1,
    edit_formulas: 1,
    change_specs: 1,
  },
  {
    role: "HEAD_MANAGER",
    view_results: 1,
    input_data: 1,
    edit_formulas: 1,
    change_specs: 1,
  },
  {
    role: "ENGINEER",
    view_results: 1,
    input_data: 0,
    edit_formulas: 0,
    change_specs: 0,
  },
  {
    role: "DISPATCH",
    view_results: 1,
    input_data: 0,
    edit_formulas: 0,
    change_specs: 0,
  },
];

const PRODUCTION_LINES = [
  { name: "Raw Handling", plant_id: "PLANT-01" },
  { name: "Refining", plant_id: "PLANT-02" },
  { name: "Carbonation", plant_id: "PLANT-03" },
  { name: "Filtration", plant_id: "PLANT-04" },
  { name: "Evaporation", plant_id: "PLANT-05" },
  { name: "Crystallization", plant_id: "PLANT-06" },
  { name: "Centrifuge", plant_id: "PLANT-07" },
  { name: "Drying", plant_id: "PLANT-08" },
  { name: "Packaging", plant_id: "PLANT-09" },
  { name: "Utility Streams", plant_id: "PLANT-10" },
];

const SAMPLE_TYPES = [
  { name: "Raw Handling", category: "STAGE" },
  { name: "Refining", category: "STAGE" },
  { name: "White sugar", category: "PRODUCT" },
  { name: "Polish liquor", category: "LIQUID" },
  { name: "Effluent samples", category: "UTILITY" },
];

// ─────────────────────────────────────────────
// Seeders
// ─────────────────────────────────────────────

async function seedPermissions(client: TransactionClient) {
  const [{ count }] = await client.query<{ count: string }>(
    "SELECT COUNT(*) FROM user_permissions",
  );
  if (Number(count) > 0) return;

  for (const perm of ROLE_PERMISSIONS) {
    await client.execute(
      `INSERT INTO user_permissions (role, view_results, input_data, edit_formulas, change_specs)
       VALUES ($1, $2, $3, $4, $5)`,
      [perm.role, perm.view_results, perm.input_data, perm.edit_formulas, perm.change_specs],
    );
  }
  logger.info("Seeded: Permissions");
}

async function seedAccounts(client: TransactionClient) {
  const [{ count }] = await client.query<{ count: string }>("SELECT COUNT(*) FROM employees");
  if (Number(count) > 0) return;

  // IMPORTANT: passwords are hashed with argon2id — never store plaintext
  const passwordHash = await hash("Z3nthar!2025"); // default dev password
  const pinHash = await hash("1111"); // default PIN

  const accounts = [
    {
      employee_number: "ADMIN",
      national_id: "000000",
      dob: "2001-01-01",
      name: "Administrator",
      role: "ADMIN",
      department: "IT",
      email: "admin@zenthar.local",
      status: "ACTIVE",
    },
    {
      employee_number: "CHEMIST",
      national_id: "111111",
      dob: "2001-01-02",
      name: "Lab Chemist",
      role: "CHEMIST",
      department: "Quality Control",
      email: "chemist@zenthar.local",
      status: "ACTIVE",
    },
    {
      employee_number: "SHIFT01",
      national_id: "222222",
      dob: "1990-05-15",
      name: "Shift Supervisor",
      role: "SHIFT_CHEMIST",
      department: "Quality Control",
      email: "shift@zenthar.local",
      status: "ACTIVE",
    },
  ];

  for (const acc of accounts) {
    await client.execute(
      `INSERT INTO employees (employee_number, national_id, dob, name, role, department, email, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        acc.employee_number,
        acc.national_id,
        acc.dob,
        acc.name,
        acc.role,
        acc.department,
        acc.email,
        acc.status,
      ],
    );

    await client.execute(
      `INSERT INTO users (employee_number, password_hash, pin_hash, status)
       VALUES ($1, $2, $3, 'ACTIVE')`,
      [acc.employee_number, passwordHash, pinHash],
    );

    await client.execute(
      `INSERT INTO audit_logs (employee_number, action, details)
       VALUES ($1, 'ACCOUNT_ACTIVATED', 'System initialized via seeder')`,
      [acc.employee_number],
    );
  }
  logger.info("Seeded: Accounts (passwords hashed with argon2id)");
}

async function seedInfrastructure(client: TransactionClient) {
  const [{ count }] = await client.query<{ count: string }>(
    "SELECT COUNT(*) FROM production_lines",
  );
  if (Number(count) > 0) return;

  for (const line of PRODUCTION_LINES) {
    await client.execute("INSERT INTO production_lines (name, plant_id) VALUES ($1, $2)", [
      line.name,
      line.plant_id,
    ]);
  }

  const equipmentSpecs = [
    { name: "Centrifuge C-101", lineName: "Centrifuge", type: "Centrifuge" },
    { name: "Evaporator E-202", lineName: "Evaporation", type: "Evaporator" },
    { name: "Packager P-303", lineName: "Packaging", type: "Packer" },
  ];

  for (const eq of equipmentSpecs) {
    const line = await client.queryOne<{ id: number }>(
      "SELECT id FROM production_lines WHERE name = $1",
      [eq.lineName],
    );
    if (line) {
      await client.execute("INSERT INTO equipment (name, line_id, type) VALUES ($1, $2, $3)", [
        eq.name,
        line.id,
        eq.type,
      ]);
    }
  }
  logger.info("Seeded: Production Lines & Equipment");
}

async function seedShifts(client: TransactionClient) {
  const [{ count }] = await client.query<{ count: string }>("SELECT COUNT(*) FROM shifts");
  if (Number(count) > 0) return;

  const today = new Date().toISOString().split("T")[0];
  const shifts = [
    { name: "Morning", start: "07:00:00", end: "15:00:00" },
    { name: "Afternoon", start: "15:00:00", end: "23:00:00" },
    { name: "Night", start: "23:00:00", end: "07:00:00" },
  ];

  for (const s of shifts) {
    await client.execute("INSERT INTO shifts (name, start_time, end_time) VALUES ($1, $2, $3)", [
      s.name,
      `${today} ${s.start}`,
      `${today} ${s.end}`,
    ]);
  }
  logger.info("Seeded: Shifts");
}

async function seedSystemPreferences(client: TransactionClient) {
  const [{ count }] = await client.query<{ count: string }>(
    "SELECT COUNT(*) FROM system_preferences",
  );
  if (Number(count) > 0) return;

  const prefs = [
    { key: "DATE_TIME_FORMAT", value: "YYYY-MM-DDTHH:mm:ss.SSSZ" },
    { key: "TIMEZONE", value: "UTC" },
    { key: "UNITS", value: "metric" },
    { key: "APP_VERSION", value: "v1.0.0" },
  ];

  for (const p of prefs) {
    await client.execute("INSERT INTO system_preferences (key, value) VALUES ($1, $2)", [
      p.key,
      p.value,
    ]);
  }
  logger.info("Seeded: System Preferences");
}

async function seedSampleTypes(client: TransactionClient) {
  const [{ count }] = await client.query<{ count: string }>("SELECT COUNT(*) FROM sample_types");
  if (Number(count) > 0) return;

  for (const st of SAMPLE_TYPES) {
    await client.execute("INSERT INTO sample_types (name, category) VALUES ($1, $2)", [
      st.name,
      st.category,
    ]);
  }
  logger.info("Seeded: Sample Types");
}

async function seedSamples(client: TransactionClient) {
  const [{ count }] = await client.query<{ count: string }>("SELECT COUNT(*) FROM samples");
  if (Number(count) > 0) return;

  const line = await client.queryOne<{ id: number }>("SELECT id FROM production_lines LIMIT 1");
  const equip = await client.queryOne<{ id: number }>("SELECT id FROM equipment LIMIT 1");
  const shift = await client.queryOne<{ id: number }>("SELECT id FROM shifts LIMIT 1");

  if (line && equip && shift) {
    await client.execute(
      `INSERT INTO samples
         (batch_id, sample_type, source_stage, line_id, equipment_id, shift_id,
          status, priority, created_at, technician_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        "BT-1111",
        "Raw sugar",
        "Raw Handling",
        line.id,
        equip.id,
        shift.id,
        "PENDING",
        "STAT",
        new Date(),
        "ADMIN",
      ],
    );
    logger.info("Seeded: Sample (demo batch BT-1111)");
  }
}

// ─────────────────────────────────────────────
// Entry point
// ─────────────────────────────────────────────

export async function seedDatabase() {
  try {
    await db.transaction(async (client: TransactionClient) => {
      await seedPermissions(client);
      await seedAccounts(client);
      await seedInfrastructure(client);
      await seedShifts(client);
      await seedSystemPreferences(client);
      await seedSampleTypes(client);
      await seedSamples(client);
    });
    logger.info("Database seeding completed successfully");
  } catch (err) {
    logger.error(`DB SEED FAILED: ${err instanceof Error ? err.message : String(err)}`);
    throw err;
  }
}
