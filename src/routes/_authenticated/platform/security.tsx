import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, Lock, KeyRound, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  PlatformHeader,
  PlatformPanel,
  usePlatformGuard,
} from "@/components/platform/primitives";
import { Badge } from "@/components/ui/badge";
import { roleLabel, type AppRole } from "@/lib/roles";

export const Route = createFileRoute("/_authenticated/platform/security")({
  head: () => ({
    meta: [
      { title: "Security · EduSom Console" },
      {
        name: "description",
        content: "Security posture of the EduSom platform — access control, policies and privileged accounts.",
      },
      { property: "og:title", content: "Security · EduSom Console" },
      {
        property: "og:description",
        content: "Access control and privileged account overview for EduSom.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SecurityPage,
});

const CONTROLS = [
  { icon: Lock, name: "Row level security", note: "Every tenant table is policy protected" },
  { icon: UserCheck, name: "Approval-gated access", note: "No school can sign in before approval" },
  { icon: KeyRound, name: "Role separation", note: "Roles stored apart from profiles" },
  { icon: ShieldCheck, name: "Managed password hashing", note: "Handled by the auth service" },
];

function SecurityPage() {
  const { isSuper } = usePlatformGuard();

  const { data: privileged } = useQuery({
    queryKey: ["platform-privileged"],
    enabled: isSuper,
    queryFn: async () => {
      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("role", ["super_admin", "school_owner", "principal"]);
      if (error) throw error;
      const ids = [...new Set((roles ?? []).map((r) => r.user_id))];
      if (ids.length === 0) return [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", ids);
      return (profiles ?? []).map((p) => ({
        ...p,
        roles: (roles ?? []).filter((r) => r.user_id === p.id).map((r) => r.role as AppRole),
      }));
    },
  });

  return (
    <div className="space-y-6">
      <PlatformHeader
        icon={ShieldCheck}
        title="Security"
        description="How access is controlled across the platform, and who holds privileged roles."
      />

      <PlatformPanel title="Active controls">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {CONTROLS.map((c) => (
            <div
              key={c.name}
              className="flex items-center gap-3 rounded-xl border border-border/70 bg-card/50 p-4"
            >
              <c.icon className="h-4 w-4 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.note}</p>
              </div>
              <Badge className="bg-gradient-primary shrink-0">Enabled</Badge>
            </div>
          ))}
        </div>
      </PlatformPanel>

      <PlatformPanel title="Privileged accounts" description="Super Admins, owners and principals">
        <div className="space-y-2">
          {(privileged ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">No privileged accounts found.</p>
          )}
          {(privileged ?? []).map((p) => (
            <div
              key={p.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-border/70 bg-card/50 p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{p.full_name ?? "—"}</p>
                <p className="truncate text-xs text-muted-foreground">{p.email ?? "—"}</p>
              </div>
              <div className="flex flex-wrap gap-1">
                {p.roles.map((r) => (
                  <Badge key={r} variant="secondary" className="text-[10px]">
                    {roleLabel(r)}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PlatformPanel>
    </div>
  );
}
