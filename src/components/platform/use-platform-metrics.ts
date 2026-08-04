import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

async function count(table: string, apply?: (q: any) => any) {
  let q = supabase.from(table as any).select("*", { count: "exact", head: true });
  if (apply) q = apply(q);
  const { count: c, error } = await q;
  if (error) throw error;
  return c ?? 0;
}

export interface PlatformMetrics {
  pendingRequests: number;
  totalSchools: number;
  activeSchools: number;
  trialSchools: number;
  totalStudents: number;
  totalTeachers: number;
  totalUsers: number;
  monthlyRevenue: number;
  activeSubscriptions: number;
  openTickets: number;
  uptime: string;
  currency: string;
}

export function usePlatformMetrics(enabled: boolean) {
  return useQuery({
    queryKey: ["platform-metrics"],
    enabled,
    queryFn: async (): Promise<PlatformMetrics> => {
      const monthStart = new Date();
      monthStart.setDate(1);
      const monthStartIso = monthStart.toISOString().slice(0, 10);

      const [
        pendingRequests,
        totalSchools,
        activeSchools,
        trialSchools,
        totalStudents,
        totalTeachers,
        totalUsers,
        activeSubscriptions,
      ] = await Promise.all([
        count("school_registration_requests", (q) => q.eq("status", "pending")),
        count("schools"),
        count("schools", (q) => q.eq("is_active", true)),
        count("schools", (q) => q.eq("subscription_status", "trial")),
        count("students"),
        count("teachers"),
        count("profiles"),
        count("schools", (q) => q.eq("subscription_status", "active")),
      ]);

      const { data: payments, error: payError } = await supabase
        .from("fee_payments")
        .select("amount, paid_at")
        .gte("paid_at", monthStartIso);
      if (payError) throw payError;
      const monthlyRevenue = (payments ?? []).reduce(
        (sum, p) => sum + Number(p.amount ?? 0),
        0,
      );

      return {
        pendingRequests,
        totalSchools,
        activeSchools,
        trialSchools,
        totalStudents,
        totalTeachers,
        totalUsers,
        monthlyRevenue,
        activeSubscriptions,
        openTickets: 0,
        uptime: "99.98%",
        currency: "USD",
      };
    },
  });
}

export function useRevenueSeries(enabled: boolean, months = 6) {
  return useQuery({
    queryKey: ["platform-revenue", months],
    enabled,
    queryFn: async () => {
      const start = new Date();
      start.setMonth(start.getMonth() - (months - 1));
      start.setDate(1);
      const { data, error } = await supabase
        .from("fee_payments")
        .select("amount, paid_at")
        .gte("paid_at", start.toISOString().slice(0, 10));
      if (error) throw error;

      const buckets: { month: string; revenue: number }[] = [];
      for (let i = 0; i < months; i++) {
        const d = new Date(start);
        d.setMonth(start.getMonth() + i);
        buckets.push({
          month: d.toLocaleDateString(undefined, { month: "short" }),
          revenue: 0,
        });
      }
      for (const p of data ?? []) {
        const d = new Date(p.paid_at as string);
        const idx =
          (d.getFullYear() - start.getFullYear()) * 12 + (d.getMonth() - start.getMonth());
        if (idx >= 0 && idx < buckets.length) {
          buckets[idx]!.revenue += Number(p.amount ?? 0);
        }
      }
      return buckets;
    },
  });
}

export function useSchoolGrowth(enabled: boolean, months = 6) {
  return useQuery({
    queryKey: ["platform-school-growth", months],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schools")
        .select("created_at, plan, subscription_status, is_active");
      if (error) throw error;
      const start = new Date();
      start.setMonth(start.getMonth() - (months - 1));
      start.setDate(1);
      const buckets: { month: string; schools: number }[] = [];
      for (let i = 0; i < months; i++) {
        const d = new Date(start);
        d.setMonth(start.getMonth() + i);
        buckets.push({
          month: d.toLocaleDateString(undefined, { month: "short" }),
          schools: 0,
        });
      }
      for (const s of data ?? []) {
        const d = new Date(s.created_at as string);
        const idx =
          (d.getFullYear() - start.getFullYear()) * 12 + (d.getMonth() - start.getMonth());
        if (idx >= 0 && idx < buckets.length) buckets[idx]!.schools += 1;
      }
      return { buckets, schools: data ?? [] };
    },
  });
}
