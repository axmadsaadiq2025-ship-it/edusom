import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { BookOpen, Plus, Loader2, Layers } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/classes/")({
  component: ClassesPage,
});

interface Klass {
  id: string;
  school_id: string;
  name: string;
  level: number | null;
}
interface Section {
  id: string;
  school_id: string;
  class_id: string;
  name: string;
  capacity: number | null;
}

function ClassesPage() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [classOpen, setClassOpen] = useState(false);
  const [sectionOpen, setSectionOpen] = useState(false);
  const [classForm, setClassForm] = useState({ name: "", level: "" });
  const [sectionForm, setSectionForm] = useState({ class_id: "", name: "", capacity: "" });

  const classesQ = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .order("level", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as Klass[];
    },
  });

  const sectionsQ = useQuery({
    queryKey: ["sections"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sections").select("*").order("name");
      if (error) throw error;
      return (data ?? []) as Section[];
    },
  });

  const createClass = useMutation({
    mutationFn: async () => {
      if (!profile?.school_id) throw new Error("No school assigned to your account");
      const { error } = await supabase.from("classes").insert({
        school_id: profile.school_id,
        name: classForm.name.trim(),
        level: classForm.level ? Number(classForm.level) : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Class created");
      qc.invalidateQueries({ queryKey: ["classes"] });
      setClassOpen(false);
      setClassForm({ name: "", level: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createSection = useMutation({
    mutationFn: async () => {
      if (!profile?.school_id) throw new Error("No school assigned to your account");
      const { error } = await supabase.from("sections").insert({
        school_id: profile.school_id,
        class_id: sectionForm.class_id,
        name: sectionForm.name.trim(),
        capacity: sectionForm.capacity ? Number(sectionForm.capacity) : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Section created");
      qc.invalidateQueries({ queryKey: ["sections"] });
      setSectionOpen(false);
      setSectionForm({ class_id: "", name: "", capacity: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const classes = classesQ.data ?? [];
  const sections = sectionsQ.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Classes & Sections</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure grade levels and their sections for student enrollment.
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={classOpen} onOpenChange={setClassOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-1.5 h-4 w-4" /> Class
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New class</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={classForm.name}
                    onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                    placeholder="Grade 5"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Level (optional)</Label>
                  <Input
                    type="number"
                    value={classForm.level}
                    onChange={(e) => setClassForm({ ...classForm, level: e.target.value })}
                    placeholder="5"
                    className="mt-1.5"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setClassOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => createClass.mutate()}
                  disabled={createClass.isPending || !classForm.name}
                  className="bg-gradient-primary shadow-glow"
                >
                  {createClass.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={sectionOpen} onOpenChange={setSectionOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary shadow-glow" disabled={classes.length === 0}>
                <Plus className="mr-1.5 h-4 w-4" /> Section
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New section</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Class</Label>
                  <Select
                    value={sectionForm.class_id}
                    onValueChange={(v) => setSectionForm({ ...sectionForm, class_id: v })}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select a class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Section name</Label>
                  <Input
                    value={sectionForm.name}
                    onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
                    placeholder="A"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Capacity (optional)</Label>
                  <Input
                    type="number"
                    value={sectionForm.capacity}
                    onChange={(e) => setSectionForm({ ...sectionForm, capacity: e.target.value })}
                    placeholder="30"
                    className="mt-1.5"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setSectionOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => createSection.mutate()}
                  disabled={createSection.isPending || !sectionForm.class_id || !sectionForm.name}
                  className="bg-gradient-primary shadow-glow"
                >
                  {createSection.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {classesQ.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : classes.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <div className="bg-gradient-primary shadow-glow mx-auto flex h-14 w-14 items-center justify-center rounded-2xl">
            <BookOpen className="h-6 w-6 text-primary-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No classes yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Start by creating a class (e.g. Grade 1) and add sections beneath it.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {classes.map((c) => {
            const kSections = sections.filter((s) => s.class_id === c.id);
            return (
              <div key={c.id} className="glass rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-primary shadow-glow flex h-11 w-11 items-center justify-center rounded-xl text-primary-foreground">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold">{c.name}</h3>
                    {c.level != null && (
                      <p className="text-xs text-muted-foreground">Level {c.level}</p>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {kSections.length === 0 ? (
                    <span className="text-xs text-muted-foreground">No sections yet</span>
                  ) : (
                    kSections.map((s) => (
                      <span
                        key={s.id}
                        className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium"
                      >
                        <Layers className="h-3 w-3" /> {s.name}
                        {s.capacity != null && (
                          <span className="text-muted-foreground">· {s.capacity}</span>
                        )}
                      </span>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
