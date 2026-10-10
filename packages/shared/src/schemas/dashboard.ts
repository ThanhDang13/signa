import { z } from "zod";

/**
 * Dashboard statistics schema - aggregated data for admin overview
 */
export const dashboardStatsSchema = z.object({
  elections: z.object({
    draft: z.number().int().nonnegative(),
    active: z.number().int().nonnegative(),
    closed: z.number().int().nonnegative(),
    total: z.number().int().nonnegative()
  }),
  scans: z.object({
    today: z.number().int().nonnegative(),
    pending: z.number().int().nonnegative(),
    processing: z.number().int().nonnegative(),
    completed: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
    total: z.number().int().nonnegative()
  }),
  ballots: z.object({
    total: z.number().int().nonnegative(),
    voted: z.number().int().nonnegative()
  }),
  scanTrend: z.array(
    z.object({
      date: z.string(),
      count: z.number().int().nonnegative()
    })
  ),
  recentActivity: z.array(
    z.object({
      id: z.string().uuid(),
      type: z.enum(["scan", "election", "generation"]),
      description: z.string(),
      status: z.string(),
      timestamp: z.string().datetime(),
      electionId: z.string().uuid().optional(),
      electionTitle: z.string().optional()
    })
  )
});

export type DashboardStats = z.infer<typeof dashboardStatsSchema>;
