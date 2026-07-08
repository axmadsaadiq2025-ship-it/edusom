import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Save, Users, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";

const searchSchema = z.object({ session: z.string().optional() });

export const Route = createFileRoute("/_authenticated/attendance/new")({
  validateSearch: (s) => searchSchema.parse(s),
  component: TakeAttendancePage,
});

type Status = "present" | "absent" | "late" | "excused";
const STATUSES: { value: Status; label: string; className: string }[] = [
  { value: "present", label: "Present", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" },
  { value: "absent", label: "Absent", className: "bg-destructive/15 text-destructive border-destructive/30" },
  { value: "late", label: "Late", className: "bg-amber-500/15 text-amber-700 dark:text-amber-500 border-amber-500/30" },
  { value: "excused", label: "Excused", className: "bg-muted text-muted-foreground border-border" },
];

function TakeAttendancePage() {
  const { session: existingSessionId } = Route.useSearch();
  const { profile, roles } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [schoolId, setSchoolId] = useState<string>(profile?.school_id ?? "");
  const [classId, setClassId] = useState<string>("");
  const [sectionId, setSectionId] = useState<string>("");
  const [date, setDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [notes, setNotes] = useState("");
  const [marks, setMarks] = useState<Record<string, { status: Status; remarks: string }>>({});

  const isSuper = roles.includes("super_admin");

  const schoolsQ = useQuery({
    queryKey: ["schools", "picker"],
    enabled: isSuper,
    queryFn: async () => {
      const { data, error } = await supabase.from("schools").select("id,name").order("name");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (profile?.school_id && !schoolId) setSchoolId(profile.school_id);
  }, [profile?.school_id, schoolId]);

  const classesQ = useQuery({
    queryKey: ["classes", schoolId],
    enabled: !!schoolId,
    queryFn: async () => {
      const { data, error } = await supabase.from("classes").select("id,name").eq("school_id", schoolId).order("name");
      if (error) throw error;
      return data;
    },
  });

  const sectionsQ = useQuery({
    queryKey: ["sections", classId],
    enabled: !!classId,
    queryFn: async () => {
      const { data, error } = await supabase.from("sections").select("id,name").eq("class_id", classId).order("name");
      if (error) throw error;
      return data;
    },
  });

  const yearsQ = useQuery({
    queryKey: ["academic_years", schoolId],
    enabled: !!schoolId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academic_years")
        .select("id,name,is_current")
        .eq("school_id", schoolId)
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const currentYearId = useMemo(() => {
    const list = yearsQ.data ?? [];
    return list.find((y) => y.is_current)?.id ?? list[0]?.id ?? "";
  }, [yearsQ.data]);

  // Load existing session if editing
  const existingQ = useQuery({
    queryKey: ["attendance_session", existingSessionId],
    enabled: !!existingSessionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance_sessions")
        .select("*, attendance_records(*)")
        .eq("id", existingSessionId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!existingQ.data) return;
    const s = existingQ.data;
    setSchoolId(s.school_id);
    setClassId(s.class_id);
    setSectionId(s.section_id);
    setDate(s.session_date);
    setNotes(s.notes ?? "");
    const m: Record<string, { status: Status; remarks: string }> = {};
    (s.attendance_records ?? []).forEach((r: any) => {
      m[r.student_id] = { status: r.status, remarks: r.remarks ?? "" };
    });
    setMarks(m);
  }, [existingQ.data]);

  const studentsQ = useQuery({
    queryKey: ["students", "section", sectionId],
    enabled: !!sectionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id,first_name,last_name,admission_number,photo_url")
        .eq("section_id", sectionId)
        .eq("status", "active")
        .order("first_name");
      if (error) throw error;
      return data;
    },
  });

  // Default all to present on load
  useEffect(() => {
    if (!studentsQ.data || existingSessionId) return;
    setMarks((prev) => {
      const next = { ...prev };
      studentsQ.data.forEach((s) => {
        if (!next[s.id]) next[s.id] = { status: "present", remarks: "" };
      });
      return next;
    });
  }, [studentsQ.data, existingSessionId]);

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!schoolId || !classId || !sectionId || !currentYearId) {
        throw new Error("Please select school, class, section and ensure an academic year exists.");
      }
      const students = studentsQ.data ?? [];
      if (students.length === 0) throw new Error("No active students in this section.");

      let sessionId = existingSessionId;
      if (sessionId) {
        const { error } = await supabase
          .from("attendance_sessions")
          .update({ session_date: date, notes: notes || null })
          .eq("id", sessionId);
        if (error) throw error;
        await supabase.from("attendance_records").delete().eq("session_id", sessionId);
      } else {
        const { data: existing, error: exErr } = await supabase
          .from("attendance_sessions")
          .select("id")
          .eq("section_id", sectionId)
          .eq("session_date", date)
          .maybeSingle();
        if (exErr) throw exErr;
        if (existing) {
          sessionId = existing.id;
          await supabase.from("attendance_records").delete().eq("session_id", sessionId);
        } else {
          const { data: ins, error } = await supabase
            .from("attendance_sessions")
            .insert({
              school_id: schoolId,
              academic_year_id: currentYearId,
              class_id: classId,
              section_id: sectionId,
              session_date: date,
              notes: notes || null,
            })
            .select("id")
            .single();
          if (error) throw error;
          sessionId = ins.id;
        }
      }

      const rows = students.map((st) => ({
        session_id: sessionId!,
        student_id: st.id,
        status: (marks[st.id]?.status ?? "present") as Status,
        remarks: marks[st.id]?.remarks || null,
      }));
      const { error: rErr } = await supabase.from("attendance_records").insert(rows);
      if (rErr) throw rErr;
    },
    onSuccess: () => {
      toast.success("Attendance saved");
      qc.invalidateQueries({ queryKey: ["attendance_sessions"] });
      qc.invalidateQueries({ queryKey: ["attendance_records_summary"] });
      navigate({ to: "/attendance" });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to save attendance"),
  });

  const students = studentsQ.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link to="/attendance"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {existingSessionId ? "Edit attendance" : "Take attendance"}
          </h1>
          <p className="text-sm text-muted-foreground">Mark each student and save the register.</p>
        </div>
      </div>

      <div className="grid gap-4 rounded-xl border bg-card p-4 md:grid-cols-4">
        {isSuper && (
          <div className="flex flex-col gap-1.5">
            <Label>School</Label>
            <Select value={schoolId} onValueChange={(v) => { setSchoolId(v); setClassId(""); setSectionId(""); }}>
              <SelectTrigger><SelectValue placeholder="Select school" /></SelectTrigger>
              <SelectContent>
                {(schoolsQ.data ?? []).map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <Label>Class</Label>
          <Select value={classId} onValueChange={(v) => { setClassId(v); setSectionId(""); }} disabled={!schoolId}>
            <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
            <SelectContent>
              {(classesQ.data ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Section</Label>
          <Select value={sectionId} onValueChange={setSectionId} disabled={!classId}>
            <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
            <SelectContent>
              {(sectionsQ.data ?? []).map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      <div className="rounded-xl border bg-card">
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">Students {students.length > 0 && `(${students.length})`}</h2>
          </div>
          {students.length > 0 && (
            <div className="flex gap-1">
              {STATUSES.map((s) => (
                <Button
                  key={s.value}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() =>
                    setMarks((prev) => {
                      const next = { ...prev };
                      students.forEach((st) => {
                        next[st.id] = { status: s.value, remarks: next[st.id]?.remarks ?? "" };
                      });
                      return next;
                    })
                  }
                >
                  All {s.label}
                </Button>
              ))}
            </div>
          )}
        </div>

        {!sectionId ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Select a class and section to load students.
          </div>
        ) : studentsQ.isLoading ? (
          <div className="p-4 space-y-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : students.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            No active students in this section.
          </div>
        ) : (
          <div className="divide-y">
            {students.map((st) => {
              const current = marks[st.id]?.status ?? "present";
              return (
                <div key={st.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  <div className="flex flex-1 items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-gradient-primary text-xs text-primary-foreground">
                        {st.first_name[0]}{st.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{st.first_name} {st.last_name}</div>
                      <div className="text-xs text-muted-foreground">#{st.admission_number}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {STATUSES.map((s) => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() =>
                          setMarks((prev) => ({
                            ...prev,
                            [st.id]: { status: s.value, remarks: prev[st.id]?.remarks ?? "" },
                          }))
                        }
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                          current === s.value ? s.className + " ring-2 ring-offset-1 ring-primary/40" : "border-border text-muted-foreground hover:bg-accent"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                  <Input
                    placeholder="Remarks"
                    value={marks[st.id]?.remarks ?? ""}
                    onChange={(e) =>
                      setMarks((prev) => ({
                        ...prev,
                        [st.id]: { status: prev[st.id]?.status ?? "present", remarks: e.target.value },
                      }))
                    }
                    className="h-9 sm:w-48"
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label>Session notes (optional)</Label>
        <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any notes about this session…" />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" asChild><Link to="/attendance">Cancel</Link></Button>
        <Button
          className="bg-gradient-primary shadow-glow"
          disabled={saveMut.isPending || students.length === 0}
          onClick={() => saveMut.mutate()}
        >
          {saveMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save attendance
        </Button>
      </div>
    </div>
  );
}
