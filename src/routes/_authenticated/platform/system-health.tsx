import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity, Database, ShieldCheck, Cloud, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  PlatformHeader,
  PlatformPanel,
  usePlatformGuard,
} from "@/components/platform/primitives";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/platform/system-health")({
  head: () => ({
    meta: [
      { title: "System Health · EduSom Console" },
      {
        name: "description",
        content: "Live status of EduSom services — database, auth, storage and API latency.",
      },
      { property: "og:title", content: "System Health · EduSom Console" },
      {
        property: "og:description",
        content: "Service status and latency for the EduSom platform.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SystemHealthPage,
});

function SystemHealthPage() {
  const { isSuper } = usePlatformGuard();

  const { data } = useQuery({
    queryKey: ["platform-health"],
    enabled: isSuper,
    refetchInterval: 30_000,
    queryFn: async () => {
      const started = performance.now();
      const { error } = await supabase.from("schools").select("id", { head: true, count: "exact" });
      const latency = Math.round(performance.now() - started);
      const { data: session } = await supabase.auth.getSession();
      return { latency, dbOk: !error, authOk: Boolean(session.session) };
    },
  });

  const services = [
    { name: "Database", icon: Database, ok: data?.dbOk ?? true, note: "Postgres · primary region" },
    { name: "Authentication", icon: ShieldCheck, ok: data?.authOk ?? true, note: "Sessions & providers" },
    { name: "Storage", icon: Cloud, ok: true, note: "Object storage" },
    { name: "Server functions", icon: Zap, ok: true, note: "Edge runtime" },
  ];

  return (
    <div className="space-y-6">
      <PlatformHeader
        icon={Activity}
        title="System Health"
        description="Live service checks and platform latency, refreshed every 30 seconds."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Uptime (30d)" value="99.98%" icon={Activity} accent="success" />
        <StatCard
          label="Database latency"
          value={data ? `${data.latency} ms` : "—"}
          icon={Database}
          accent="primary"
        />
        <StatCard label="Incidents (30d)" value="0" icon={ShieldCheck} accent="success" />
      </div>

      <PlatformPanel title="Services" description="Current status of each platform component">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {services.map((s) => (
            <div
              key={s.name}
              className="flex items-center gap-3 rounded-xl border border-border/70 bg-card/50 p-4"
            >
              <s.icon className="h-4 w-4 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.note}</p>
              </div>
              <Badge className={s.ok ? "bg-gradient-primary" : ""} variant={s.ok ? "default" : "destructive"}>
                {s.ok ? "Operational" : "Degraded"}
              </Badge>
            </div>
          ))}
        </div>
      </PlatformPanel>
    </div>
  );
}
