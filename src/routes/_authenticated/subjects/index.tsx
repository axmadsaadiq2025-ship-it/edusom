import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { BookOpen, Plus, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
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

export const Route = createFileRoute("/_authenticated/subjects/")({
  component: SubjectsPage,
});

interface Subject {
  id: string;
  name: string;
  code: string;
  description: string | null;
}

function SubjectsPage() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", description: "" });

  const subjectsQ = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subjects")
        .select("id,name,code,description")
        .order("name");
      if (error) throw error;
      return (data ?? []) as Subject[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!profile?.school_id) throw new Error("No school assigned to your account");
      const { error } = await supabase.from("subjects").insert({
        school_id: profile.school_id,
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        description: form.description.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Subject created");
      qc.invalidateQueries({ queryKey: ["subjects"] });
      setOpen(false);
      setForm({ name: "", code: "", description: "" });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to create subject"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("subjects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Subject deleted");
      qc.invalidateQueries({ queryKey: ["subjects"] });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to delete"),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Subjects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Define the subjects taught at your school.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary shadow-glow">
              <Plus className="mr-1.5 h-4 w-4" /> New subject
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New subject</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Mathematics"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Code *</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="MATH"
                  className="mt-1.5 font-mono uppercase"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="mt-1.5"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!form.name || !form.code) {
                    toast.error("Name and code are required");
                    return;
                  }
                  create.mutate();
                }}
                disabled={create.isPending}
                className="bg-gradient-primary shadow-glow"
              >
                {create.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {subjectsQ.isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 rounded-xl" />
          ))}
        </div>
      ) : (subjectsQ.data ?? []).length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <div className="bg-gradient-primary shadow-glow mx-auto flex h-14 w-14 items-center justify-center rounded-2xl">
            <BookOpen className="h-6 w-6 text-primary-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No subjects yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create the first subject to assign to teachers.
          </p>
        </div>
      ) : (
        <div className="glass overflow-hidden rounded-2xl">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead className="hidden md:table-cell">Description</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(subjectsQ.data ?? []).map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="font-mono text-xs">{s.code}</TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                    {s.description ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => remove.mutate(s.id)}
                      disabled={remove.isPending}
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
