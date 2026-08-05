import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Building2, GraduationCap, Search, UserSquare2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PlatformHeader, PlatformPanel, usePlatformGuard } from "@/components/platform/primitives";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/platform/schools/")({
  head: () => ({
    meta: [
      { title: "School Management · EduSom Console" },
      { name: "description", content: "Manage every school tenant on the EduSom platform." },
      { property: "og:title", content: "School Management · EduSom Console" },
      { property: "og:description", content: "Platform-wide school management for EduSom." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlatformSchoolsPage,
});

function PlatformSchoolsPage() {
  const { isSuper } = usePlatformGuard();
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["platform-schools"],
    enabled: isSuper,
    queryFn: async () => {
      const { data: schools, error } = await supabase.from("schools").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return Promise.all((schools ?? []).map(async (school) => {
        const [students, teachers] = await Promise.all([
          supabase.from("students").select("*", { count: "exact", head: true }).eq("school_id", school.id),
          supabase.from("teachers").select("*", { count: "exact", head: true }).eq("school_id", school.id),
        ]);
        return { ...school, students: students.count ?? 0, teachers: teachers.count ?? 0 };
      }));
    },
  });

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (data ?? []).filter((school) =>
      [school.name, school.school_code, school.email, school.city, school.country]
        .filter(Boolean).join(" ").toLowerCase().includes(query),
    );
  }, [data, search]);

  return (
    <div className="space-y-6">
      <PlatformHeader icon={Building2} title="School Management" description="View and manage every school tenant without entering its school dashboard." />
      <PlatformPanel>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search schools, codes, email or location…" className="pl-9" />
        </div>
      </PlatformPanel>
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-48 rounded-2xl" />)}</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((school) => (
            <Link key={school.id} to="/platform/schools/$schoolId" params={{ schoolId: school.id }} className="glass group rounded-2xl p-5 shadow-sm transition-shadow hover:shadow-elegant">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="bg-gradient-primary shadow-glow flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-primary-foreground"><Building2 className="h-5 w-5" /></div>
                  <div className="min-w-0"><h2 className="truncate font-semibold text-foreground">{school.name}</h2><p className="text-xs text-muted-foreground">{school.school_code ?? school.slug}</p></div>
                </div>
                <Badge variant={school.is_active ? "default" : "secondary"}>{school.is_active ? "Active" : "Suspended"}</Badge>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 border-y border-border/60 py-4">
                <div><p className="flex items-center gap-1.5 text-xs text-muted-foreground"><GraduationCap className="h-3.5 w-3.5" /> Students</p><p className="mt-1 font-semibold text-foreground">{school.students.toLocaleString()}</p></div>
                <div><p className="flex items-center gap-1.5 text-xs text-muted-foreground"><UserSquare2 className="h-3.5 w-3.5" /> Teachers</p><p className="mt-1 font-semibold text-foreground">{school.teachers.toLocaleString()}</p></div>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs"><span className="capitalize text-muted-foreground">{school.plan} · {school.subscription_status}</span><span className="flex items-center gap-1 font-medium text-primary">View details <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></span></div>
            </Link>
          ))}
          {rows.length === 0 && <PlatformPanel className="md:col-span-2 xl:col-span-3"><p className="py-10 text-center text-sm text-muted-foreground">No schools match your search.</p></PlatformPanel>}
        </div>
      )}
    </div>
  );
}