import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, ClipboardList, Building2, CreditCard } from "lucide-react";
import {
  PlatformHeader,
  PlatformPanel,
  PlatformEmpty,
  usePlatformGuard,
} from "@/components/platform/primitives";
import { usePlatformMetrics } from "@/components/platform/use-platform-metrics";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/platform/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications · EduSom Console" },
      {
        name: "description",
        content: "Platform alerts for pending approvals, trials ending and subscription changes.",
      },
      { property: "og:title", content: "Notifications · EduSom Console" },
      {
        property: "og:description",
        content: "Platform alerts that need a Super Admin's attention.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { isSuper } = usePlatformGuard();
  const { data: m } = usePlatformMetrics(isSuper);

  const items = [
    m && m.pendingRequests > 0
      ? {
          icon: ClipboardList,
          title: `${m.pendingRequests} registration request${m.pendingRequests === 1 ? "" : "s"} waiting`,
          body: "Approve or reject to provision or decline school access.",
          to: "/registration-requests",
          tone: "warning" as const,
        }
      : null,
    m && m.trialSchools > 0
      ? {
          icon: CreditCard,
          title: `${m.trialSchools} school${m.trialSchools === 1 ? "" : "s"} on trial`,
          body: "Review trial tenants and convert them to a paid plan.",
          to: "/platform/subscriptions",
          tone: "primary" as const,
        }
      : null,
    m && m.totalSchools > 0
      ? {
          icon: Building2,
          title: `${m.activeSchools} of ${m.totalSchools} schools active`,
          body: "Inactive tenants cannot be used by their staff until re-enabled.",
          to: "/schools",
          tone: "primary" as const,
        }
      : null,
  ].filter(Boolean) as {
    icon: typeof Bell;
    title: string;
    body: string;
    to: string;
    tone: "primary" | "warning";
  }[];

  return (
    <div className="space-y-6">
      <PlatformHeader
        icon={Bell}
        title="Notifications"
        description="Live platform alerts generated from your network's current state."
      />

      <PlatformPanel title="Alerts">
        {items.length === 0 ? (
          <PlatformEmpty
            icon={Bell}
            title="You're all caught up"
            body="No pending approvals, trials or tenant issues need your attention right now."
          />
        ) : (
          <div className="space-y-3">
            {items.map((n) => (
              <Link
                key={n.title}
                to={n.to}
                className="flex items-start gap-3 rounded-xl border border-border/70 bg-card/50 p-4 transition-colors hover:border-primary/40 hover:bg-accent"
              >
                <div className="bg-gradient-primary shadow-glow mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl">
                  <n.icon className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.body}</p>
                </div>
                <Badge variant={n.tone === "warning" ? "destructive" : "secondary"} className="shrink-0 text-[10px]">
                  {n.tone === "warning" ? "Action needed" : "Info"}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </PlatformPanel>
    </div>
  );
}
