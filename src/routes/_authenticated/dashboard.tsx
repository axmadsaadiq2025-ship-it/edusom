import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import {
  Users,
  GraduationCap,
  UserSquare2,
  ClipboardCheck,
  Wallet,
  AlertCircle,
  CalendarDays,
  Activity,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import { useAuth } from "@/hooks/use-auth";
import { isSuperAdmin, roleLabel } from "@/lib/roles";
import { StatCard } from "@/components/dashboard/stat-card";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

const attendanceData = [
  { day: "Mon", present: 0 },
  { day: "Tue", present: 0 },
  { day: "Wed", present: 0 },
  { day: "Thu", present: 0 },
  { day: "Fri", present: 0 },
];

const feesData = [
  { month: "Jan", collected: 0 },
  { month: "Feb", collected: 0 },
  { month: "Mar", collected: 0 },
  { month: "Apr", collected: 0 },
  { month: "May", collected: 0 },
  { month: "Jun", collected: 0 },
];

function DashboardPage() {
  const { profile, roles, user, loading } = useAuth();
  const navigate = useNavigate();
  const isSuper = isSuperAdmin(roles, user?.email);

  // Super Admins manage the whole platform, not a single school.
  useEffect(() => {
    if (!loading && isSuper) navigate({ to: "/platform/dashboard", replace: true });
  }, [loading, isSuper, navigate]);

  const primary = roles[0];
  const name = profile?.full_name?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "there";

  if (loading || (user && roles.length === 0 && !profile) || isSuper) return null;


  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
            Welcome back, {name} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {primary
              ? `You're signed in as ${roleLabel(primary)}.`
              : "Your account is ready — a Super Admin will assign your role shortly."}
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Students"
          value="0"
          icon={GraduationCap}
          trend="Coming in Phase 3"
          accent="primary"
        />
        <StatCard
          label="Total Teachers"
          value="0"
          icon={UserSquare2}
          trend="Coming in Phase 4"
          accent="success"
        />
        <StatCard
          label="Total Staff"
          value="0"
          icon={Users}
          trend="—"
          accent="warning"
        />
        <StatCard
          label="Today's Attendance"
          value="—"
          icon={ClipboardCheck}
          trend="Awaiting data"
          accent="primary"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Collected Fees"
          value="$0"
          icon={Wallet}
          trend="This term"
          accent="success"
        />
        <StatCard
          label="Outstanding Fees"
          value="$0"
          icon={AlertCircle}
          trend="0 invoices"
          accent="destructive"
        />
        <StatCard
          label="Upcoming Exams"
          value="0"
          icon={CalendarDays}
          trend="Next 30 days"
          accent="primary"
        />
        <StatCard
          label="Recent Activities"
          value="0"
          icon={Activity}
          trend="Last 24h"
          accent="success"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="glass rounded-2xl p-6 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Weekly Attendance
              </h3>
              <p className="text-xs text-muted-foreground">
                Students present per weekday
              </p>
            </div>
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceData}>
                <defs>
                  <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="oklch(0.53 0.22 292)"
                      stopOpacity={0.4}
                    />
                    <stop
                      offset="100%"
                      stopColor="oklch(0.53 0.22 292)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={12} />
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
                  dataKey="present"
                  stroke="oklch(0.53 0.22 292)"
                  strokeWidth={2}
                  fill="url(#attGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-foreground">Fees Collected</h3>
            <p className="text-xs text-muted-foreground">Last 6 months</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={feesData}>
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
                <Bar dataKey="collected" fill="oklch(0.72 0.18 305)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Activity + notifications */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="glass rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-semibold text-foreground">Recent Activities</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Audit trail of user actions
          </p>
          <div className="mt-8 flex flex-col items-center justify-center py-8 text-center">
            <div className="bg-gradient-primary shadow-glow flex h-12 w-12 items-center justify-center rounded-2xl">
              <Activity className="h-5 w-5 text-primary-foreground" />
            </div>
            <p className="mt-4 text-sm font-medium text-foreground">
              No activities yet
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Activity will appear here once modules are in use.
            </p>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-semibold text-foreground">Notifications</h3>
          <p className="mt-1 text-xs text-muted-foreground">System messages and alerts</p>
          <div className="mt-4 space-y-3">
            <NotificationRow
              title="Welcome to EduSom Cloud"
              body="Phase 1 (Authentication) is live. Modules will roll out in phases."
              tone="primary"
            />
            <NotificationRow
              title="Set up your school profile"
              body="A Super Admin can create schools and invite the first users."
              tone="warning"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationRow({
  title,
  body,
  tone,
}: {
  title: string;
  body: string;
  tone: "primary" | "warning";
}) {
  const dotClass = tone === "primary" ? "bg-primary" : "bg-warning";
  return (
    <div className="flex gap-3 rounded-xl border border-border/70 bg-card/50 p-3">
      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dotClass}`} />
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}
