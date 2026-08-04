import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { roleLabel, type AppRole } from "@/lib/roles";
import {
  PlatformHeader,
  PlatformPanel,
  usePlatformGuard,
} from "@/components/platform/primitives";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/platform/users")({
  head: () => ({
    meta: [
      { title: "Users & Roles · EduSom Console" },
      {
        name: "description",
        content: "Every EduSom account with its assigned platform and school roles.",
      },
      { property: "og:title", content: "Users & Roles · EduSom Console" },
      {
        property: "og:description",
        content: "Directory of all platform accounts and their roles.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlatformUsersPage,
});

function PlatformUsersPage() {
  const { isSuper } = usePlatformGuard();
  const [q, setQ] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["platform-users"],
    enabled: isSuper,
    queryFn: async () => {
      const [{ data: profiles, error: pErr }, { data: rolesRows, error: rErr }, { data: schools }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("id, full_name, email, phone, school_id, is_active, created_at")
            .order("created_at", { ascending: false })
            .limit(500),
          supabase.from("user_roles").select("user_id, role, school_id"),
          supabase.from("schools").select("id, name"),
        ]);
      if (pErr) throw pErr;
      if (rErr) throw rErr;
      const schoolMap = new Map((schools ?? []).map((s) => [s.id, s.name]));
      return (profiles ?? []).map((p) => ({
        ...p,
        school: p.school_id ? (schoolMap.get(p.school_id) ?? "—") : "—",
        roles: (rolesRows ?? [])
          .filter((r) => r.user_id === p.id)
          .map((r) => r.role as AppRole),
      }));
    },
  });

  const rows = (data ?? []).filter((u) =>
    `${u.full_name ?? ""} ${u.email ?? ""} ${u.school}`.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <PlatformHeader
        icon={Users}
        title="Users & Roles"
        description="Directory of every account on the platform, with school membership and roles."
      />

      <PlatformPanel>
        <div className="relative mb-4 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email or school…"
            className="h-10 rounded-xl pl-9"
          />
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
                {rows.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.full_name ?? "—"}</TableCell>
                    <TableCell className="text-xs">{u.email ?? "—"}</TableCell>
                    <TableCell className="text-xs">{u.school}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {u.roles.length === 0 ? (
                          <span className="text-xs text-muted-foreground">No role</span>
                        ) : (
                          u.roles.map((r) => (
                            <Badge key={r} variant="secondary" className="text-[10px]">
                              {roleLabel(r)}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={u.is_active ? "default" : "outline"}
                        className={u.is_active ? "bg-gradient-primary" : ""}
                      >
                        {u.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </PlatformPanel>
    </div>
  );
}
