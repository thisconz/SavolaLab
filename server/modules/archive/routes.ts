import { Hono } from "hono";
import { ArchiveService } from "./service";
import { authenticateToken } from "../../core/middleware";

const app = new Hono();

/**
 * Shared query type (extend per route if needed)
 */
type ArchiveQuery = {
  from_date?: string;
  to_date?: string;
  limit?: string;
  offset?: string;
  [key: string]: any;
};

/**
 * Route factory (removes duplication)
 */
function createArchiveRoute(
  path: string,
  serviceFn: (query: ArchiveQuery) => any,
) {
  app.get(path, authenticateToken, async (c) => {
    try {
      const query = c.req.query();
      const result = await serviceFn(query);
      return c.json({ success: true, data: result });
    } catch (err: any) {
      console.error(`Archive route error [${path}]:`, err);
      return c.json(
        { success: false, error: err.message || "Internal Server Error" },
        500,
      );
    }
  });
}

/**
 * Routes
 */
createArchiveRoute("/samples", ArchiveService.searchSamples);
createArchiveRoute("/tests", ArchiveService.searchTests);
createArchiveRoute("/certificates", ArchiveService.searchCertificates);
createArchiveRoute("/instruments", ArchiveService.searchInstruments);
createArchiveRoute("/audit", ArchiveService.searchAuditLogs);

export default app;
