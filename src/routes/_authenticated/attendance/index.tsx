import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ClipboardCheck, Plus, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/attendance/")({
  component: AttendancePage,
});

function AttendancePage() {
  const [date, setDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));

  const sessionsQ = useQuery({
    queryKey: ["attendance_sessions", date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance_sessions")
        .select("id, session_date, notes, class_id, section_id, created_at")
        .eq("session_date", date)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const classesQ = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("classes").select("id,name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const sectionsQ = useQuery({
    queryKey: ["sections"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sections").select("id,name,class_id").order("name");
      if (error) throw error;
      return data;
    },
  });

  const recordsQ = useQuery({
    queryKey: ["attendance_records_summary", date, sessionsQ.data?.map((s) => s.id).join(",")],
    enabled: !!sessionsQ.data && sessionsQ.data.length > 0,
    queryFn: async () => {
      const ids = sessionsQ.data!.map((s) => s.id);
      const { data, error } = await supabase
        .from("attendance_records")
        .select("session_id,status")
        .in("session_id", ids);
      if (error) throw error;
      return data;
    },
  });

  const summary = useMemo(() => {
    const map = new Map<string, { present: number; absent: number; late: number; excused: number; total: number }>();
    (recordsQ.data ?? []).forEach((r) => {
      const s = map.get(r.session_id) ?? { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
      s[r.status as keyof typeof s] = (s[r.status as keyof typeof s] as number) + 1;
      s.total += 1;
      map.set(r.session_id, s);
    });
    return map;
  }, [recordsQ.data]);

  const classById = new Map((classesQ.data ?? []).map((c) => [c.id, c.name]));
  const sectionById = new Map((sectionsQ.data ?? []).map((s) => [s.id, s.name]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Attendance</h1>
          <p className="text-sm text-muted-foreground">Take and review daily attendance by class section.</p>
        </div>
        <Button asChild className="bg-gradient-primary shadow-glow">
          <Link to="/attendance/new">
            <Plus className="mr-2 h-4 w-4" /> Take attendance
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-3 rounded-xl border bg-card p-3">
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
        <label className="text-sm font-medium">Date</label>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="h-9 w-auto"
        />
      </div>

      <div className="rounded-xl border bg-card">
        {sessionsQ.isLoading ? (
          <div className="p-4 space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (sessionsQ.data ?? []).length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <ClipboardCheck className="h-10 w-10 text-muted-foreground" />
            <h3 className="font-semibold">No attendance recorded for {date}</h3>
            <p className="text-sm text-muted-foreground">Click "Take attendance" to start.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Present</TableHead>
                <TableHead>Absent</TableHead>
                <TableHead>Late</TableHead>
                <TableHead>Excused</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(sessionsQ.data ?? []).map((s) => {
                const sum = summary.get(s.id);
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{classById.get(s.class_id) ?? "—"}</TableCell>
                    <TableCell>{sectionById.get(s.section_id) ?? "—"}</TableCell>
                    <TableCell><Badge variant="secondary" className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">{sum?.present ?? 0}</Badge></TableCell>
                    <TableCell><Badge variant="secondary" className="bg-destructive/15 text-destructive">{sum?.absent ?? 0}</Badge></TableCell>
                    <TableCell><Badge variant="secondary" className="bg-amber-500/15 text-amber-700 dark:text-amber-500">{sum?.late ?? 0}</Badge></TableCell>
                    <TableCell><Badge variant="secondary">{sum?.excused ?? 0}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link to="/attendance/new" search={{ session: s.id }}>Edit</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
