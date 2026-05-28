import { cache } from "react";
import { lasolutionFetchJson } from "@/lib/lasolution-api";

export type AdminStats = {
  revenue: number;
  totalOrders: number;
  byStatus: Record<string, number>;
  totalClients: number;
  totalSolupackers: number;
  totalRelais: number;
  pendingTestimonials?: number;
};

const EMPTY_STATS: AdminStats = {
  revenue: 0,
  totalOrders: 0,
  byStatus: {},
  totalClients: 0,
  totalSolupackers: 0,
  totalRelais: 0,
  pendingTestimonials: 0,
};

/** Stats admin — dédupliqué par requête SSR (layout + pages dashboard). */
export const getAdminStats = cache(async (): Promise<AdminStats> => {
  try {
    return await lasolutionFetchJson<AdminStats>("/admin/stats");
  } catch {
    return { ...EMPTY_STATS };
  }
});
