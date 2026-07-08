import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Users,
  GraduationCap,
  Wallet,
  ClipboardCheck,
  TrendingUp,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import { format, subDays, eachDayOfInterval } from "date-fns";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/dashboard/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/reports/")({
  component: ReportsPage,
});

const STATUS_COLORS: Record<string, string> = {
  present: "hsl(142 71% 45%)",
  absent: "hsl(0 84% 60%)",
  late: "hsl(38 92% 50%)",
  excused: "hsl(215 20% 65%)",
  paid: "hsl(142 71% 45%)",
  pending: "hsl(215 20% 65%)",
  partial: "hsl(38 92% 50%)",
  overdue: "hsl(0 84% 60%)",
  cancelled: "hsl(215 15% 40%)",
  active: "hsl(142 71% 45%)",
  inactive: "hsl(215 20% 65%)",
  graduated: "hsl(217 91% 60%)",
  transferred: "hsl(38 92% 50%)",
  suspended: "hsl(0 84% 60%)",
};

function ReportsPage() {
  const [range, setRange] = useState("30");
  const days = Number(range);
  const startDate = format(subDays(new Date(), days - 1), "yyyy-MM-dd");

  const studentsQ = useQuery({
    queryKey: ["report_students"],
    queryFn: async () => {
      const { data, error } = await supabase.from("students").select("id,status,gender,class_id");
      if (error) throw error;
      return data;
    },
  });

  const teachersQ = useQuery({
    queryKey: ["report_teachers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("teachers").select("id,status");
      if (error) throw error;
      return data;
    },
  });

  const classesQ = useQuery({
    queryKey: ["report_classes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("classes").select("id,name");
      if (error) throw error;
      return data;
    },
  });

  const invoicesQ = useQuery({
    queryKey: ["report_invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fee_invoices")
        .select("id,status,total_amount,amount_paid,issue_date");
      if (error) throw error;
      return data;
    },
  });

  const paymentsQ = useQuery({
    queryKey: ["report_payments", startDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fee_payments")
        .select("amount,paid_at,method")
        .gte("paid_at", startDate);
      if (error) throw error;
      return data;
    },
  });

  const attendanceQ = useQuery({
    queryKey: ["report_attendance", startDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance_records")
        .select("status, attendance_sessions!inner(session_date)")
        .gte("attendance_sessions.session_date", startDate);
      if (error) throw error;
      return data as any[];
    },
  });

  const studentStatus = useMemo(() => {
    const counts: Record<string, number> = {};
    (studentsQ.data ?? []).forEach((s) => { counts[s.status] = (counts[s.status] ?? 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [studentsQ.data]);

  const genderMix = useMemo(() => {
    const counts: Record<string, number> = { male: 0, female: 0, other: 0 };
    (studentsQ.data ?? []).forEach((s) => {
      if (s.gender) counts[s.gender] = (counts[s.gender] ?? 0) + 1;
    });
    return Object.entries(counts).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));
  }, [studentsQ.data]);

  const byClass = useMemo(() => {
    const map = new Map<string, number>();
    (studentsQ.data ?? []).forEach((s) => {
      if (s.class_id) map.set(s.class_id, (map.get(s.class_id) ?? 0) + 1);
    });
    const names = new Map((classesQ.data ?? []).map((c) => [c.id, c.name]));
    return Array.from(map.entries()).map(([id, count]) => ({
      name: names.get(id) ?? "Unknown",
      students: count,
    }));
  }, [studentsQ.data, classesQ.data]);

  const attendanceMix = useMemo(() => {
    const counts: Record<string, number> = {};
    (attendanceQ.data ?? []).forEach((r) => { counts[r.status] = (counts[r.status] ?? 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [attendanceQ.data]);

  const attendanceTrend = useMemo(() => {
    const days = eachDayOfInterval({ start: subDays(new Date(), Number(range) - 1), end: new Date() });
    const map = new Map<string, { present: number; absent: number; late: number }>();
    days.forEach((d) => map.set(format(d, "yyyy-MM-dd"), { present: 0, absent: 0, late: 0 }));
    (attendanceQ.data ?? []).forEach((r) => {
      const d = r.attendance_sessions?.session_date;
      if (!d) return;
      const bucket = map.get(d);
      if (bucket && (r.status === "present" || r.status === "absent" || r.status === "late")) {
        bucket[r.status as "present" | "absent" | "late"] += 1;
      }
    });
    return Array.from(map.entries()).map(([date, v]) => ({
      date: format(new Date(date), "MMM d"),
      ...v,
    }));
  }, [attendanceQ.data, range]);

  const paymentsTrend = useMemo(() => {
    const days = eachDayOfInterval({ start: subDays(new Date(), Number(range) - 1), end: new Date() });
    const map = new Map<string, number>();
    days.forEach((d) => map.set(format(d, "yyyy-MM-dd"), 0));
    (paymentsQ.data ?? []).forEach((p) => {
      map.set(p.paid_at, (map.get(p.paid_at) ?? 0) + Number(p.amount));
    });
    return Array.from(map.entries()).map(([date, amount]) => ({
      date: format(new Date(date), "MMM d"),
      amount,
    }));
  }, [paymentsQ.data, range]);

  const invoiceStats = useMemo(() => {
    let total = 0, paid = 0, outstanding = 0, overdue = 0;
    (invoicesQ.data ?? []).forEach((i) => {
      total += Number(i.total_amount);
      paid += Number(i.amount_paid);
      const bal = Number(i.total_amount) - Number(i.amount_paid);
      if (i.status !== "cancelled" && i.status !== "paid") outstanding += bal;
      if (i.status === "overdue") overdue += bal;
    });
    const collectionRate = total > 0 ? (paid / total) * 100 : 0;
    return { total, paid, outstanding, overdue, collectionRate };
  }, [invoicesQ.data]);

  const invoiceStatus = useMemo(() => {
    const counts: Record<string, number> = {};
    (invoicesQ.data ?? []).forEach((i) => { counts[i.status] = (counts[i.status] ?? 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [invoicesQ.data]);

  const attendanceRate = useMemo(() => {
    const total = attendanceMix.reduce((s, v) => s + v.value, 0);
    const present = (attendanceMix.find((m) => m.name === "present")?.value ?? 0)
      + (attendanceMix.find((m) => m.name === "late")?.value ?? 0);
    return total > 0 ? (present / total) * 100 : 0;
  }, [attendanceMix]);

  const activeStudents = (studentsQ.data ?? []).filter((s) => s.status === "active").length;
  const activeTeachers = (teachersQ.data ?? []).filter((t) => t.status === "active").length;

  const loading = studentsQ.isLoading || invoicesQ.isLoading || attendanceQ.isLoading;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground">Insights across enrollment, attendance and finance.</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm">Range</Label>
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active students" value={loading ? "…" : activeStudents.toString()} icon={GraduationCap} />
        <StatCard label="Active teachers" value={loading ? "…" : activeTeachers.toString()} icon={Users} />
        <StatCard label="Attendance rate" value={loading ? "…" : `${attendanceRate.toFixed(1)}%`} icon={ClipboardCheck} accent="success" />
        <StatCard label="Collection rate" value={loading ? "…" : `${invoiceStats.collectionRate.toFixed(1)}%`} icon={Wallet} accent="primary" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total billed" value={`$${invoiceStats.total.toFixed(2)}`} icon={TrendingUp} />
        <StatCard label="Collected" value={`$${invoiceStats.paid.toFixed(2)}`} icon={Wallet} accent="success" />
        <StatCard label="Outstanding" value={`$${invoiceStats.outstanding.toFixed(2)}`} icon={Wallet} accent="warning" />
        <StatCard label="Overdue" value={`$${invoiceStats.overdue.toFixed(2)}`} icon={AlertTriangle} accent="destructive" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Attendance trend" description="Daily counts by status">
          {attendanceQ.isLoading ? <Skeleton className="h-64 w-full" /> : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={attendanceTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Legend />
                <Line type="monotone" dataKey="present" stroke={STATUS_COLORS.present} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="absent" stroke={STATUS_COLORS.absent} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="late" stroke={STATUS_COLORS.late} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Payments collected" description="Daily cash-in across the period">
          {paymentsQ.isLoading ? <Skeleton className="h-64 w-full" /> : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={paymentsTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  formatter={(v: number) => `$${v.toFixed(2)}`}
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Students per class" description="Distribution across grade levels">
          {studentsQ.isLoading ? <Skeleton className="h-64 w-full" /> : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={byClass} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={90} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="students" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Invoice status" description="How invoices are settling">
          {invoicesQ.isLoading ? <Skeleton className="h-64 w-full" /> : invoiceStatus.length === 0 ? (
            <EmptyChart label="No invoices yet" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={invoiceStatus} dataKey="value" nameKey="name" outerRadius={90} label>
                  {invoiceStatus.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? "hsl(var(--primary))"} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Student status" description="Enrollment mix">
          {studentsQ.isLoading ? <Skeleton className="h-64 w-full" /> : studentStatus.length === 0 ? (
            <EmptyChart label="No students yet" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={studentStatus} dataKey="value" nameKey="name" outerRadius={90} label>
                  {studentStatus.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? "hsl(var(--primary))"} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Gender balance" description="Across all enrolled students">
          {studentsQ.isLoading ? <Skeleton className="h-64 w-full" /> : genderMix.length === 0 ? (
            <EmptyChart label="No demographic data" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={genderMix} dataKey="value" nameKey="name" outerRadius={90} label>
                  <Cell fill="hsl(217 91% 60%)" />
                  <Cell fill="hsl(330 81% 60%)" />
                  <Cell fill="hsl(215 20% 65%)" />
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-3">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">{label}</div>;
}
