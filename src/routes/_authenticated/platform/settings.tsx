import { createFileRoute } from "@tanstack/react-router";
import { SlidersHorizontal, Globe, Palette, Languages, Coins } from "lucide-react";
import {
  PlatformHeader,
  PlatformPanel,
  usePlatformGuard,
} from "@/components/platform/primitives";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/platform/settings")({
  head: () => ({
    meta: [
      { title: "Platform Settings · EduSom Console" },
      {
        name: "description",
        content: "Global EduSom defaults — branding, locale, currency and tenant provisioning rules.",
      },
      { property: "og:title", content: "Platform Settings · EduSom Console" },
      {
        property: "og:description",
        content: "Global defaults applied to every school provisioned on EduSom.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlatformSettingsPage,
});

const DEFAULTS = [
  { icon: Globe, label: "Platform domain", value: "edusom.lovable.app" },
  { icon: Languages, label: "Default language", value: "English" },
  { icon: Coins, label: "Default currency", value: "USD" },
  { icon: Globe, label: "Default timezone", value: "Africa/Mogadishu" },
  { icon: Palette, label: "Brand theme", value: "EduSom Purple / White" },
];

const PROVISIONING = [
  "School tenant record with a generated School ID",
  "School administrator account, unblocked on approval",
  "School Owner / Principal role assignment",
  "Active subscription on the requested plan",
  "Default academic year for the current school year",
  "Default workspace settings (currency, timezone, locale)",
];

function PlatformSettingsPage() {
  usePlatformGuard();
  return (
    <div className="space-y-6">
      <PlatformHeader
        icon={SlidersHorizontal}
        title="Platform Settings"
        description="Global defaults applied to every school provisioned on EduSom Cloud."
      />

      <PlatformPanel title="Global defaults">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DEFAULTS.map((d) => (
            <div
              key={d.label}
              className="flex items-center gap-3 rounded-xl border border-border/70 bg-card/50 p-4"
            >
              <d.icon className="h-4 w-4 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">{d.label}</p>
                <p className="truncate text-sm font-medium text-foreground">{d.value}</p>
              </div>
            </div>
          ))}
        </div>
      </PlatformPanel>

      <PlatformPanel
        title="Automatic provisioning"
        description="Created for each school the moment a registration request is approved"
      >
        <ul className="space-y-2">
          {PROVISIONING.map((p) => (
            <li
              key={p}
              className="flex items-center gap-3 rounded-xl border border-border/70 bg-card/50 px-4 py-3"
            >
              <Badge className="bg-gradient-primary shrink-0 text-[10px]">Auto</Badge>
              <span className="text-sm text-foreground">{p}</span>
            </li>
          ))}
        </ul>
      </PlatformPanel>
    </div>
  );
}
