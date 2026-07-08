import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CalendarClock, Plus, Trash2, Loader2, Coffee, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/timetable/")({
  component: TimetablePage,
});

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface Period {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  sort_order: number;
  is_break: boolean;
  school_id: string;
}

interface Entry {
  id: string;
  section_id: string;
  period_id: string;
  day_of_week: number;
  subject_id: string | null;
  teacher_id: string | null;
  room: string | null;
}

function TimetablePage() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const schoolId = profile?.school_id ?? "";

  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [yearId, setYearId] = useState("");

  // Data
  const periodsQ = useQuery({
    queryKey: ["tt_periods", schoolId],
    enabled: !!schoolId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("timetable_periods")
        .select("*").eq("school_id", schoolId).order("sort_order");
      if (error) throw error;
      return data as Period[];
    },
  });

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
        .from("academic_years").select("id,name,is_current")
        .eq("school_id", schoolId).order("start_date", { ascending: false });
      if (error) throw error;
      const list = data ?? [];
      if (!yearId) {
        const cur = list.find((y) => y.is_current) ?? list[0];
        if (cur) setYearId(cur.id);
      }
      return list;
    },
  });

  const subjectsQ = useQuery({
    queryKey: ["subjects", schoolId],
    enabled: !!schoolId,
    queryFn: async () => {
      const { data, error } = await supabase.from("subjects").select("id,name,code").eq("school_id", schoolId).order("name");
      if (error) throw error;
      return data;
    },
  });

  const teachersQ = useQuery({
    queryKey: ["teachers", schoolId],
    enabled: !!schoolId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teachers").select("id,full_name").eq("school_id", schoolId)
        .eq("status", "active").order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const entriesQ = useQuery({
    queryKey: ["tt_entries", sectionId, yearId],
    enabled: !!sectionId && !!yearId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("timetable_entries").select("*")
        .eq("section_id", sectionId).eq("academic_year_id", yearId);
      if (error) throw error;
      return data as Entry[];
    },
  });

  const subjById = new Map((subjectsQ.data ?? []).map((s) => [s.id, s]));
  const tchById = new Map((teachersQ.data ?? []).map((t) => [t.id, t]));

  const entryMap = useMemo(() => {
    const m = new Map<string, Entry>();
    (entriesQ.data ?? []).forEach((e) => m.set(`${e.day_of_week}_${e.period_id}`, e));
    return m;
  }, [entriesQ.data]);

  // Period dialog
  const [pOpen, setPOpen] = useState(false);
  const [pForm, setPForm] = useState({ name: "", start_time: "08:00", end_time: "08:45", sort_order: "0", is_break: false });

  const addPeriodMut = useMutation({
    mutationFn: async () => {
      if (!schoolId) throw new Error("No school");
      const { error } = await supabase.from("timetable_periods").insert({
        school_id: schoolId,
        name: pForm.name.trim(),
        start_time: pForm.start_time,
        end_time: pForm.end_time,
        sort_order: Number(pForm.sort_order) || 0,
        is_break: pForm.is_break,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Period added");
      qc.invalidateQueries({ queryKey: ["tt_periods"] });
      setPOpen(false);
      setPForm({ name: "", start_time: "08:00", end_time: "08:45", sort_order: "0", is_break: false });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const deletePeriodMut = useMutation({
    mutationFn: async (pid: string) => {
      const { error } = await supabase.from("timetable_periods").delete().eq("id", pid);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tt_periods"] });
      qc.invalidateQueries({ queryKey: ["tt_entries"] });
    },
  });

  // Cell dialog
  const [cellOpen, setCellOpen] = useState(false);
  const [cell, setCell] = useState<{ day: number; period: Period } | null>(null);
  const [cellForm, setCellForm] = useState({ subject_id: "", teacher_id: "", room: "" });
  const currentEntry = cell ? entryMap.get(`${cell.day}_${cell.period.id}`) : undefined;

  function openCell(day: number, period: Period) {
    setCell({ day, period });
    const e = entryMap.get(`${day}_${period.id}`);
    setCellForm({
      subject_id: e?.subject_id ?? "",
      teacher_id: e?.teacher_id ?? "",
      room: e?.room ?? "",
    });
    setCellOpen(true);
  }

  const saveCellMut = useMutation({
    mutationFn: async () => {
      if (!cell || !sectionId || !classId || !yearId || !schoolId) throw new Error("Select class/section/year first");
      const payload = {
        school_id: schoolId,
        academic_year_id: yearId,
        class_id: classId,
        section_id: sectionId,
        period_id: cell.period.id,
        day_of_week: cell.day,
        subject_id: cellForm.subject_id || null,
        teacher_id: cellForm.teacher_id || null,
        room: cellForm.room.trim() || null,
      };
      if (currentEntry) {
        const { error } = await supabase.from("timetable_entries").update(payload).eq("id", currentEntry.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("timetable_entries").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["tt_entries"] });
      setCellOpen(false);
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const clearCellMut = useMutation({
    mutationFn: async () => {
      if (!currentEntry) return;
      const { error } = await supabase.from("timetable_entries").delete().eq("id", currentEntry.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tt_entries"] });
      setCellOpen(false);
    },
  });

  const periods = periodsQ.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Timetable</h1>
          <p className="text-sm text-muted-foreground">Build the weekly class schedule by section.</p>
        </div>
        <Dialog open={pOpen} onOpenChange={setPOpen}>
          <DialogTrigger asChild>
            <Button variant="outline"><Plus className="mr-2 h-4 w-4" /> Add period</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New period</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5"><Label>Name</Label><Input value={pForm.name} onChange={(e) => setPForm({ ...pForm, name: e.target.value })} placeholder="Period 1 / Break" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Start</Label><Input type="time" value={pForm.start_time} onChange={(e) => setPForm({ ...pForm, start_time: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>End</Label><Input type="time" value={pForm.end_time} onChange={(e) => setPForm({ ...pForm, end_time: e.target.value })} /></div>
              </div>
              <div className="space-y-1.5"><Label>Sort order</Label><Input type="number" value={pForm.sort_order} onChange={(e) => setPForm({ ...pForm, sort_order: e.target.value })} /></div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label>Is break</Label>
                <Switch checked={pForm.is_break} onCheckedChange={(c) => setPForm({ ...pForm, is_break: c })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPOpen(false)}>Cancel</Button>
              <Button className="bg-gradient-primary shadow-glow" disabled={!pForm.name.trim() || addPeriodMut.isPending} onClick={() => addPeriodMut.mutate()}>
                {addPeriodMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {periods.length > 0 && (
        <div className="rounded-xl border bg-card p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Clock className="h-3 w-3" /> Periods
          </div>
          <div className="flex flex-wrap gap-2">
            {periods.map((p) => (
              <div key={p.id} className="group flex items-center gap-1.5 rounded-lg border bg-background px-2.5 py-1.5 text-xs">
                {p.is_break && <Coffee className="h-3 w-3 text-amber-500" />}
                <span className="font-medium">{p.name}</span>
                <span className="text-muted-foreground">{p.start_time.slice(0, 5)}–{p.end_time.slice(0, 5)}</span>
                <button onClick={() => deletePeriodMut.mutate(p.id)} className="ml-1 rounded p-0.5 opacity-0 transition-opacity hover:bg-destructive/10 group-hover:opacity-100">
                  <Trash2 className="h-3 w-3 text-destructive" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-3">
        <div className="space-y-1.5">
          <Label>Class</Label>
          <Select value={classId} onValueChange={(v) => { setClassId(v); setSectionId(""); }}>
            <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
            <SelectContent>
              {(classesQ.data ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Section</Label>
          <Select value={sectionId} onValueChange={setSectionId} disabled={!classId}>
            <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
            <SelectContent>
              {(sectionsQ.data ?? []).map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Academic year</Label>
          <Select value={yearId} onValueChange={setYearId}>
            <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
            <SelectContent>
              {(yearsQ.data ?? []).map((y) => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!sectionId ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border bg-card py-16 text-center">
          <CalendarClock className="h-10 w-10 text-muted-foreground" />
          <h3 className="mt-2 font-semibold">Select a class and section</h3>
          <p className="text-sm text-muted-foreground">The weekly grid will appear once you pick a section.</p>
        </div>
      ) : periods.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border bg-card py-16 text-center">
          <Clock className="h-10 w-10 text-muted-foreground" />
          <h3 className="mt-2 font-semibold">Define periods first</h3>
          <p className="text-sm text-muted-foreground">Add at least one period to build the schedule.</p>
        </div>
      ) : entriesQ.isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-[720px] table-fixed">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="w-32 p-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Period</th>
                {DAYS.map((d, i) => (
                  <th key={i} className="p-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map((p) => (
                <tr key={p.id} className="border-b last:border-b-0">
                  <td className="p-3 align-top">
                    <div className="flex items-center gap-1.5">
                      {p.is_break && <Coffee className="h-3 w-3 text-amber-500" />}
                      <div>
                        <div className="text-sm font-semibold">{p.name}</div>
                        <div className="text-[10px] text-muted-foreground">{p.start_time.slice(0, 5)}–{p.end_time.slice(0, 5)}</div>
                      </div>
                    </div>
                  </td>
                  {DAYS.map((_, day) => {
                    const e = entryMap.get(`${day}_${p.id}`);
                    const subj = e?.subject_id ? subjById.get(e.subject_id) : null;
                    const tch = e?.teacher_id ? tchById.get(e.teacher_id) : null;
                    return (
                      <td key={day} className="p-1.5 align-top">
                        <button
                          onClick={() => openCell(day, p)}
                          className={`w-full rounded-lg border p-2 text-left text-xs transition-all hover:shadow-sm ${
                            e ? "border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5" : "border-dashed border-border/60 hover:border-primary/40 hover:bg-accent"
                          }`}
                        >
                          {e ? (
                            <>
                              <div className="font-semibold text-foreground">{subj?.name ?? "—"}</div>
                              {tch && <div className="text-muted-foreground">{tch.full_name}</div>}
                              {e.room && <Badge variant="secondary" className="mt-1 text-[9px]">Rm {e.room}</Badge>}
                            </>
                          ) : (
                            <span className="text-muted-foreground/60">+ Assign</span>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={cellOpen} onOpenChange={setCellOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {cell && `${DAYS[cell.day]} · ${cell.period.name}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Subject</Label>
              <Select value={cellForm.subject_id} onValueChange={(v) => setCellForm({ ...cellForm, subject_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>
                  {(subjectsQ.data ?? []).map((s) => <SelectItem key={s.id} value={s.id}>{s.name}{s.code && ` (${s.code})`}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Teacher</Label>
              <Select value={cellForm.teacher_id} onValueChange={(v) => setCellForm({ ...cellForm, teacher_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                <SelectContent>
                  {(teachersQ.data ?? []).map((t) => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Room (optional)</Label>
              <Input value={cellForm.room} onChange={(e) => setCellForm({ ...cellForm, room: e.target.value })} placeholder="e.g. 101, Lab A" />
            </div>
          </div>
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="ghost" className="text-destructive" disabled={!currentEntry || clearCellMut.isPending} onClick={() => clearCellMut.mutate()}>
              <Trash2 className="mr-2 h-4 w-4" /> Clear
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCellOpen(false)}>Cancel</Button>
              <Button className="bg-gradient-primary shadow-glow" disabled={saveCellMut.isPending} onClick={() => saveCellMut.mutate()}>
                {saveCellMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
