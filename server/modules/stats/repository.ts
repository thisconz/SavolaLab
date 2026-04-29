import { dbOrm } from "../../core/db/orm";
import { statRequests } from "../../core/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export const StatRepository = {
  findAll: async () => {
    try {
      const results = await dbOrm
        .select()
        .from(statRequests)
        .orderBy(
          sql`CASE ${statRequests.urgency}
            WHEN 'CRITICAL' THEN 1
            WHEN 'HIGH' THEN 2
            ELSE 3
          END ASC`,
          desc(statRequests.created_at),
        );
      return results as any;
    } catch (error: any) {
      if (error.message === "Database not connected") return [];
      throw error;
    }
  },

  create: async (data: any) => {
    const rows = await dbOrm
      .insert(statRequests)
      .values({
        department: data.department,
        reason: data.reason || "",
        urgency: data.urgency || "NORMAL",
        status: "OPEN",
      })
      .returning({ id: statRequests.id });
    return rows[0].id;
  },

  updateStatus: async (id: number, status: string) => {
    await dbOrm.update(statRequests).set({ status }).where(eq(statRequests.id, id));
  },
};
