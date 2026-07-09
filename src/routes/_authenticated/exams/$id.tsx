import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/exams/$id")({
  component: ExamMarksPage,
});

interface ExamInfo {
  id: string;
  title: string;
  max_marks: number;
  pass_marks: number;
  class_id: string;
  section_id: string | null;
  school_id: string;
  classes: { name: string } | null;
  subjects: { name: string } | null;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  admission_number: string | null;
}

interface MarkRow {
  student_id: string;
  marks_obtained: string;
  is_absent: boolean;
  remarks: string;
}

function computeGrade(pct: number): string {
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B";
  if (pct >= 60) return "C";
  if (pct >= 50) return "D";
  return "F";
}

function ExamMarksPage() {
  const { id } = Route.useParams();
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [rows, setRows] = useState<Record<string, MarkRow>>({});

  const examQ = useQuery({
    queryKey: ["exam", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exams")
        .select(
          "id,title,max_marks,pass_marks,class_id,section_id,school_id,classes(name),subjects(name)",
        )
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as ExamInfo;
    },
  });

  const studentsQ = useQuery({
    queryKey: ["exam-students", examQ.data?.class_id, examQ.data?.section_id],
    enabled: !!examQ.data,
    queryFn: async () => {
      let q = supabase
        .from("students")
        .select("id,first_name,last_name,admission_number")
        .eq("class_id", examQ.data!.class_id)
        .eq("status", "active")
        .order("first_name");
      if (examQ.data?.section_id) q = q.eq("section_id", examQ.data.section_id);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Student[];
    },
  });

  const marksQ = useQuery({
    queryKey: ["exam-marks", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_marks")
        .select("student_id,marks_obtained,is_absent,remarks")
        .eq("exam_id", id);
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!studentsQ.data || !marksQ.data) return;
    const map: Record<string, MarkRow> = {};
    for (const s of studentsQ.data) {
      const existing = marksQ.data.find((m) => m.student_id === s.id);
      map[s.id] = {
        student_id: s.id,
        marks_obtained: existing?.marks_obtained != null ? String(existing.marks_obtained) : "",
        is_absent: existing?.is_absent ?? false,
        remarks: existing?.remarks ?? "",
      };
    }
    setRows(map);
  }, [studentsQ.data, marksQ.data]);

  const save = useMutation({
    mutationFn: async () => {
      if (!examQ.data || !profile?.school_id) throw new Error("Missing context");
      const payload = Object.values(rows)
        .filter((r) => r.is_absent || r.marks_obtained !== "")
        .map((r) => {
          const marks = r.is_absent ? null : Number(r.marks_obtained);
          const pct =
            marks != null && examQ.data!.max_marks > 0
              ? (marks / examQ.data!.max_marks) * 100
              : null;
          return {
            school_id: examQ.data!.school_id,
            exam_id: id,
            student_id: r.student_id,
            marks_obtained: marks,
            is_absent: r.is_absent,
            grade: r.is_absent ? "AB" : pct != null ? computeGrade(pct) : null,
            remarks: r.remarks || null,
          };
        });
      if (payload.length === 0) return;
      const { error } = await supabase
        .from("exam_marks")
        .upsert(payload, { onConflict: "exam_id,student_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Marks saved");
      qc.invalidateQueries({ queryKey: ["exam-marks", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const stats = useMemo(() => {
    if (!examQ.data) return null;
    const values = Object.values(rows);
    const entered = values.filter((r) => r.marks_obtained !== "" || r.is_absent).length;
    const passed = values.filter(
      (r) => !r.is_absent && Number(r.marks_obtained) >= examQ.data!.pass_marks,
    ).length;
    return { entered, total: values.length, passed };
  }, [rows, examQ.data]);

  if (examQ.isLoading) return <Skeleton className="h-96 rounded-2xl" />;
  if (!examQ.data)
    return <div className="glass rounded-2xl p-8 text-center">Exam not found.</div>;

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link to="/exams">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to exams
          </Link>
        </Button>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{examQ.data.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {examQ.data.classes?.name} · {examQ.data.subjects?.name} · Max{" "}
              {examQ.data.max_marks} · Pass {examQ.data.pass_marks}
            </p>
          </div>
          <Button
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="bg-gradient-primary shadow-glow"
          >
            {save.isPending ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1.5 h-4 w-4" />
            )}
            Save marks
          </Button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <div className="glass rounded-xl p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Students</div>
            <div className="mt-1 text-2xl font-bold">{stats.total}</div>
          </div>
          <div className="glass rounded-xl p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Entered</div>
            <div className="mt-1 text-2xl font-bold">{stats.entered}</div>
          </div>
          <div className="glass rounded-xl p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Passed</div>
            <div className="mt-1 text-2xl font-bold">{stats.passed}</div>
          </div>
        </div>
      )}

      {studentsQ.isLoading ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : (studentsQ.data ?? []).length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center text-sm text-muted-foreground">
          No active students in this class.
        </div>
      ) : (
        <div className="glass overflow-hidden rounded-2xl">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead className="hidden sm:table-cell">Adm #</TableHead>
                <TableHead className="w-28">Marks</TableHead>
                <TableHead className="w-24">Grade</TableHead>
                <TableHead className="w-24">Absent</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(studentsQ.data ?? []).map((s) => {
                const row = rows[s.id];
                if (!row) return null;
                const marks = Number(row.marks_obtained);
                const grade = row.is_absent
                  ? "AB"
                  : row.marks_obtained !== "" && examQ.data!.max_marks > 0
                    ? computeGrade((marks / examQ.data!.max_marks) * 100)
                    : "—";
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      {s.first_name} {s.last_name}
                    </TableCell>
                    <TableCell className="hidden font-mono text-xs sm:table-cell">
                      {s.admission_number ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        max={examQ.data!.max_marks}
                        value={row.marks_obtained}
                        disabled={row.is_absent}
                        onChange={(e) =>
                          setRows((prev) => ({
                            ...prev,
                            [s.id]: { ...prev[s.id], marks_obtained: e.target.value },
                          }))
                        }
                        className="h-9 w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <span className="rounded-md bg-muted px-2 py-1 text-xs font-semibold">
                        {grade}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Checkbox
                        checked={row.is_absent}
                        onCheckedChange={(v) =>
                          setRows((prev) => ({
                            ...prev,
                            [s.id]: {
                              ...prev[s.id],
                              is_absent: !!v,
                              marks_obtained: v ? "" : prev[s.id].marks_obtained,
                            },
                          }))
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={row.remarks}
                        onChange={(e) =>
                          setRows((prev) => ({
                            ...prev,
                            [s.id]: { ...prev[s.id], remarks: e.target.value },
                          }))
                        }
                        placeholder="Optional"
                        className="h-9"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
