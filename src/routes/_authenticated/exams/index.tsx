import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { GraduationCap, Plus, Loader2, Trash2, Calendar, Settings2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/exams/")({
  component: ExamsPage,
});

interface Exam {
  id: string;
  title: string;
  exam_date: string | null;
  max_marks: number;
  pass_marks: number;
  classes: { name: string } | null;
  subjects: { name: string; code: string } | null;
  exam_terms: { name: string } | null;
}

interface Term {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
}

function ExamsPage() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [termOpen, setTermOpen] = useState(false);
  const [examOpen, setExamOpen] = useState(false);
  const [termForm, setTermForm] = useState({ name: "", start_date: "", end_date: "" });
  const [examForm, setExamForm] = useState({
    title: "",
    term_id: "",
    class_id: "",
    subject_id: "",
    exam_date: "",
    max_marks: "100",
    pass_marks: "40",
  });

  const termsQ = useQuery({
    queryKey: ["exam_terms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_terms")
        .select("id,name,start_date,end_date")
        .order("start_date", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as Term[];
    },
  });

  const classesQ = useQuery({
    queryKey: ["classes-min"],
    queryFn: async () => {
      const { data, error } = await supabase.from("classes").select("id,name").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const subjectsQ = useQuery({
    queryKey: ["subjects-min"],
    queryFn: async () => {
      const { data, error } = await supabase.from("subjects").select("id,name,code").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const examsQ = useQuery({
    queryKey: ["exams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exams")
        .select(
          "id,title,exam_date,max_marks,pass_marks,classes(name),subjects(name,code),exam_terms(name)",
        )
        .order("exam_date", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as unknown as Exam[];
    },
  });

  const createTerm = useMutation({
    mutationFn: async () => {
      if (!profile?.school_id) throw new Error("No school assigned to your account");
      const { error } = await supabase.from("exam_terms").insert({
        school_id: profile.school_id,
        name: termForm.name.trim(),
        start_date: termForm.start_date || null,
        end_date: termForm.end_date || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Term created");
      qc.invalidateQueries({ queryKey: ["exam_terms"] });
      setTermOpen(false);
      setTermForm({ name: "", start_date: "", end_date: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createExam = useMutation({
    mutationFn: async () => {
      if (!profile?.school_id) throw new Error("No school assigned to your account");
      const { error } = await supabase.from("exams").insert({
        school_id: profile.school_id,
        title: examForm.title.trim(),
        term_id: examForm.term_id || null,
        class_id: examForm.class_id,
        subject_id: examForm.subject_id,
        exam_date: examForm.exam_date || null,
        max_marks: Number(examForm.max_marks) || 100,
        pass_marks: Number(examForm.pass_marks) || 40,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Exam created");
      qc.invalidateQueries({ queryKey: ["exams"] });
      setExamOpen(false);
      setExamForm({
        title: "",
        term_id: "",
        class_id: "",
        subject_id: "",
        exam_date: "",
        max_marks: "100",
        pass_marks: "40",
      });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeExam = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("exams").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Exam deleted");
      qc.invalidateQueries({ queryKey: ["exams"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Exams & Grading</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure exam terms, create subject exams, and enter marks.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Dialog open={termOpen} onOpenChange={setTermOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings2 className="mr-1.5 h-4 w-4" /> New term
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New exam term</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Name *</Label>
                  <Input
                    value={termForm.name}
                    onChange={(e) => setTermForm({ ...termForm, name: e.target.value })}
                    placeholder="Midterm 1"
                    className="mt-1.5"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Start date</Label>
                    <Input
                      type="date"
                      value={termForm.start_date}
                      onChange={(e) => setTermForm({ ...termForm, start_date: e.target.value })}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>End date</Label>
                    <Input
                      type="date"
                      value={termForm.end_date}
                      onChange={(e) => setTermForm({ ...termForm, end_date: e.target.value })}
                      className="mt-1.5"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setTermOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (!termForm.name) return toast.error("Name required");
                    createTerm.mutate();
                  }}
                  disabled={createTerm.isPending}
                  className="bg-gradient-primary shadow-glow"
                >
                  {createTerm.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={examOpen} onOpenChange={setExamOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary shadow-glow">
                <Plus className="mr-1.5 h-4 w-4" /> New exam
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New exam</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Title *</Label>
                  <Input
                    value={examForm.title}
                    onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                    placeholder="Math Midterm"
                    className="mt-1.5"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Class *</Label>
                    <select
                      value={examForm.class_id}
                      onChange={(e) => setExamForm({ ...examForm, class_id: e.target.value })}
                      className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="">Select…</option>
                      {(classesQ.data ?? []).map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Subject *</Label>
                    <select
                      value={examForm.subject_id}
                      onChange={(e) => setExamForm({ ...examForm, subject_id: e.target.value })}
                      className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="">Select…</option>
                      {(subjectsQ.data ?? []).map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Term</Label>
                    <select
                      value={examForm.term_id}
                      onChange={(e) => setExamForm({ ...examForm, term_id: e.target.value })}
                      className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="">—</option>
                      {(termsQ.data ?? []).map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Exam date</Label>
                    <Input
                      type="date"
                      value={examForm.exam_date}
                      onChange={(e) => setExamForm({ ...examForm, exam_date: e.target.value })}
                      className="mt-1.5"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Max marks</Label>
                    <Input
                      type="number"
                      value={examForm.max_marks}
                      onChange={(e) => setExamForm({ ...examForm, max_marks: e.target.value })}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>Pass marks</Label>
                    <Input
                      type="number"
                      value={examForm.pass_marks}
                      onChange={(e) => setExamForm({ ...examForm, pass_marks: e.target.value })}
                      className="mt-1.5"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setExamOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (!examForm.title || !examForm.class_id || !examForm.subject_id)
                      return toast.error("Title, class and subject are required");
                    createExam.mutate();
                  }}
                  disabled={createExam.isPending}
                  className="bg-gradient-primary shadow-glow"
                >
                  {createExam.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {(termsQ.data ?? []).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {(termsQ.data ?? []).map((t) => (
            <Badge key={t.id} variant="secondary" className="gap-1">
              <Calendar className="h-3 w-3" /> {t.name}
            </Badge>
          ))}
        </div>
      )}

      {examsQ.isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 rounded-xl" />
          ))}
        </div>
      ) : (examsQ.data ?? []).length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <div className="bg-gradient-primary shadow-glow mx-auto flex h-14 w-14 items-center justify-center rounded-2xl">
            <GraduationCap className="h-6 w-6 text-primary-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No exams yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a term and your first exam to start recording marks.
          </p>
        </div>
      ) : (
        <div className="glass overflow-hidden rounded-2xl">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead className="hidden md:table-cell">Term</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead>Max</TableHead>
                <TableHead className="w-32" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(examsQ.data ?? []).map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.title}</TableCell>
                  <TableCell>{e.classes?.name ?? "—"}</TableCell>
                  <TableCell>{e.subjects?.name ?? "—"}</TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {e.exam_terms?.name ?? "—"}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {e.exam_date ?? "—"}
                  </TableCell>
                  <TableCell>{e.max_marks}</TableCell>
                  <TableCell className="flex items-center gap-1">
                    <Button asChild size="sm" variant="outline">
                      <Link to="/exams/$id" params={{ id: e.id }}>
                        Marks
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeExam.mutate(e.id)}
                      disabled={removeExam.isPending}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
