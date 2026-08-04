import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PLAN_LABELS } from "@/lib/registration-shared";
import {
  PlatformHeader,
  PlatformPanel,
  usePlatformGuard,
} from "@/components/platform/primitives";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/platform/subscriptions")({
  head: () => ({
    meta: [
      { title: "Subscriptions & Plans · EduSom Console" },
      {
        name: "description",
        content: "Track every school subscription, plan tier and billing status across EduSom.",
      },
      { property: "og:title", content: "Subscriptions & Plans · EduSom Console" },
      {
        property: "og:description",
        content: "Plan tiers and billing status for every school on the EduSom platform.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SubscriptionsPage,
});

const PLAN_PRICING: Record<string, number> = {
  starter: 49,
  professional: 149,
  enterprise: 399,
};

function SubscriptionsPage() {
  const { isSuper } = usePlatformGuard();
  const { data, isLoading } = useQuery({
    queryKey: ["platform-subscriptions"],
    enabled: isSuper,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schools")
        .select("id, name, school_code, plan, subscription_status, is_active, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const rows = data ?? [];
  const byPlan = ["starter", "professional", "enterprise"].map((p) => ({
    plan: p,
    count: rows.filter((r) => r.plan === p).length,
    mrr: rows.filter((r) => r.plan === p && r.subscription_status === "active").length *
      (PLAN_PRICING[p] ?? 0),
  }));

  return (
    <div className="space-y-6">
      <PlatformHeader
        icon={CreditCard}
        title="Subscription & Plans"
        description="Plan distribution and billing status for every tenant on the platform."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {byPlan.map((p) => (
          <PlatformPanel key={p.plan}>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {PLAN_LABELS[p.plan] ?? p.plan}
            </p>
            <p className="mt-2 text-2xl font-bold text-foreground">{p.count} schools</p>
            <p className="mt-1 text-xs text-muted-foreground">
              ${p.mrr.toLocaleString()} MRR · ${PLAN_PRICING[p.plan]}/mo list price
            </p>
          </PlatformPanel>
        ))}
      </div>

      <PlatformPanel title="All subscriptions" description="Sorted by newest tenant">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>School</TableHead>
                  <TableHead>School ID</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Since</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                      No subscriptions yet.
                    </TableCell>
                  </TableRow>
                )}
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="font-mono text-xs">{r.school_code ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{PLAN_LABELS[r.plan] ?? r.plan}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={r.subscription_status === "active" ? "default" : "outline"}
                        className={r.subscription_status === "active" ? "bg-gradient-primary" : ""}
                      >
                        {r.subscription_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </PlatformPanel>
    </div>
  );
}
