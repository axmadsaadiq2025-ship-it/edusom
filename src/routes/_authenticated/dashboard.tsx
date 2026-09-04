import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import {
  Users,
  GraduationCap,
  UserSquare2,
  BookOpen,
  ClipboardCheck,
  UserMinus,
  Wallet,
  AlertCircle,
  CalendarDays,
  Plus,
  ArrowUpRight,
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
import { supabase } from "@/integrations/supabase/client";
import { roleLabel } from "@/lib/roles";
import { allowedModules, type ModuleKey } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

interface Metrics {
  students: number;
  teachers: number;
  parents: number;
  classes: number;
  presentToday: number;
  absentToday: number;
  collected: number;
  outstanding: number;
  upcomingExams: number;
  weeklyAttendance: { day: string; present: number; absent: number }[];
  monthlyFees: { month: string; collected: number }[];
  enrollment: { name: string; students: number }[];
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

async function count(table: "students" | "teachers" | "parents" | "classes") {
  const { count: c } = await supabase.from(table).select("id", { count: "exact", head: true });
  return c ?? 0;
}

async function loadMetrics(): Promise<Metrics> {
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 6);
  const sixMonthsAgo = new Date(today);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  const in30 = new Date(today);
  in30.setDate(in30.getDate() + 30);

  const [
    students,
    teachers,
    parents,
    classes,
    attendance,
    invoices,
    payments,
    exams,
    enrollmentRows,
    classRows,
  ] = await Promise.all([
    count("students"),
    count("teachers"),
    count("parents"),
    count("classes"),
    supabase
      .from("attendance_records")
      .select("status, attendance_sessions!inner(session_date)")
      .gte("attendance_sessions.session_date", iso(weekAgo))
      .limit(5000),
    supabase.from("fee_invoices").select("total_amount, amount_paid").limit(2000),
    supabase.from("fee_payments").select("amount, paid_at").gte("paid_at", iso(sixMonthsAgo)).limit(2000),
    supabase
      .from("exams")
      .select("id", { count: "exact", head: true })
      .gte("exam_date", iso(today))
      .lte("exam_date", iso(in30)),
    supabase.from("students").select("class_id").eq("status", "active").limit(5000),
    supabase.from("classes").select("id,name").order("name").limit(50),
  ]);

  type AttRow = { status: string; attendance_sessions: { session_date: string } | null };
  const attRows = (attendance.data ?? []) as unknown as AttRow[];

  const byDay = new Map<string, { present: number; absent: number }>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekAgo);
    d.setDate(d.getDate() + i);
    byDay.set(iso(d), { present: 0, absent: 0 });
  }
  let presentToday = 0;
  let absentToday = 0;
  const todayIso = iso(today);
  for (const row of attRows) {
    const date = row.attendance_sessions?.session_date;
    if (!date) continue;
    const bucket = byDay.get(date);
    const present = row.status === "present" || row.status === "late";
    if (bucket) {
      if (present) bucket.present += 1;
      else bucket.absent += 1;
    }
    if (date === todayIso) {
      if (present) presentToday += 1;
      else absentToday += 1;
    }
  }

  const weeklyAttendance = [...byDay.entries()].map(([date, v]) => ({
    day: DAY_LABELS[new Date(date).getDay()] ?? date.slice(5),
    present: v.present,
    absent: v.absent,
  }));

  let billed = 0;
  let collected = 0;
  for (const inv of invoices.data ?? []) {
    billed += Number(inv.total_amount ?? 0);
    collected += Number(inv.amount_paid ?? 0);
  }

  const monthKeys: { key: string; month: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today);
    d.setMonth(d.getMonth() - i);
    monthKeys.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      month: d.toLocaleDateString(undefined, { month: "short" }),
    });
  }
  const monthTotals = new Map(monthKeys.map((m) => [m.key, 0]));
  for (const p of payments.data ?? []) {
    const key = String(p.paid_at ?? "").slice(0, 7);
    if (monthTotals.has(key)) monthTotals.set(key, (monthTotals.get(key) ?? 0) + Number(p.amount ?? 0));
  }
  const monthlyFees = monthKeys.map((m) => ({
    month: m.month,
    collected: monthTotals.get(m.key) ?? 0,
  }));

  const perClass = new Map<string, number>();
  for (const s of enrollmentRows.data ?? []) {
    if (!s.class_id) continue;
    perClass.set(s.class_id, (perClass.get(s.class_id) ?? 0) + 1);
  }
  const enrollment = (classRows.data ?? []).map((c) => ({
    name: c.name,
    students: perClass.get(c.id) ?? 0,
  }));

  return {
    students,
    teachers,
    parents,
    classes,
    presentToday,
    absentToday,
    collected,
    outstanding: Math.max(billed - collected, 0),
    upcomingExams: exams.count ?? 0,
    weeklyAttendance,
    monthlyFees,
    enrollment,
  };
}

function money(n: number) {
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function DashboardPage() {
  const { profile, roles, user } = Route.useRouteContext();
  const modules = allowedModules(roles);
  const can = (m: ModuleKey) => modules.has(m);

  const metricsQ = useQuery({
    queryKey: ["dashboard-metrics", profile?.school_id ?? "none"],
    queryFn: loadMetrics,
    staleTime: 2 * 60_000,
  });

  const m = metricsQ.data;
  const name = profile?.full_name?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "there";
  const primary = roles[0];

  const quickActions = [
    { label: "Add student", to: "/students/new", icon: GraduationCap, module: "students" as ModuleKey },
    { label: "Add parent", to: "/parents/new", icon: Users, module: "parents" as ModuleKey },
    { label: "Add teacher", to: "/teachers/new", icon: UserSquare2, module: "teachers" as ModuleKey },
    { label: "Create class", to: "/classes", icon: BookOpen, module: "classes" as ModuleKey },
    { label: "Record attendance", to: "/attendance/new", icon: ClipboardCheck, module: "attendance" as ModuleKey },
    { label: "Add fee invoice", to: "/fees/new", icon: Wallet, module: "fees" as ModuleKey },
    { label: "Create exam", to: "/exams", icon: CalendarDays, module: "exams" as ModuleKey },
  ].filter((a) => can(a.module));

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Greeting */}
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
          <h1 className="mt-1 truncate text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Welcome back, {name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {primary
              ? `Signed in as ${roleLabel(primary)}.`
              : "Your account is ready — an administrator will assign your role shortly."}
          </p>
        </div>
      </header>

      {/* Quick actions */}
      {quickActions.length > 0 && (
        <section className="glass rounded-2xl p-4 shadow-sm sm:p-5">
          <h2 className="text-sm font-semibold text-foreground">Quick actions</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {quickActions.map((a) => (
              <Button
                key={a.to}
                asChild
                variant="outline"
                size="sm"
                className="h-10 rounded-xl border-border/70 bg-card/60"
              >
                <Link to={a.to}>
                  <Plus className="mr-1.5 h-3.5 w-3.5 text-primary" />
                  {a.label}
                </Link>
              </Button>
            ))}
          </div>
        </section>
      )}

      {/* Stats */}
      {metricsQ.isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {can("students") && (
            <MetricCard
              label="Total students"
              value={m?.students ?? 0}
              icon={GraduationCap}
              to="/students"
              hint="Enrolled learners"
              emptyCta={{ label: "Add student", to: "/students/new" }}
            />
          )}
          {can("teachers") && (
            <MetricCard
              label="Total teachers"
              value={m?.teachers ?? 0}
              icon={UserSquare2}
              to="/teachers"
              hint="Teaching staff"
              accent="success"
              emptyCta={{ label: "Add teacher", to: "/teachers/new" }}
            />
          )}
          {can("parents") && (
            <MetricCard
              label="Total parents"
              value={m?.parents ?? 0}
              icon={Users}
              to="/parents"
              hint="Guardians linked"
              accent="warning"
              emptyCta={{ label: "Add parent", to: "/parents/new" }}
            />
          )}
          {can("classes") && (
            <MetricCard
              label="Total classes"
              value={m?.classes ?? 0}
              icon={BookOpen}
              to="/classes"
              hint="Grades configured"
              emptyCta={{ label: "Create class", to: "/classes" }}
            />
          )}
          {can("attendance") && (
            <MetricCard
              label="Present today"
              value={m?.presentToday ?? 0}
              icon={ClipboardCheck}
              to="/attendance"
              hint="Marked present or late"
              accent="success"
              emptyCta={{ label: "Record attendance", to: "/attendance/new" }}
            />
          )}
          {can("attendance") && (
            <MetricCard
              label="Absent today"
              value={m?.absentToday ?? 0}
              icon={UserMinus}
              to="/attendance"
              hint="Absent or excused"
              accent="destructive"
              emptyCta={{ label: "Record attendance", to: "/attendance/new" }}
            />
          )}
          {can("fees") && (
            <MetricCard
              label="Fees collected"
              value={money(m?.collected ?? 0)}
              icon={Wallet}
              to="/fees"
              hint="All recorded payments"
              accent="success"
              emptyCta={{ label: "Add invoice", to: "/fees/new" }}
            />
          )}
          {can("fees") && (
            <MetricCard
              label="Outstanding fees"
              value={money(m?.outstanding ?? 0)}
              icon={AlertCircle}
              to="/fees"
              hint="Billed minus collected"
              accent="destructive"
              emptyCta={{ label: "Add invoice", to: "/fees/new" }}
            />
          )}
          {can("exams") && (
            <MetricCard
              label="Upcoming exams"
              value={m?.upcomingExams ?? 0}
              icon={CalendarDays}
              to="/exams"
              hint="Next 30 days"
              emptyCta={{ label: "Create exam", to: "/exams" }}
            />
          )}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {can("attendance") && (
          <Panel
            className="lg:col-span-2"
            title="Weekly attendance"
            subtitle="Present vs absent over the last 7 days"
            icon={TrendingUp}
            empty={!metricsQ.isLoading && !(m?.weeklyAttendance ?? []).some((d) => d.present + d.absent > 0)}
            emptyText="No attendance recorded yet."
            emptyCta={{ label: "Record attendance", to: "/attendance/new" }}
            loading={metricsQ.isLoading}
          >
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={m?.weeklyAttendance ?? []}>
                  <defs>
                    <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.53 0.22 292)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="oklch(0.53 0.22 292)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={11} allowDecimals={false} />
                  <Tooltip contentStyle={TOOLTIP} />
                  <Area
                    type="monotone"
                    dataKey="present"
                    stroke="oklch(0.53 0.22 292)"
                    strokeWidth={2}
                    fill="url(#attGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="absent"
                    stroke="oklch(0.62 0.2 25)"
                    strokeWidth={2}
                    fill="transparent"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        )}

        {can("fees") && (
          <Panel
            title="Fees collected"
            subtitle="Last 6 months"
            icon={Wallet}
            loading={metricsQ.isLoading}
            empty={!metricsQ.isLoading && !(m?.monthlyFees ?? []).some((d) => d.collected > 0)}
            emptyText="No payments recorded yet."
            emptyCta={{ label: "Add invoice", to: "/fees/new" }}
          >
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={m?.monthlyFees ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
                  <Tooltip contentStyle={TOOLTIP} />
                  <Bar dataKey="collected" fill="oklch(0.72 0.18 305)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        )}

        {can("students") && (
          <Panel
            className="lg:col-span-3"
            title="Student enrollment"
            subtitle="Active students per class"
            icon={GraduationCap}
            loading={metricsQ.isLoading}
            empty={!metricsQ.isLoading && (m?.enrollment ?? []).length === 0}
            emptyText="No classes configured yet."
            emptyCta={{ label: "Create class", to: "/classes" }}
          >
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={m?.enrollment ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={11} allowDecimals={false} />
                  <Tooltip contentStyle={TOOLTIP} />
                  <Bar dataKey="students" fill="oklch(0.53 0.22 292)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}

const TOOLTIP = {
  background: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: "12px",
  fontSize: "12px",
} as const;

const ACCENTS = {
  primary: "from-primary/20 to-primary-glow/10 text-primary",
  success: "from-success/20 to-success/5 text-success",
  warning: "from-warning/25 to-warning/5 text-warning",
  destructive: "from-destructive/20 to-destructive/5 text-destructive",
} as const;

function MetricCard({
  label,
  value,
  icon: Icon,
  to,
  hint,
  accent = "primary",
  emptyCta,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  to: string;
  hint?: string;
  accent?: keyof typeof ACCENTS;
  emptyCta?: { label: string; to: string };
}) {
  const isEmpty = value === 0 || value === "$0";

  return (
    <Link
      to={to}
      className="glass group relative overflow-hidden rounded-2xl p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-elegant sm:p-5"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-foreground">{value}</p>
          {isEmpty && emptyCta ? (
            <p className="mt-1 text-xs font-medium text-primary">{emptyCta.label} →</p>
          ) : (
            hint && <p className="mt-1 truncate text-xs text-muted-foreground">{hint}</p>
          )}
        </div>
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br",
            ACCENTS[accent],
          )}
        >
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>
      <ArrowUpRight className="absolute bottom-3 right-3 h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  );
}

function Panel({
  title,
  subtitle,
  icon: Icon,
  children,
  className,
  loading,
  empty,
  emptyText,
  emptyCta,
}: {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
  empty?: boolean;
  emptyText?: string;
  emptyCta?: { label: string; to: string };
}) {
  return (
    <section className={cn("glass rounded-2xl p-5 shadow-sm sm:p-6", className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-foreground">{title}</h3>
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <Icon className="h-4 w-4 shrink-0 text-primary" />
      </div>
      {loading ? (
        <Skeleton className="h-60 rounded-xl" />
      ) : empty ? (
        <div className="flex h-60 flex-col items-center justify-center gap-3 text-center">
          <div className="bg-gradient-primary shadow-glow flex h-12 w-12 items-center justify-center rounded-2xl">
            <Icon className="h-5 w-5 text-primary-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">{emptyText}</p>
          {emptyCta && (
            <Button asChild size="sm" className="bg-gradient-primary shadow-glow">
              <Link to={emptyCta.to}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                {emptyCta.label}
              </Link>
            </Button>
          )}
        </div>
      ) : (
        children
      )}
    </section>
  );
}
