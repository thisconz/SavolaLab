import { dbOrm } from "../../core/db/orm";
import { samples, tests } from "../../core/db/schema";
import type { SampleData, TestResultSummary, SampleTest } from "../../core/types";
import { eq, desc, asc, and, sql } from "drizzle-orm";

export const SampleRepository = {
  async findAll(): Promise<any[]> {
    try {
      // Using query builder for join and group by
      const results = await dbOrm
        .select({
          id: samples.id,
          batch_id: samples.batch_id,
          sample_type: samples.sample_type,
          source_stage: samples.source_stage,
          line_id: samples.line_id,
          equipment_id: samples.equipment_id,
          shift_id: samples.shift_id,
          status: samples.status,
          priority: samples.priority,
          created_at: samples.created_at,
          technician_id: samples.technician_id,
          test_count: sql<number>`count(${tests.id})::int`,
        })
        .from(samples)
        .leftJoin(tests, eq(samples.id, tests.sample_id))
        .groupBy(samples.id)
        .orderBy(
          sql`CASE ${samples.priority}
            WHEN 'STAT'   THEN 1
            WHEN 'HIGH'   THEN 2
            WHEN 'NORMAL' THEN 3
            ELSE 4
          END ASC`,
          desc(samples.created_at),
        );
      return results;
    } catch (error: any) {
      if (error.message === "Database not connected") {
        return [
          {
            id: 1,
            batch_id: "BT-2026-001",
            sample_type: "Raw sugar",
            source_stage: "Raw Handling",
            priority: "STAT",
            status: "PENDING",
            created_at: new Date().toISOString(),
            test_count: 2,
          },
          {
            id: 2,
            batch_id: "BT-2026-002",
            sample_type: "Polish liquor",
            source_stage: "Evaporation",
            priority: "HIGH",
            status: "TESTING",
            created_at: new Date(Date.now() - 3_600_000).toISOString(),
            test_count: 3,
          },
          {
            id: 3,
            batch_id: "BT-2026-003",
            sample_type: "White sugar",
            source_stage: "Crystallization",
            priority: "NORMAL",
            status: "COMPLETED",
            created_at: new Date(Date.now() - 7_200_000).toISOString(),
            test_count: 4,
          },
        ];
      }
      throw error;
    }
  },

  async findById(id: number): Promise<any | undefined> {
    try {
      const result = await dbOrm.select().from(samples).where(eq(samples.id, id)).limit(1);
      return result[0] || undefined;
    } catch (error: any) {
      if (error.message === "Database not connected") {
        return {
          id,
          batch_id: `BT-2026-00${id}`,
          sample_type: "Raw sugar",
          source_stage: "Raw Handling",
          priority: "NORMAL",
          status: "PENDING",
          created_at: new Date().toISOString(),
          technician_id: "ADMIN",
        };
      }
      throw error;
    }
  },

  async create(data: SampleData & { technician_id: string }): Promise<number> {
    try {
      const result = await dbOrm
        .insert(samples)
        .values({
          batch_id: data.batch_id ?? undefined,
          sample_type: data.sample_type ?? undefined,
          source_stage: data.source_stage ?? undefined,
          priority: data.priority ?? "NORMAL",
          technician_id: data.technician_id,
          line_id: data.line_id ?? undefined,
          equipment_id: data.equipment_id ?? undefined,
          shift_id: data.shift_id ?? undefined,
        } as any)
        .returning({ id: samples.id });
      return result[0].id;
    } catch (error: any) {
      if (error.message === "Database not connected") return Math.floor(Math.random() * 1000) + 100;
      throw error;
    }
  },

  async update(id: number, data: Partial<SampleData>): Promise<void> {
    if (Object.keys(data).length === 0) return;
    try {
      await dbOrm
        .update(samples)
        .set(data as any)
        .where(eq(samples.id, id));
    } catch (error: any) {
      if (error.message === "Database not connected") return;
      throw error;
    }
  },

  async findPreviousResults(stage: string, testType: string, limit: number): Promise<TestResultSummary[]> {
    try {
      const results = await dbOrm
        .select({
          raw_value: tests.raw_value,
          performed_at: tests.performed_at,
          batch_id: samples.batch_id,
        })
        .from(tests)
        .innerJoin(samples, eq(tests.sample_id, samples.id))
        .where(
          and(eq(samples.source_stage, stage), eq(tests.test_type, testType), eq(tests.status, "COMPLETED")),
        )
        .orderBy(desc(tests.performed_at))
        .limit(limit);
      return results as any;
    } catch (error: any) {
      if (error.message === "Database not connected") return [];
      throw error;
    }
  },

  async findTestsBySampleId(sampleId: number): Promise<SampleTest[]> {
    try {
      const results = await dbOrm
        .select()
        .from(tests)
        .where(eq(tests.sample_id, sampleId))
        .orderBy(asc(tests.id));
      return results as any;
    } catch (error: any) {
      if (error.message === "Database not connected") {
        return [
          { id: 101, sample_id: sampleId, test_type: "Pol", status: "PENDING" },
          {
            id: 102,
            sample_id: sampleId,
            test_type: "Moisture",
            status: "COMPLETED",
          },
        ] as any;
      }
      throw error;
    }
  },
};
