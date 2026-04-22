import { db } from "../../core/database";

export const DispatchService = {
  getDispatchData: async () => {
    try {
      // Get shipments
      const shipments = await db.query(`
        SELECT * FROM shipments 
        ORDER BY created_at DESC 
        LIMIT 20
      `);

      if (shipments.length === 0) {
        return {
          metrics: {
            pending: 0,
            inTransit: 0,
            delayed: 0,
            critical: 0,
          },
          activeShipments: [],
          qcQueue: [],
        };
      }

      // Calculate metrics
      let pending = 0,
        inTransit = 0,
        delayed = 0,
        critical = 0;
      const activeShipments = shipments.map((s: any) => {
        if (s.status === "Pending" || s.status === "Loading") pending++;
        else if (s.status === "In Transit") inTransit++;
        else if (s.status === "Delayed") delayed++;
        else if (s.status === "Critical") critical++;

        const etaDate = new Date(s.eta);
        const etaStr = isNaN(etaDate.getTime())
          ? "Unknown"
          : `${etaDate.getHours().toString().padStart(2, "0")}:${etaDate.getMinutes().toString().padStart(2, "0")}`;

        return {
          id: s.shipment_id,
          client: s.client_name,
          destination: s.destination,
          status: s.status,
          eta: etaStr,
        };
      });

      // Get QC Queue from samples
      const samples = await db.query(`
        SELECT batch_id, status
        FROM samples
        WHERE status IN ('TESTING', 'COMPLETED')
        ORDER BY created_at DESC
        LIMIT 10
      `);

      const qcQueue = samples.map((s: any) => {
        const isReleased = s.status === "COMPLETED";
        return {
          batch: `Batch #${s.batch_id || "Unknown"}`,
          client: "Internal",
          status: isReleased ? "Released" : "Pending",
          progress: isReleased ? 100 : 80,
          testsCompleted: isReleased ? 5 : 4,
          totalTests: 5,
        };
      });

      return {
        metrics: { pending, inTransit, delayed, critical },
        activeShipments,
        qcQueue,
      };
    } catch (error: any) {
      if (error.message === "Database not connected") {
        return {
          metrics: { pending: 2, inTransit: 1, delayed: 0, critical: 0 },
          activeShipments: [
            {
              id: "SHP-001",
              client: "Acme Corp",
              destination: "New York",
              status: "In Transit",
              eta: "14:00",
            },
            {
              id: "SHP-002",
              client: "Globex",
              destination: "London",
              status: "Pending",
              eta: "16:30",
            },
            {
              id: "SHP-003",
              client: "Initech",
              destination: "Tokyo",
              status: "Loading",
              eta: "18:00",
            },
          ],
          qcQueue: [
            {
              batch: "Batch #B-2026-001",
              client: "Internal",
              status: "Pending",
              progress: 80,
              testsCompleted: 4,
              totalTests: 5,
            },
            {
              batch: "Batch #B-2026-003",
              client: "Internal",
              status: "Released",
              progress: 100,
              testsCompleted: 5,
              totalTests: 5,
            },
          ],
        };
      }
      throw error;
    }
  },
};
