import { db, TransactionClient } from "./client";

const bcrypt = {
  hash: async (s: string, r: number) => s,
  compare: async (s: string, h: string) => s === h
};

export async function seedDatabase() {
  try {
    await db.transaction(async (client: TransactionClient) => {
      
      // --- Helper for Production Lines (Fixed Scope & API) ---
      const getLineId = async (name: string): Promise<number> => {
        const rows = await client.query<{ id: number }>(
          "SELECT id FROM production_lines WHERE name = $1",
          [name]
        );
        if (rows.length === 0) throw new Error(`Missing production line: ${name}`);
        return rows[0].id;
      };

      // --- User Permissions ---
      // Removed .rows[0] -> Now accessing the array directly
      const permCountResult = await client.query<{ count: string }>(
        "SELECT COUNT(*) AS count FROM user_permissions"
      );
      const permCount = Number(permCountResult[0].count);
      
      if (permCount === 0) {
        const roles = ["ADMIN", "CHEMIST", "SHIFT_CHEMIST", "ASSISTING_MANAGER", "HEAD_MANAGER", "ENGINEER", "DISPATCH"];
        const permissions = [
          { view_results: 1, input_data: 1, edit_formulas: 1, change_specs: 1 },
          { view_results: 1, input_data: 1, edit_formulas: 1, change_specs: 1 },
          { view_results: 1, input_data: 1, edit_formulas: 1, change_specs: 1 },
          { view_results: 1, input_data: 1, edit_formulas: 1, change_specs: 1 },
          { view_results: 1, input_data: 1, edit_formulas: 1, change_specs: 1 },
          { view_results: 1, input_data: 0, edit_formulas: 0, change_specs: 0 },
          { view_results: 1, input_data: 0, edit_formulas: 0, change_specs: 0 },
        ];

        for (let i = 0; i < roles.length; i++) {
          await client.execute(
            `INSERT INTO user_permissions (role, view_results, input_data, edit_formulas, change_specs)
             VALUES ($1, $2, $3, $4, $5)`,
            [roles[i], permissions[i].view_results, permissions[i].input_data, permissions[i].edit_formulas, permissions[i].change_specs]
          );
        }
      }

      // --- Employees & Admin ---
      const employeesCountResult = await client.query<{ count: string }>("SELECT COUNT(*) AS count FROM employees");
      const employeesCount = Number(employeesCountResult[0].count);

      if (employeesCount === 0) {
        const passwordHash = await bcrypt.hash("1234", 10);
        const pinHash = await bcrypt.hash("1111", 10);

        await client.execute(
          `INSERT INTO employees (employee_number, national_id, dob, name, role, department, email)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          ["ADMIN", "000000", "2001-01-01", "Administrator", "ADMIN", "IT", "admin@savola.com"],
        );

        await client.execute(
          `INSERT INTO users (employee_number, password_hash, pin_hash, status)
           VALUES ($1, $2, $3, 'ACTIVE')`,
          ["ADMIN", passwordHash, pinHash]
        );

        await client.execute(
          `INSERT INTO audit_logs (employee_number, action, details)
           VALUES ($1, $2, $3)`,
          ["ADMIN", "ACCOUNT_ACTIVATED", "User completed credential setup"]
        );
      }

      // --- Production Lines & Equipment ---
      const linesCountResult = await client.query<{ count: string }>("SELECT COUNT(*) AS count FROM production_lines");
      const linesCount = Number(linesCountResult[0].count);

      if (linesCount === 0) {
        const lineNames = ["Raw Handling", "Refining", "Carbonation", "Filtration", "Evaporation", "Crystallization", "Centrifuge", "Drying", "Packaging", "Utility Streams"];
        
        for (const name of lineNames) {
          await client.execute("INSERT INTO production_lines (name) VALUES ($1)", [name]);
        }

        // Using our fixed helper function
        await client.execute("INSERT INTO equipment (name, line_id, type) VALUES ($1, $2, $3)", ["Centrifuge C-101", await getLineId("Centrifuge"), "Centrifuge"]);
        await client.execute("INSERT INTO equipment (name, line_id, type) VALUES ($1, $2, $3)", ["Evaporator E-202", await getLineId("Evaporation"), "Evaporator"]);
        await client.execute("INSERT INTO equipment (name, line_id, type) VALUES ($1, $2, $3)", ["Packaging P-303", await getLineId("Packaging"), "Packer"]);
      }

      // --- Shifts ---
      const shiftCountResult = await client.query<{ count: string }>("SELECT COUNT(*) AS count FROM shifts");
      if (Number(shiftCountResult[0].count) === 0) {
        const today = new Date().toISOString().split('T')[0]; // Simpler date format
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
      }

      // --- Samples (Fixed FK lookups) ---
      const sampleCountResult = await client.query<{ count: string }>("SELECT COUNT(*) AS count FROM samples");
      if (Number(sampleCountResult[0].count) === 0) {
        const line = await client.queryOne("SELECT id FROM production_lines WHERE name = $1", ["Raw Handling"]);
        const equip = await client.queryOne("SELECT id FROM equipment WHERE name = $1", ["Centrifuge C-101"]);
        const shift = await client.queryOne("SELECT id FROM shifts WHERE name = $1", ["Morning"]);

        if (line && equip && shift) {
          await client.execute(
            `INSERT INTO samples (id, batch_id, source_stage, line_id, equipment_id, shift_id, status, priority, created_at, technician_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [1, "BT-1111", "Raw Sugar", line.id, equip.id, shift.id, "REGISTERED", "NORMAL", new Date(), "ADMIN"],
          );
        }
      }

      // --- Sample Types ---
      const typeCountResult = await client.query<{ count: string }>("SELECT COUNT(*) AS count FROM sample_types");
      if (Number(typeCountResult[0].count) === 0) {
        const sampleTypes = [["Raw Sugar", "Unprocessed"], ["White Sugar", "Final refined crystals"]]; // Truncated for brevity
        for (const [name, desc] of sampleTypes) {
          await client.execute("INSERT INTO sample_types (name, description) VALUES ($1, $2)", [name, desc]);
        }
      }

    });
    console.log("✅ Database seeding completed successfully.");
  } catch (err) {
    console.error("❌ DB SEED FAILED", err);
    throw err;
  }
}
