import { createFileRoute } from "@tanstack/react-router";
import { Plug, Mail, MessageSquare, CreditCard, Webhook } from "lucide-react";
import {
  PlatformHeader,
  PlatformPanel,
  usePlatformGuard,
} from "@/components/platform/primitives";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/platform/integrations")({
  head: () => ({
    meta: [
      { title: "API & Integrations · EduSom Console" },
      {
        name: "description",
        content: "Integration surface for EduSom — email, SMS, payments and webhook endpoints.",
      },
      { property: "og:title", content: "API & Integrations · EduSom Console" },
      {
        property: "og:description",
        content: "Email, SMS, payment and webhook integrations for the EduSom platform.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IntegrationsPage,
});

const INTEGRATIONS = [
  { icon: Mail, name: "Transactional email", note: "Approval and welcome messages", status: "Planned" },
  { icon: MessageSquare, name: "SMS notifications", note: "Local Somali SMS gateways", status: "Planned" },
  { icon: CreditCard, name: "Mobile money & cards", note: "Subscription collection", status: "Planned" },
  { icon: Webhook, name: "Outbound webhooks", note: "Notify external systems of events", status: "Planned" },
];

function IntegrationsPage() {
  usePlatformGuard();
  return (
    <div className="space-y-6">
      <PlatformHeader
        icon={Plug}
        title="API & Integrations"
        description="External services EduSom connects to, and the endpoints available to partners."
      />

      <PlatformPanel title="Integrations">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {INTEGRATIONS.map((i) => (
            <div
              key={i.name}
              className="flex items-center gap-3 rounded-xl border border-border/70 bg-card/50 p-4"
            >
              <i.icon className="h-4 w-4 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{i.name}</p>
                <p className="text-xs text-muted-foreground">{i.note}</p>
              </div>
              <Badge variant="outline" className="shrink-0">
                {i.status}
              </Badge>
            </div>
          ))}
        </div>
      </PlatformPanel>

      <PlatformPanel title="Public endpoints" description="Available to external callers">
        <div className="space-y-2">
          {[
            { method: "POST", path: "/api/public/webhooks/*", note: "Signed inbound webhooks" },
          ].map((e) => (
            <div
              key={e.path}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-border/70 bg-card/50 p-4"
            >
              <Badge className="bg-gradient-primary shrink-0 font-mono text-[10px]">{e.method}</Badge>
              <code className="font-mono text-xs text-foreground">{e.path}</code>
              <span className="text-xs text-muted-foreground">{e.note}</span>
            </div>
          ))}
        </div>
      </PlatformPanel>
    </div>
  );
}
