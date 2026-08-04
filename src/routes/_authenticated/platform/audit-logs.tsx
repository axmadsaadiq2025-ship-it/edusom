import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ScrollText, Building2, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  PlatformHeader,
  PlatformPanel,
  PlatformEmpty,
  usePlatformGuard,
} from "@/components/platform/primitives";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/platform/audit-logs")({
  head: () => ({
    meta: [
      { title: "Audit Logs · EduSom Console" },
      {
        name: "description",
        content: "Chronological record of platform events — school creation, approvals and rejections.",
      },
      { property: "og:title", content: "Audit Logs · EduSom Console" },
      {
        property: "og:description",
        content: "Trace platform-level activity across the EduSom network.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuditLogsPage,
});

interface Entry {
  id: string;
  at: string;
  kind: "school" | "approved" | "rejected";
  title: string;
  detail: string;
}

function AuditLogsPage() {
  const { isSuper } = usePlatformGuard();

  const { data, isLoading } = useQuery({
    queryKey: ["platform-audit"],
    enabled: isSuper,
    queryFn: async (): Promise<Entry[]> => {
      const [{ data: schools }, { data: reqs }] = await Promise.all([
        supabase
          .from("schools")
          .select("id, name, school_code, created_at")
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("school_registration_requests")
          .select("id, school_name, status, reviewed_at, rejection_reason")
          .not("reviewed_at", "is", null)
          .order("reviewed_at", { ascending: false })
          .limit(50),
      ]);

      const entries: Entry[] = [];
      for (const s of schools ?? []) {
        entries.push({
          id: `school-${s.id}`,
          at: s.created_at as string,
          kind: "school",
          title: `School provisioned — ${s.name}`,
          detail: `School ID ${s.school_code ?? "—"}`,
        });
      }
      for (const r of reqs ?? []) {
        entries.push({
          id: `req-${r.id}`,
          at: r.reviewed_at as string,
          kind: r.status === "approved" ? "approved" : "rejected",
          title: `Registration ${r.status} — ${r.school_name}`,
          detail: r.rejection_reason ?? "Reviewed by Super Admin",
        });
      }
      return entries.sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 80);
    },
  });

  const icons = { school: Building2, approved: Check, rejected: X } as const;

  return (
    <div className="space-y-6">
      <PlatformHeader
        icon={ScrollText}
        title="Audit Logs"
        description="Platform-level events recorded across schools and registration reviews."
      />

      <PlatformPanel title="Recent activity" description="Newest first">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : (data ?? []).length === 0 ? (
          <PlatformEmpty
            icon={ScrollText}
            title="No events yet"
            body="Platform events appear here as schools are provisioned and requests are reviewed."
          />
        ) : (
          <ol className="space-y-3">
            {(data ?? []).map((e) => {
              const Icon = icons[e.kind];
              return (
                <li
                  key={e.id}
                  className="flex items-start gap-3 rounded-xl border border-border/70 bg-card/50 p-4"
                >
                  <div className="bg-gradient-primary shadow-glow mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl">
                    <Icon className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{e.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{e.detail}</p>
                  </div>
                  <Badge variant="secondary" className="shrink-0 text-[10px]">
                    {new Date(e.at).toLocaleString()}
                  </Badge>
                </li>
              );
            })}
          </ol>
        )}
      </PlatformPanel>
    </div>
  );
}
