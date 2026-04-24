import { db } from "../../core/db/client";
import { dbOrm } from "../../core/db/orm";
import { tests } from "../../core/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export const TestRepository = {
  findAll: async () => {
    try {
      const results = await dbOrm
        .select()
        .from(tests)
        .orderBy(desc(sql`COALESCE(${tests.performed_at}, ${tests.updated_at})`));
      return results as any;
    } catch (err: any) {
      if (err.message === "Database not connected") {
        return [
          {
            id: 1,
            sample_id: 1,
            test_type: "Pol",
            raw_value: 98.5,
            calculated_value: 98.5,
            unit: "%",
            status: "COMPLETED",
            performed_at: new Date().toISOString(),
          },
          {
            id: 2,
            sample_id: 2,
            test_type: "Moisture",
            raw_value: 0.15,
            calculated_value: 0.15,
            unit: "%",
            status: "PENDING",
            performed_at: new Date(Date.now() - 3_600_000).toISOString(),
          },
          {
            id: 3,
            sample_id: 3,
            test_type: "Colour",
            raw_value: 120,
            calculated_value: 120,
            unit: "IU",
            status: "COMPLETED",
            performed_at: new Date(Date.now() - 7_200_000).toISOString(),
          },
        ];
      }
      throw err;
    }
  },

  findById: async (id: string | number) => {
    try {
      const results = await dbOrm
        .select()
        .from(tests)
        .where(eq(tests.id, Number(id)))
        .limit(1);
      return results[0] || null;
    } catch (err: any) {
      if (err.message === "Database not connected") return null;
      throw err;
    }
  },

  create: async (tx: any, data: any): Promise<number> => {
    const paramsStr = data.params != null
      ? typeof data.params === "string"
        ? data.params
        : JSON.stringify(data.params)
      : null;

    // Use tx (which is assumed to either be a Drizzle transaction, or fallback to raw client)
    // Actually we will use raw client for 'tx' because the service uses db.transaction which yields raw sql client. 
    // We will incrementally move transaction to dbOrm when possible. 
    // To support `tx` as a raw sql client for now:
    if (tx && tx.query) {
      const rows = (await tx.query(
        `INSERT INTO tests
           (sample_id, test_type, raw_value, calculated_value, unit,
            status, performed_at, performer_id, reviewer_id,
            review_at, review_comment, notes, params)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         RETURNING id`,
        [
          data.sample_id,
          data.test_type,
          data.raw_value ?? null,
          data.calculated_value ?? null,
          data.unit ?? null,
          data.status ?? "PENDING",
          data.performed_at ?? null,
          data.performer_id ?? null,
          data.reviewer_id ?? null,
          data.review_at ?? null,
          data.review_comment ?? null,
          data.notes ?? null,
          paramsStr,
        ],
      )) as Array<{ id: number }>;
  
      if (!rows[0]?.id) throw new Error("INSERT tests did not return an id");
      return rows[0].id;
    }

    // fallback if no tx interface
    const rows = await dbOrm
      .insert(tests)
      .values({
        sample_id: data.sample_id,
        test_type: data.test_type,
        raw_value: data.raw_value ?? null,
        calculated_value: data.calculated_value ?? null,
        unit: data.unit ?? null,
        status: data.status ?? "PENDING",
        performed_at: data.performed_at ? new Date(data.performed_at) : null,
        performer_id: data.performer_id ?? null,
        reviewer_id: data.reviewer_id ?? null,
        review_at: data.review_at ? new Date(data.review_at) : null,
        review_comment: data.review_comment ?? null,
        notes: data.notes ?? null,
        params: paramsStr,
      } as any)
      .returning({ id: tests.id });

    if (!rows[0]?.id) throw new Error("INSERT tests did not return an id");
    return rows[0].id;
  },

  update: async (tx: any, id: string | number, data: any): Promise<void> => {
    const paramsStr = data.params != null
      ? typeof data.params === "string"
        ? data.params
        : JSON.stringify(data.params)
      : null;

    if (tx && tx.query) {
      await tx.query(
        `UPDATE tests
         SET raw_value        = $1,
             calculated_value = $2,
             status           = $3,
             notes            = $4,
             params           = $5,
             updated_at       = CURRENT_TIMESTAMP
         WHERE id = $6`,
        [
          data.raw_value ?? null,
          data.calculated_value ?? null,
          data.status ?? "PENDING",
          data.notes ?? null,
          paramsStr,
          Number(id),
        ],
      );
      return;
    }
    
    await dbOrm
      .update(tests)
      .set({
        raw_value: data.raw_value ?? null,
        calculated_value: data.calculated_value ?? null,
        status: data.status ?? "PENDING",
        notes: data.notes ?? null,
        params: paramsStr,
        updated_at: sql`CURRENT_TIMESTAMP`,
      } as any)
      .where(eq(tests.id, Number(id)));
  },

  review: async (id: string | number, data: any): Promise<void> => {
    await dbOrm
      .update(tests)
      .set({
        status: data.status,
        reviewer_id: data.reviewer_id,
        review_at: data.review_at ? new Date(data.review_at) : null,
        review_comment: data.review_comment ?? null,
        updated_at: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(tests.id, Number(id)));
  },
};
