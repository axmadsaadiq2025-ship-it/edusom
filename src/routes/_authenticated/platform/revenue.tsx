import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Wallet } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import {
  PlatformHeader,
  PlatformPanel,
  usePlatformGuard,
} from "@/components/platform/primitives";
import { useRevenueSeries } from "@/components/platform/use-platform-metrics";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/platform/revenue")({
  head: () => ({
    meta: [
      { title: "Revenue & Payments · EduSom Console" },
      {
        name: "description",
        content: "Platform-wide revenue, collections and the latest payments across all EduSom schools.",
      },
      { property: "og:title", content: "Revenue & Payments · EduSom Console" },
      {
        property: "og:description",
        content: "Monitor collections and payment activity across the EduSom network.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RevenuePage,
});

function RevenuePage() {
  const { isSuper } = usePlatformGuard();
  const { data: series } = useRevenueSeries(isSuper, 12);

  const { data: payments } = useQuery({
    queryKey: ["platform-payments"],
    enabled: isSuper,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fee_payments")
        .select("id, amount, method, reference, paid_at")
        .order("paid_at", { ascending: false })
        .limit(25);
      if (error) throw error;
      return data ?? [];
    },
  });

  const total = (series ?? []).reduce((s, b) => s + b.revenue, 0);
  const thisMonth = series?.[series.length - 1]?.revenue ?? 0;
  const avg = series && series.length ? total / series.length : 0;
  const money = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-6">
      <PlatformHeader
        icon={Wallet}
        title="Revenue & Payments"
        description="Collections recorded by every school, aggregated for the platform."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Last 12 months" value={money(total)} icon={Wallet} accent="primary" />
        <StatCard label="This month" value={money(thisMonth)} icon={Wallet} accent="success" />
        <StatCard label="Monthly average" value={money(avg)} icon={Wallet} accent="warning" />
      </div>

      <PlatformPanel title="Monthly collections" description="Rolling 12 months">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="revenue" fill="oklch(0.53 0.22 292)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </PlatformPanel>

      <PlatformPanel title="Latest payments" description="Most recent 25 transactions">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(payments ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                    No payments recorded yet.
                  </TableCell>
                </TableRow>
              )}
              {(payments ?? []).map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="text-xs">
                    {new Date(p.paid_at as string).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{String(p.method).replace("_", " ")}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{p.reference ?? "—"}</TableCell>
                  <TableCell className="text-right font-medium">
                    ${Number(p.amount).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </PlatformPanel>
    </div>
  );
}
