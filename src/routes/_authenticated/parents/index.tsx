import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Users, Plus, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/parents/")({
  component: ParentsPage,
});

interface Parent {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string;
  occupation: string | null;
  is_active: boolean;
  children_count: number;
}

function ParentsPage() {
  const [q, setQ] = useState("");

  const parentsQ = useQuery({
    queryKey: ["parents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parents")
        .select(
          "id,first_name,last_name,email,phone,occupation,is_active,student_parents(count)",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((p) => ({
        id: p.id,
        first_name: p.first_name,
        last_name: p.last_name,
        email: p.email,
        phone: p.phone,
        occupation: p.occupation,
        is_active: p.is_active,
        children_count:
          Array.isArray(p.student_parents) && p.student_parents[0]
            ? (p.student_parents[0] as { count: number }).count
            : 0,
      })) as Parent[];
    },
  });

  const filtered = (parentsQ.data ?? []).filter((p) => {
    const hay = `${p.first_name} ${p.last_name} ${p.email ?? ""} ${p.phone}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Parents</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage guardians and link them to their children.
          </p>
        </div>
        <Button asChild className="bg-gradient-primary shadow-glow">
          <Link to="/parents/new">
            <Plus className="mr-1.5 h-4 w-4" /> New parent
          </Link>
        </Button>
      </div>

      <div className="glass rounded-2xl p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, email, phone…"
            className="h-10 rounded-xl border-transparent bg-muted pl-9"
          />
        </div>
      </div>

      {parentsQ.isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <div className="bg-gradient-primary shadow-glow mx-auto flex h-14 w-14 items-center justify-center rounded-2xl">
            <Users className="h-6 w-6 text-primary-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No parents yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {(parentsQ.data?.length ?? 0) === 0
              ? "Add your first parent to link them with students."
              : "Try a different search."}
          </p>
          {(parentsQ.data?.length ?? 0) === 0 && (
            <Button asChild className="bg-gradient-primary shadow-glow mt-6">
              <Link to="/parents/new">
                <Plus className="mr-1.5 h-4 w-4" /> Add parent
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="glass overflow-hidden rounded-2xl">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Parent</TableHead>
                <TableHead className="hidden md:table-cell">Contact</TableHead>
                <TableHead className="hidden lg:table-cell">Occupation</TableHead>
                <TableHead className="text-center">Children</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => {
                const initials = `${p.first_name[0] ?? ""}${p.last_name[0] ?? ""}`.toUpperCase();
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-gradient-primary text-xs font-semibold text-primary-foreground">
                            {initials || "P"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {p.first_name} {p.last_name}
                          </div>
                          <div className="text-xs text-muted-foreground md:hidden">
                            {p.phone}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="text-sm text-foreground">{p.phone}</div>
                      <div className="text-xs text-muted-foreground">{p.email ?? "—"}</div>
                    </TableCell>
                    <TableCell className="hidden text-sm lg:table-cell">
                      {p.occupation ?? "—"}
                    </TableCell>
                    <TableCell className="text-center text-sm font-medium">
                      {p.children_count}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          p.is_active
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {p.is_active ? "Active" : "Inactive"}
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
