import { describe as d2, it as it2, expect as e2, expect } from "vitest";
import { buildQuery } from "../../server/modules/archive/service";
 
d2("buildQuery — FIX #07 placeholder ordering", () => {
 
  const sampleConfig = {
    baseSql: "SELECT * FROM samples WHERE 1=1",
    defaultOrder: "ORDER BY created_at DESC",
    filters: {
      batch_id:   (v: any) => ({ clause: "batch_id ILIKE ?",     params: [`${v}%`]   }),
      status:     (v: any) => ({ clause: "status = ?",           params: [v]         }),
      start_date: (v: any) => ({ clause: "created_at >= ?",      params: [v]         }),
      end_date:   (v: any) => ({ clause: "created_at <= ?",      params: [v]         }),
    },
  };
 
  it2("single filter produces $1 for param, $2/$3 for LIMIT/OFFSET", () => {
    const { sql, params } = buildQuery(sampleConfig, { batch_id: "BT-001", limit: "10", offset: "0" });
    expect(sql).toContain("batch_id ILIKE $1");
    expect(sql).toContain("LIMIT $2");
    expect(sql).toContain("OFFSET $3");
    expect(params[0]).toBe("BT-001%");
    expect(params[1]).toBe(10);
    expect(params[2]).toBe(0);
  });
 
  it2("multiple filters produce sequential $N placeholders", () => {
    const { sql, params } = buildQuery(sampleConfig, {
      batch_id:   "BT-001",
      status:     "COMPLETED",
      start_date: "2026-01-01",
      limit:      "50",
      offset:     "0",
    });
    expect(sql).toContain("$1");
    expect(sql).toContain("$2");
    expect(sql).toContain("$3");
    expect(sql).toContain("LIMIT $4");
    expect(sql).toContain("OFFSET $5");
    expect(params.length).toBe(5);
    expect(params[0]).toBe("BT-001%");
    expect(params[1]).toBe("COMPLETED");
    expect(params[2]).toBe("2026-01-01");
  });
 
  it2("no filters just has LIMIT/OFFSET as $1 and $2", () => {
    const { sql, params } = buildQuery(sampleConfig, { limit: "25", offset: "5" });
    expect(sql).toContain("LIMIT $1");
    expect(sql).toContain("OFFSET $2");
    expect(params).toEqual([25, 5]);
  });
 
  it2("empty string values are ignored (not treated as active filters)", () => {
    const { sql, params } = buildQuery(sampleConfig, {
      batch_id: "",   // empty — should be ignored
      status:   "PENDING",
      limit:    "10",
      offset:   "0",
    });
    expect(sql).not.toContain("batch_id");
    expect(sql).toContain("status = $1");
    expect(params[0]).toBe("PENDING");
    expect(params.length).toBe(3);
  });
 
});
 