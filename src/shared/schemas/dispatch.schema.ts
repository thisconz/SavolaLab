import { z } from "zod";

export const DispatchDataSchema = z.object({
  activeBatches: z.number(),
  pendingShipments: z.number(),
  recentDispatches: z.array(z.any()),
});

export const GetDispatchResponseSchema = z.object({
  success: z.boolean(),
  data: DispatchDataSchema,
});
