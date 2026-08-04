import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  PlatformHeader,
  PlatformPanel,
  usePlatformGuard,
} from "@/components/platform/primitives";
import {
  usePlatformMetrics,
  useSchoolGrowth,
} from "@/components/platform/use-platform-metrics";
import { PLAN_LABELS } from "@/lib/registration-shared";

export const Route = createFileRoute("/_authenticated/platform/analytics")({
  head: () => ({
    meta: [
      { title: "Platform Analytics · EduSom Console" },
      {
        name: "description",
        content: "Adoption, plan mix and network composition analytics for the EduSom platform.",
      },
      { property: "og:title", content: "Platform Analytics · EduSom Console" },
      {
        property: "og:description",
        content: "Network-wide adoption and plan mix analytics for EduSom.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AnalyticsPage,
});

const COLORS = [
  "oklch(0.53 0.22 292)",
  "oklch(0.72 0.18 305)",
  "oklch(0.62 0.16 250)",
  "oklch(0.78 0.14 200)",
];

function AnalyticsPage() {
  const { isSuper } = usePlatformGuard();
  const { data: m } = usePlatformMetrics(isSuper);
  const { data: growth } = useSchoolGrowth(isSuper, 12);

  const planMix = ["starter", "professional", "enterprise"].map((p) => ({
    name: PLAN_LABELS[p] ?? p,
    value: (growth?.schools ?? []).filter((s: any) => s.plan === p).length,
  }));

  const composition = [
    { name: "Students", value: m?.totalStudents ?? 0 },
    { name: "Teachers", value: m?.totalTeachers ?? 0 },
    { name: "Other users", value: Math.max((m?.totalUsers ?? 0) - (m?.totalTeachers ?? 0), 0) },
  ];

  return (
    <div className="space-y-6">
      <PlatformHeader
        icon={BarChart3}
        title="Platform Analytics"
        description="How the EduSom network is growing — adoption, plan mix and user composition."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PlatformPanel title="Plan mix" description="Schools per subscription tier">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={planMix} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100}>
                  {planMix.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </PlatformPanel>

        <PlatformPanel title="Network composition" description="People on the platform">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={composition}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="value" fill="oklch(0.72 0.18 305)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </PlatformPanel>
      </div>

      <PlatformPanel title="School onboarding" description="New tenants per month (12 months)">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={growth?.buckets ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={11} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="schools" fill="oklch(0.53 0.22 292)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </PlatformPanel>
    </div>
  );
}
