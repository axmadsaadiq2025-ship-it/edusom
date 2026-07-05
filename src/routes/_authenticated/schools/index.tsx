import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Building2, Plus, Search, Globe, Mail, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/schools/")({
  component: SchoolsPage,
});

interface School {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  currency: string;
  timezone: string;
  is_active: boolean;
  created_at: string;
}

function SchoolsPage() {
  const { roles, loading } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const isSuper = roles.includes("super_admin");

  useEffect(() => {
    if (!loading && !isSuper) navigate({ to: "/dashboard", replace: true });
  }, [loading, isSuper, navigate]);

  const { data, isLoading } = useQuery({
    queryKey: ["schools"],
    enabled: isSuper,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schools")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as School[];
    },
  });

  const filtered = (data ?? []).filter((s) =>
    (s.name + s.slug + (s.email ?? "")).toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Schools</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage tenant schools across the EduSom platform.
          </p>
        </div>
        <Button asChild className="bg-gradient-primary shadow-glow">
          <Link to="/schools/new">
            <Plus className="mr-1.5 h-4 w-4" /> New school
          </Link>
        </Button>
      </div>

      <div className="glass flex items-center gap-3 rounded-2xl p-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search schools by name, slug, or email…"
            className="h-10 rounded-xl border-transparent bg-muted pl-9"
          />
        </div>
        <div className="hidden text-xs text-muted-foreground sm:block">
          {filtered.length} of {data?.length ?? 0}
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState hasAny={(data?.length ?? 0) > 0} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((s) => (
            <SchoolCard key={s.id} school={s} />
          ))}
        </div>
      )}
    </div>
  );
}

function SchoolCard({ school }: { school: School }) {
  return (
    <div className="glass group flex flex-col gap-3 rounded-2xl p-5 shadow-sm transition-shadow hover:shadow-elegant">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-primary shadow-glow flex h-11 w-11 items-center justify-center rounded-xl text-primary-foreground">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">{school.name}</h3>
            <p className="text-xs text-muted-foreground">/{school.slug}</p>
          </div>
        </div>
        <Badge variant={school.is_active ? "default" : "secondary"} className="shrink-0">
          {school.is_active ? "Active" : "Inactive"}
        </Badge>
      </div>
      <div className="space-y-1.5 text-xs text-muted-foreground">
        {school.email && (
          <div className="flex items-center gap-2">
            <Mail className="h-3.5 w-3.5" /> {school.email}
          </div>
        )}
        {school.phone && (
          <div className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5" /> {school.phone}
          </div>
        )}
        <div className="flex items-center gap-2">
          <Globe className="h-3.5 w-3.5" /> {school.timezone} · {school.currency}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ hasAny }: { hasAny: boolean }) {
  return (
    <div className="glass flex flex-col items-center justify-center rounded-2xl p-12 text-center">
      <div className="bg-gradient-primary shadow-glow flex h-14 w-14 items-center justify-center rounded-2xl">
        <Building2 className="h-6 w-6 text-primary-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-foreground">
        {hasAny ? "No matches" : "No schools yet"}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {hasAny
          ? "Try a different search term."
          : "Create your first school to start onboarding administrators and students."}
      </p>
      {!hasAny && (
        <Button asChild className="bg-gradient-primary shadow-glow mt-6">
          <Link to="/schools/new">
            <Plus className="mr-1.5 h-4 w-4" /> Create school
          </Link>
        </Button>
      )}
    </div>
  );
}
