import { db, TransactionClient } from "./client";
import { SampleType } from "../types"
import { logger } from "../logger";

/**
 * UTILS & MOCK ENCRYPTION
 * Replace these with real bcrypt calls in production
 */
const bcrypt = {
  hash: async (s: string, r: number) => `hashed_${s}`, // Mock
  compare: async (s: string, h: string) => h === `hashed_${s}`,
};

// --- Seed Data Definitions ---
const ROLE_PERMISSIONS = [
  { role: "ADMIN", view_results: 1, input_data: 1, edit_formulas: 1, change_specs: 1 },
  { role: "CHEMIST", view_results: 1, input_data: 1, edit_formulas: 1, change_specs: 1 },
  { role: "SHIFT_CHEMIST", view_results: 1, input_data: 1, edit_formulas: 1, change_specs: 1 },
  { role: "ASSISTING_MANAGER", view_results: 1, input_data: 1, edit_formulas: 1, change_specs: 1 },
  { role: "HEAD_MANAGER", view_results: 1, input_data: 1, edit_formulas: 1, change_specs: 1 },
  { role: "ENGINEER", view_results: 1, input_data: 0, edit_formulas: 0, change_specs: 0 },
  { role: "DISPATCH", view_results: 1, input_data: 0, edit_formulas: 0, change_specs: 0 },
];

const PRODUCTION_LINES = [
  { id: 1, name: "Raw Handling", plant_id: "PLANT-01"},
  { id: 2, name: "Refining", plant_id: "PLANT-02"},
  { id: 3, name: "Carbonation", plant_id: "PLANT-03"},
  { id: 4, name: "Filtration", plant_id: "PLANT-04"},
  { id: 5, name: "Evaporation", plant_id: "PLANT-05"},
  { id: 6, name: "Crystallization", plant_id: "PLANT-06"},
  { id: 7, name: "Centrifuge", plant_id: "PLANT-07"},
  { id: 8, name: "Drying", plant_id: "PLANT-08"},
  { id: 9, name: "Packaging", plant_id: "PLANT-09"},
  { id: 10, name: "Utility Streams", plant_id: "PLANT-10"}
];

const SAMPLE_TYPES: SampleType[] = [
  { name: "Raw Handling", category: "STAGE", description: "" },
  { name: "Refining", category: "STAGE", description: "" },
  { name: "White sugar", category: "PRODUCT", description: "" },
  { name: "Polish liquor", category: "LIQUID", description: "" },
  { name: "Effluent samples", category: "UTILITY", description: "" },
  // ...
];

// --- Modular Seeder Functions ---

// --- Permissions Seeder ---
async function seedPermissions(client: TransactionClient) {
  const { count } = (await client.query<{ count: string }>("SELECT COUNT(*) FROM user_permissions"))[0];
  if (Number(count) > 0) return;

  for (const perm of ROLE_PERMISSIONS) {
    await client.execute(
      `INSERT INTO user_permissions (role, view_results, input_data, edit_formulas, change_specs)
       VALUES ($1, $2, $3, $4, $5)`,
      [perm.role, perm.view_results, perm.input_data, perm.edit_formulas, perm.change_specs]
    );
  }
  logger.info("Seeded: Permissions");
}

// --- Admin User Seeder ---
async function seedAccounts(client: TransactionClient) {
  const { count } = (await client.query<{ count: string }>("SELECT COUNT(*) FROM employees"))[0];
  if (Number(count) > 0) return;

  const passwordHash = await bcrypt.hash("1234", 10);
  const pinHash = await bcrypt.hash("1111", 10);

  const EmployeeData = [
    {employee_number: "ADMIN", national_id: "000000", dob: "2001-01-01", name: "Administrator", role: "ADMIN", department: "IT", email: "admin@savola.com", status: "ACTIVE"},
    {employee_number: "CHEMIST", national_id: "111111", dob: "2001-01-02", name: "Chemist ", role: "CHEMIST", department: "Quality Control", email: "chemist@savola.com", status: "ACTIVE"}
  ];

  for (const ed of EmployeeData) {
    await client.execute(
      `INSERT INTO employees (employee_number, national_id, dob, name, role, department, email, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [ed.employee_number, ed.national_id, ed.dob, ed.name, ed.role, ed.department, ed.email, ed.status],
    );

    await client.execute(
      `INSERT INTO users (employee_number, password_hash, pin_hash, status)
      VALUES ($1, $2, $3, 'ACTIVE')`,
      [ed.employee_number, passwordHash, pinHash]
    );

    await client.execute(
      `INSERT INTO audit_logs (employee_number, action, details)
      VALUES ($1, $2, $3)`,
      [ed.employee_number, "ACCOUNT_ACTIVATED", "System initialized via seeder"]
    );
  }
  logger.info("Seeded: Admin User");
}

// --- Infrastructure Seeder (Lines & Equipment) ---
async function seedInfrastructure(client: TransactionClient) {
  const { count } = (await client.query<{ count: string }>("SELECT COUNT(*) FROM production_lines"))[0];
  if (Number(count) > 0) return;

  for (const line  of PRODUCTION_LINES) {
    await client.execute("INSERT INTO production_lines (name, plant_id) VALUES ($1, $2)", [line.name, line.plant_id]);
  }

  // Map equipment to lines dynamically
  const equipmentSpecs = [
    { name: "Centrifuge C-101", line: "Centrifuge", type: "Centrifuge" },
    { name: "Evaporator E-202", line: "Evaporation", type: "Evaporator" },
    { name: "Packaging P-303", line: "Packaging", type: "Packer" },
  ];

  for (const eq of equipmentSpecs) {
    const line = await client.queryOne<{ id: number }>(
      "SELECT id FROM production_lines WHERE name = $1", [eq.line]
    );
    if (line) {
      await client.execute(
        "INSERT INTO equipment (name, line_id, type) VALUES ($1, $2, $3)",
        [eq.name, line.id, eq.type]
      );
    }
  }
  logger.info("Seeded: Production Lines & Equipment");
}

// --- Shifts Seeder ---
async function seedShifts(client: TransactionClient) {
  const { count } = (await client.query<{ count: string }>("SELECT COUNT(*) FROM shifts"))[0];
  if (Number(count) > 0) return;

  const today = new Date().toISOString().split("T")[0];
  const shifts = [
    { id: 1, name: "Morning", start: "07:00:00", end: "15:00:00" },
    { id: 2, name: "Afternoon", start: "15:00:00", end: "23:00:00" },
    { id: 3, name: "Night", start: "23:00:00", end: "07:00:00" },
  ];

  for (const s of shifts) {
    await client.execute(
      "INSERT INTO shifts (id, name, start_time, end_time) VALUES ($1, $2, $3, $4)",
      [s.id, s.name, `${today} ${s.start}`, `${today} ${s.end}`]
    );
  }
  logger.info("Seeded: Shifts");
}

// --- System Preferences Seeder ---
async function seedSystemPreferences(client: TransactionClient) {
  const { count } = (await client.query<{ count: string }>("SELECT COUNT(*) FROM system_preferences"))[0];
  if (Number(count) > 0) return;

  const preferences = [
    {key: "DATE_TIME_FORMAT", value: "YYYY-MM-DDTHH:mm:ss.SSSZ"},
  ];

  for (const p of preferences) {
    await client.execute(
      "INSERT INTO system_preferences (key, value) VALUES ($1, $2)",
      [p.key, p.value]
    );
  }
  logger.info("Seeded: System Preferences");
}

// --- Sample Types Seeder ---
async function seedSampleTypes(client: TransactionClient) {
  const { count } = (await client.query<{ count: string }>("SELECT COUNT(*) FROM sample_types"))[0];
  if (Number(count) > 0) return;

  for (const st of SAMPLE_TYPES) {
    await client.execute(
      `INSERT INTO sample_types (name, category)
       VALUES ($1, $2)`,
      [st.name, st.category]
    );
  }
  logger.info("Seeded: Sample Types");
}

// --- Samples Seeder ---
async function seedSamples(client: TransactionClient) {
  const { count } = (await client.query<{ count: string }>("SELECT COUNT(*) FROM samples"))[0];
  if (Number(count) > 0) return;

  const line = await client.queryOne<{ id: number }>("SELECT id FROM production_lines LIMIT 1");
  const equipment = await client.queryOne<{ id: number }>("SELECT id FROM equipment LIMIT 1");
  const shift = await client.queryOne<{ id: number }>("SELECT id FROM shifts LIMIT 1");
  const sampleType = await client.queryOne<{ id: number }>("SELECT id FROM sample_types WHERE name = $1",["Raw Handling"]);

  if (line && shift && equipment) {
    await client.execute(
      `INSERT INTO samples (batch_id, sample_type_id, line_id, equipment_id, shift_id, status, priority, created_at, technician_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      ["BT-1111", sampleType.id, line.id, equipment.id, shift.id, "PENDING", "STAT", new Date(), "ADMIN"]
    );
    logger.info("Seeded: Samples");
  }
}

// --- Main Entry Point ---
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