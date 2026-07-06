import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { UserSquare2, Plus, Search, Filter } from "lucide-react";
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

export const Route = createFileRoute("/_authenticated/teachers/")({
  component: TeachersPage,
});

type EmpStatus = "active" | "on_leave" | "suspended" | "terminated" | "resigned";

interface Teacher {
  id: string;
  employee_code: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  gender: string | null;
  qualification: string | null;
  specialization: string | null;
  years_of_experience: number | null;
  joining_date: string | null;
  status: EmpStatus;
  avatar_url: string | null;
}

const STATUS_STYLES: Record<EmpStatus, string> = {
  active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  on_leave: "bg-amber-500/15 text-amber-700 dark:text-amber-500",
  suspended: "bg-destructive/15 text-destructive",
  terminated: "bg-muted text-muted-foreground",
  resigned: "bg-muted text-muted-foreground",
};

function TeachersPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");

  const teachersQ = useQuery({
    queryKey: ["teachers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teachers")
        .select(
          "id,employee_code,full_name,email,phone,gender,qualification,specialization,years_of_experience,joining_date,status,avatar_url",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Teacher[];
    },
  });

  const filtered = (teachersQ.data ?? []).filter((t) => {
    if (status !== "all" && t.status !== status) return false;
    const hay = `${t.full_name} ${t.employee_code} ${t.email ?? ""} ${t.phone ?? ""} ${t.specialization ?? ""}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Teachers</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage teaching staff, qualifications, and assignments.
          </p>
        </div>
        <Button asChild className="bg-gradient-primary shadow-glow">
          <Link to="/teachers/new">
            <Plus className="mr-1.5 h-4 w-4" /> New teacher
          </Link>
        </Button>
      </div>

      <div className="glass flex flex-col items-stretch gap-3 rounded-2xl p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, employee code, email…"
            className="h-10 rounded-xl border-transparent bg-muted pl-9"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-10 w-40 rounded-xl border-transparent bg-muted">
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5" />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="on_leave">On leave</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="terminated">Terminated</SelectItem>
            <SelectItem value="resigned">Resigned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {teachersQ.isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <div className="bg-gradient-primary shadow-glow mx-auto flex h-14 w-14 items-center justify-center rounded-2xl">
            <UserSquare2 className="h-6 w-6 text-primary-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No teachers found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {(teachersQ.data?.length ?? 0) === 0
              ? "Add your first teacher to get started."
              : "Try changing your filters or search."}
          </p>
          {(teachersQ.data?.length ?? 0) === 0 && (
            <Button asChild className="bg-gradient-primary shadow-glow mt-6">
              <Link to="/teachers/new">
                <Plus className="mr-1.5 h-4 w-4" /> Add teacher
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="glass overflow-hidden rounded-2xl">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Teacher</TableHead>
                <TableHead className="hidden md:table-cell">Employee #</TableHead>
                <TableHead className="hidden lg:table-cell">Specialization</TableHead>
                <TableHead className="hidden lg:table-cell">Experience</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => {
                const initials = t.full_name
                  .split(" ")
                  .slice(0, 2)
                  .map((s) => s[0]?.toUpperCase())
                  .join("");
                return (
                  <TableRow key={t.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          {t.avatar_url && <AvatarImage src={t.avatar_url} alt="" />}
                          <AvatarFallback className="bg-gradient-primary text-xs font-semibold text-primary-foreground">
                            {initials || "T"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium text-foreground">{t.full_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {t.email ?? t.phone ?? "—"}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden font-mono text-xs md:table-cell">
                      {t.employee_code}
                    </TableCell>
                    <TableCell className="hidden text-sm lg:table-cell">
                      {t.specialization ?? "—"}
                    </TableCell>
                    <TableCell className="hidden text-sm lg:table-cell">
                      {t.years_of_experience ? `${t.years_of_experience} yrs` : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_STYLES[t.status]} variant="secondary">
                        {t.status.replace("_", " ")}
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
