import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { allowedModules } from "@/lib/rbac";
import type { AppRole } from "@/lib/roles";
import { cn } from "@/lib/utils";

interface SearchHit {
  id: string;
  title: string;
  subtitle: string;
  type: "Student" | "Teacher" | "Parent" | "Class" | "Invoice";
  to: string;
}

export function GlobalSearch({
  roles,
  className,
}: {
  roles: readonly AppRole[];
  className?: string;
}) {
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const q = useDebouncedValue(term.trim(), 300);
  const modules = allowedModules(roles);

  const search = useQuery({
    queryKey: ["global-search", q, [...modules].sort().join(",")],
    enabled: q.length >= 2,
    staleTime: 30_000,
    queryFn: async (): Promise<SearchHit[]> => {
      const like = `%${q}%`;
      const hits: SearchHit[] = [];

      const tasks: Promise<void>[] = [];

      if (modules.has("students")) {
        tasks.push(
          (async () => {
            const { data } = await supabase
              .from("students")
              .select("id,first_name,last_name,admission_number")
              .or(
                `first_name.ilike.${like},last_name.ilike.${like},admission_number.ilike.${like}`,
              )
              .limit(5);
            for (const s of data ?? []) {
              hits.push({
                id: `student-${s.id}`,
                title: `${s.first_name} ${s.last_name}`,
                subtitle: s.admission_number,
                type: "Student",
                to: "/students",
              });
            }
          })(),
        );
      }

      if (modules.has("teachers")) {
        tasks.push(
          (async () => {
            const { data } = await supabase
              .from("teachers")
              .select("id,full_name,employee_code")
              .or(`full_name.ilike.${like},employee_code.ilike.${like}`)
              .limit(5);
            for (const t of data ?? []) {
              hits.push({
                id: `teacher-${t.id}`,
                title: t.full_name,
                subtitle: t.employee_code,
                type: "Teacher",
                to: "/teachers",
              });
            }
          })(),
        );
      }

      if (modules.has("parents")) {
        tasks.push(
          (async () => {
            const { data } = await supabase
              .from("parents")
              .select("id,first_name,last_name,phone")
              .or(`first_name.ilike.${like},last_name.ilike.${like},phone.ilike.${like}`)
              .limit(5);
            for (const p of data ?? []) {
              hits.push({
                id: `parent-${p.id}`,
                title: `${p.first_name} ${p.last_name}`,
                subtitle: p.phone ?? "Parent",
                type: "Parent",
                to: "/parents",
              });
            }
          })(),
        );
      }

      if (modules.has("classes")) {
        tasks.push(
          (async () => {
            const { data } = await supabase
              .from("classes")
              .select("id,name")
              .ilike("name", like)
              .limit(4);
            for (const c of data ?? []) {
              hits.push({
                id: `class-${c.id}`,
                title: c.name,
                subtitle: "Class",
                type: "Class",
                to: "/classes",
              });
            }
          })(),
        );
      }

      if (modules.has("fees")) {
        tasks.push(
          (async () => {
            const { data } = await supabase
              .from("fee_invoices")
              .select("id,invoice_number,status")
              .ilike("invoice_number", like)
              .limit(4);
            for (const i of data ?? []) {
              hits.push({
                id: `invoice-${i.id}`,
                title: i.invoice_number,
                subtitle: `Invoice · ${i.status}`,
                type: "Invoice",
                to: `/fees/${i.id}`,
              });
            }
          })(),
        );
      }

      await Promise.all(tasks);
      return hits;
    },
  });

  const showPanel = open && q.length >= 2;

  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={term}
        onChange={(e) => {
          setTerm(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search students, teachers, parents…"
        aria-label="Global search"
        className="h-10 rounded-xl border-transparent bg-muted pl-9 pr-9"
      />
      {term && (
        <button
          type="button"
          onClick={() => {
            setTerm("");
            setOpen(false);
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-accent"
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      {showPanel && (
        <div className="glass absolute left-0 right-0 top-12 z-50 max-h-80 overflow-y-auto rounded-2xl border border-border/60 p-2 shadow-elegant">
          {search.isFetching && (
            <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Searching…
            </div>
          )}
          {!search.isFetching && (search.data?.length ?? 0) === 0 && (
            <p className="px-3 py-3 text-sm text-muted-foreground">
              No matches for “{q}”.
            </p>
          )}
          {(search.data ?? []).map((hit) => (
            <Link
              key={hit.id}
              to={hit.to}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-accent"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{hit.title}</p>
                <p className="truncate text-xs text-muted-foreground">{hit.subtitle}</p>
              </div>
              <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {hit.type}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
