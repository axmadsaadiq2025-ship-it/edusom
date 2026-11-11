import { createFileRoute } from "@tanstack/react-router";

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
  BarChart3,
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
import { roleLabel } from "@/lib/roles";
import { StatCard } from "@/components/dashboard/stat-card";
import { TrialBanner } from "@/components/dashboard/trial-banner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "School Dashboard | EduSom" },
      { name: "description", content: "View school attendance, fees, activities, and key operational metrics in EduSom." },
      { property: "og:title", content: "School Dashboard | EduSom" },
      { property: "og:description", content: "View school attendance, fees, activities, and key operational metrics in EduSom." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
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

const hasAttendanceData = attendanceData.some((item) => item.present > 0);
const hasFeesData = feesData.some((item) => item.collected > 0);

function DashboardPage() {
  const { profile, roles, user } = Route.useRouteContext();

  const primary = roles[0];
  const name = profile?.full_name?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "there";

  return (
    <div className="space-y-6 sm:space-y-8">
      <TrialBanner />
      {/* Greeting */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 sm:flex sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground sm:text-sm">
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
          <h1 className="font-dashboard-display mt-1 truncate text-2xl font-bold text-foreground sm:text-3xl">
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
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          label="Total Students"
          value="0"
          icon={GraduationCap}
          trend="No students registered yet"
          accent="primary"
        />
        <StatCard
          label="Total Teachers"
          value="0"
          icon={UserSquare2}
          trend="No teachers registered yet"
          accent="success"
        />
        <StatCard
          label="Total Staff"
          value="0"
          icon={Users}
          trend="No staff registered yet"
          accent="warning"
        />
        <StatCard
          label="Today's Attendance"
          value="—"
          icon={ClipboardCheck}
          trend="Attendance will appear here"
          accent="primary"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          label="Collected Fees"
          value="$0"
          icon={Wallet}
          trend="No payments this term"
          accent="success"
        />
        <StatCard
          label="Outstanding Fees"
          value="$0"
          icon={AlertCircle}
          trend="No outstanding invoices"
          accent="destructive"
        />
        <StatCard
          label="Upcoming Exams"
          value="0"
          icon={CalendarDays}
          trend="No exams in the next 30 days"
          accent="primary"
        />
        <StatCard
          label="Recent Activities"
          value="0"
          icon={Activity}
          trend="No activity in the last 24h"
          accent="success"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-border/80 bg-card p-5 shadow-sm sm:p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-dashboard-display text-base font-semibold text-foreground">
                Weekly Attendance
              </h2>
              <p className="text-xs text-muted-foreground">
                Students present per weekday
              </p>
            </div>
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div className="h-56 sm:h-64">
            {hasAttendanceData ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceData}>
                <defs>
                  <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="var(--color-primary)"
                      stopOpacity={0.4}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--color-primary)"
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
                   stroke="var(--color-primary)"
                  strokeWidth={2}
                  fill="url(#attGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
            ) : (
              <ChartEmptyState
                icon={TrendingUp}
                title="No attendance data yet"
                body="Daily attendance totals will appear once records are submitted."
              />
            )}
          </div>
        </section>

        <section className="rounded-xl border border-border/80 bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-4">
            <h2 className="font-dashboard-display text-base font-semibold text-foreground">Fees Collected</h2>
            <p className="text-xs text-muted-foreground">Last 6 months</p>
          </div>
          <div className="h-56 sm:h-64">
            {hasFeesData ? (
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
                <Bar dataKey="collected" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            ) : (
              <ChartEmptyState
                icon={BarChart3}
                title="No fee data yet"
                body="Collections will appear here after the first payment is recorded."
              />
            )}
          </div>
        </section>
      </div>

      {/* Activity + notifications */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border/80 bg-card p-5 shadow-sm sm:p-6">
          <h2 className="font-dashboard-display text-base font-semibold text-foreground">Recent Activities</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Audit trail of user actions
          </p>
          <div className="mt-5 flex min-h-36 flex-col items-center justify-center py-5 text-center sm:mt-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Activity className="h-5 w-5" />
            </div>
            <p className="mt-4 text-sm font-medium text-foreground">
               No recent activity
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Activity will appear here once modules are in use.
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-border/80 bg-card p-5 shadow-sm sm:p-6">
          <h2 className="font-dashboard-display text-base font-semibold text-foreground">Notifications</h2>
          <p className="mt-1 text-xs text-muted-foreground">System messages and alerts</p>
          <div className="mt-4 space-y-3">
            <NotificationRow
              title="Welcome to EduSom Cloud"
              body="Your workspace is ready. Updates and important school alerts will appear here."
              tone="primary"
            />
            <NotificationRow
              title="Set up your school profile"
              body="A Super Admin can create schools and invite the first users."
              tone="warning"
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function ChartEmptyState({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof TrendingUp;
  title: string;
  body: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground" aria-hidden="true">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">{body}</p>
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
    <div className="flex gap-3 rounded-lg border border-border/70 bg-muted/25 p-3 transition-colors duration-200 hover:bg-muted/45">
      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dotClass}`} />
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}
