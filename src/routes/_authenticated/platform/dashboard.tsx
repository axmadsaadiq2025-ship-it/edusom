import { createFileRoute, Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Building2,
  ClipboardList,
  GraduationCap,
  UserSquare2,
  Users,
  Wallet,
  CreditCard,
  Activity,
  ShieldCheck,
  LifeBuoy,
  ArrowRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  PlatformHeader,
  PlatformPanel,
  usePlatformGuard,
} from "@/components/platform/primitives";
import {
  usePlatformMetrics,
  useRevenueSeries,
  useSchoolGrowth,
} from "@/components/platform/use-platform-metrics";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/platform/dashboard")({
  head: () => ({
    meta: [
      { title: "Platform Overview · EduSom Console" },
      {
        name: "description",
        content:
          "EduSom platform admin console — schools, subscriptions, revenue and system health across the whole network.",
      },
      { property: "og:title", content: "Platform Overview · EduSom Console" },
      {
        property: "og:description",
        content: "Manage every school, subscription and platform metric from one console.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlatformOverview,
});

function PlatformOverview() {
  const { isSuper } = usePlatformGuard();
  const { data: m, isLoading } = usePlatformMetrics(isSuper);
  const { data: revenue } = useRevenueSeries(isSuper);
  const { data: growth } = useSchoolGrowth(isSuper);

  const money = (n: number) =>
    `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-8">
      <PlatformHeader
        icon={LayoutDashboard}
        title="Platform Overview"
        description="Everything happening across the EduSom network — requests, schools, people, revenue and health."
        action={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link to="/schools">
                <Building2 className="mr-2 h-4 w-4" /> Schools
              </Link>
            </Button>
            <Button asChild className="bg-gradient-primary shadow-glow">
              <Link to="/registration-requests">
                <ClipboardList className="mr-2 h-4 w-4" /> Requests
                {m && m.pendingRequests > 0 && (
                  <Badge className="ml-2 bg-primary-foreground/20">{m.pendingRequests}</Badge>
                )}
              </Link>
            </Button>
          </div>
        }
      />

      {isLoading || !m ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Pending Requests"
              value={String(m.pendingRequests)}
              icon={ClipboardList}
              trend="Awaiting approval"
              accent={m.pendingRequests > 0 ? "warning" : "success"}
            />
            <StatCard
              label="Total Schools"
              value={String(m.totalSchools)}
              icon={Building2}
              trend="All tenants"
              accent="primary"
            />
            <StatCard
              label="Active Schools"
              value={String(m.activeSchools)}
              icon={ShieldCheck}
              trend="Currently enabled"
              accent="success"
            />
            <StatCard
              label="Trial Schools"
              value={String(m.trialSchools)}
              icon={CreditCard}
              trend="On trial subscription"
              accent="warning"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total Students"
              value={m.totalStudents.toLocaleString()}
              icon={GraduationCap}
              trend="Network wide"
              accent="primary"
            />
            <StatCard
              label="Total Teachers"
              value={m.totalTeachers.toLocaleString()}
              icon={UserSquare2}
              trend="Network wide"
              accent="success"
            />
            <StatCard
              label="Total Users"
              value={m.totalUsers.toLocaleString()}
              icon={Users}
              trend="Platform accounts"
              accent="primary"
            />
            <StatCard
              label="Monthly Revenue"
              value={money(m.monthlyRevenue)}
              icon={Wallet}
              trend="Collected this month"
              accent="success"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Active Subscriptions"
              value={String(m.activeSubscriptions)}
              icon={CreditCard}
              trend="Billing healthy"
              accent="primary"
            />
            <StatCard
              label="System Uptime"
              value={m.uptime}
              icon={Activity}
              trend="Last 30 days"
              accent="success"
            />
            <StatCard
              label="Open Support Tickets"
              value={String(m.openTickets)}
              icon={LifeBuoy}
              trend="Needs a reply"
              accent={m.openTickets > 0 ? "warning" : "success"}
            />
            <StatCard
              label="Platform Health"
              value="Operational"
              icon={ShieldCheck}
              trend="All services green"
              accent="success"
            />
          </div>
        </>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <PlatformPanel
          title="Revenue trend"
          description="Payments collected across all schools"
          className="lg:col-span-2"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenue ?? []}>
                <defs>
                  <linearGradient id="platRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.53 0.22 292)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="oklch(0.53 0.22 292)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="oklch(0.53 0.22 292)"
                  strokeWidth={2}
                  fill="url(#platRev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </PlatformPanel>

        <PlatformPanel title="New schools" description="Onboarded per month">
          <div className="h-64">
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
                <Bar dataKey="schools" fill="oklch(0.72 0.18 305)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </PlatformPanel>
      </div>

      <PlatformPanel title="Quick actions" description="Jump straight into platform operations">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { to: "/registration-requests", label: "Review registration requests", icon: ClipboardList },
            { to: "/schools", label: "Manage schools", icon: Building2 },
            { to: "/platform/subscriptions", label: "Subscriptions & plans", icon: CreditCard },
            { to: "/platform/revenue", label: "Revenue & payments", icon: Wallet },
            { to: "/platform/users", label: "Users & roles", icon: Users },
            { to: "/platform/system-health", label: "System health", icon: Activity },
          ].map((a) => (
            <Link
              key={a.to}
              to={a.to}
              className="group flex items-center gap-3 rounded-xl border border-border/70 bg-card/50 p-4 transition-colors hover:border-primary/40 hover:bg-accent"
            >
              <a.icon className="h-4 w-4 text-primary" />
              <span className="flex-1 text-sm font-medium text-foreground">{a.label}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </PlatformPanel>
    </div>
  );
}
