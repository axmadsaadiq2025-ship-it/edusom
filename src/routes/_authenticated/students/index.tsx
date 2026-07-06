import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { GraduationCap, Plus, Search, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/students/")({
  component: StudentsPage,
});

interface Student {
  id: string;
  admission_number: string;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  gender: "male" | "female" | "other" | null;
  date_of_birth: string | null;
  phone: string | null;
  email: string | null;
  photo_url: string | null;
  status: "active" | "inactive" | "graduated" | "transferred" | "suspended";
  class_id: string | null;
  section_id: string | null;
  guardian_name: string | null;
  admission_date: string;
}

const STATUS_STYLES: Record<Student["status"], string> = {
  active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  inactive: "bg-muted text-muted-foreground",
  graduated: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  transferred: "bg-amber-500/15 text-amber-700 dark:text-amber-500",
  suspended: "bg-destructive/15 text-destructive",
};

function StudentsPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [classId, setClassId] = useState<string>("all");

  const studentsQ = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select(
          "id,admission_number,first_name,last_name,middle_name,gender,date_of_birth,phone,email,photo_url,status,class_id,section_id,guardian_name,admission_date",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Student[];
    },
  });

  const classesQ = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("classes").select("id,name").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const sectionsQ = useQuery({
    queryKey: ["sections"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sections").select("id,name,class_id");
      if (error) throw error;
      return data ?? [];
    },
  });

  const classMap = useMemo(
    () => Object.fromEntries((classesQ.data ?? []).map((c) => [c.id, c.name])),
    [classesQ.data],
  );
  const sectionMap = useMemo(
    () => Object.fromEntries((sectionsQ.data ?? []).map((s) => [s.id, s.name])),
    [sectionsQ.data],
  );

  const filtered = (studentsQ.data ?? []).filter((s) => {
    if (status !== "all" && s.status !== status) return false;
    if (classId !== "all" && s.class_id !== classId) return false;
    const hay = `${s.first_name} ${s.last_name} ${s.admission_number} ${s.email ?? ""} ${s.phone ?? ""}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  const isLoading = studentsQ.isLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Students</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage student admissions, enrollment, and profiles.
          </p>
        </div>
        <Button asChild className="bg-gradient-primary shadow-glow">
          <Link to="/students/new">
            <Plus className="mr-1.5 h-4 w-4" /> New student
          </Link>
        </Button>
      </div>

      <div className="glass flex flex-col items-stretch gap-3 rounded-2xl p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, admission number, email…"
            className="h-10 rounded-xl border-transparent bg-muted pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-10 w-36 rounded-xl border-transparent bg-muted">
              <div className="flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="graduated">Graduated</SelectItem>
              <SelectItem value="transferred">Transferred</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
          <Select value={classId} onValueChange={setClassId}>
            <SelectTrigger className="h-10 w-36 rounded-xl border-transparent bg-muted">
              <SelectValue placeholder="Class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All classes</SelectItem>
              {(classesQ.data ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <div className="bg-gradient-primary shadow-glow mx-auto flex h-14 w-14 items-center justify-center rounded-2xl">
            <GraduationCap className="h-6 w-6 text-primary-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No students found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {(studentsQ.data?.length ?? 0) === 0
              ? "Admit your first student to get started."
              : "Try changing your filters or search."}
          </p>
          {(studentsQ.data?.length ?? 0) === 0 && (
            <Button asChild className="bg-gradient-primary shadow-glow mt-6">
              <Link to="/students/new">
                <Plus className="mr-1.5 h-4 w-4" /> Admit student
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="glass overflow-hidden rounded-2xl">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead className="hidden md:table-cell">Admission #</TableHead>
                <TableHead className="hidden md:table-cell">Class</TableHead>
                <TableHead className="hidden lg:table-cell">Guardian</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => {
                const initials = `${s.first_name[0] ?? ""}${s.last_name[0] ?? ""}`.toUpperCase();
                return (
                  <TableRow key={s.id} className="cursor-pointer">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          {s.photo_url && <AvatarImage src={s.photo_url} alt="" />}
                          <AvatarFallback className="bg-gradient-primary text-xs font-semibold text-primary-foreground">
                            {initials || "S"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {s.first_name} {s.last_name}
                          </div>
                          <div className="text-xs text-muted-foreground md:hidden">
                            {s.admission_number}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden font-mono text-xs md:table-cell">
                      {s.admission_number}
                    </TableCell>
                    <TableCell className="hidden text-sm md:table-cell">
                      {s.class_id ? classMap[s.class_id] ?? "—" : "—"}
                      {s.section_id ? ` · ${sectionMap[s.section_id] ?? ""}` : ""}
                    </TableCell>
                    <TableCell className="hidden text-sm lg:table-cell">
                      {s.guardian_name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_STYLES[s.status]} variant="secondary">
                        {s.status}
                      </Badge>
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
