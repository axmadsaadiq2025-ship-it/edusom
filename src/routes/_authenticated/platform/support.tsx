import { createFileRoute } from "@tanstack/react-router";
import { LifeBuoy, Mail, Phone } from "lucide-react";
import {
  PlatformHeader,
  PlatformPanel,
  PlatformEmpty,
  usePlatformGuard,
} from "@/components/platform/primitives";
import { StatCard } from "@/components/dashboard/stat-card";

export const Route = createFileRoute("/_authenticated/platform/support")({
  head: () => ({
    meta: [
      { title: "Support Tickets · EduSom Console" },
      {
        name: "description",
        content: "Support queue for schools on EduSom — open, pending and resolved conversations.",
      },
      { property: "og:title", content: "Support Tickets · EduSom Console" },
      {
        property: "og:description",
        content: "Handle school support conversations from the EduSom console.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SupportPage,
});

function SupportPage() {
  usePlatformGuard();
  return (
    <div className="space-y-6">
      <PlatformHeader
        icon={LifeBuoy}
        title="Support Tickets"
        description="Conversations raised by schools using EduSom Cloud."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Open" value="0" icon={LifeBuoy} trend="Needs a reply" accent="warning" />
        <StatCard label="In progress" value="0" icon={LifeBuoy} trend="Being handled" accent="primary" />
        <StatCard label="Resolved" value="0" icon={LifeBuoy} trend="All time" accent="success" />
      </div>

      <PlatformPanel title="Ticket queue">
        <PlatformEmpty
          icon={LifeBuoy}
          title="No support tickets"
          body="Nothing in the queue right now. School requests submitted through the channels below will appear here."
        />
      </PlatformPanel>

      <PlatformPanel title="Support channels" description="Where schools can reach the platform team">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-card/50 p-4">
            <Mail className="h-4 w-4 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">support@edusom.so</p>
              <p className="text-xs text-muted-foreground">Email · replies within 24 hours</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-card/50 p-4">
            <Phone className="h-4 w-4 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">+252 61 000 0000</p>
              <p className="text-xs text-muted-foreground">Phone · Sun–Thu, 08:00–17:00 EAT</p>
            </div>
          </div>
        </div>
      </PlatformPanel>
    </div>
  );
}
