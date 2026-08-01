import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2, Save, Settings as SettingsIcon, Users2, School } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { roleLabel } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings/")({
  component: SettingsPage,
  head: () => ({
    meta: [
      { title: "Settings · EduSom School Management" },
      {
        name: "description",
        content:
          "Manage your EduSom profile and school details — name, contact information, timezone and currency.",
      },
      { property: "og:title", content: "Settings · EduSom" },
      {
        property: "og:description",
        content: "Manage your EduSom profile and school configuration.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function SettingsPage() {
  const { user, profile, roles } = useAuth();
  const qc = useQueryClient();

  const [me, setMe] = useState({ full_name: "", phone: "" });
  const [school, setSchool] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    timezone: "",
    currency: "",
  });

  useEffect(() => {
    if (profile)
      setMe({ full_name: profile.full_name ?? "", phone: profile.phone ?? "" });
  }, [profile]);

  const schoolQ = useQuery({
    queryKey: ["school", profile?.school_id],
    enabled: !!profile?.school_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schools")
        .select("id,name,slug,address,phone,email,timezone,currency")
        .eq("id", profile!.school_id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (schoolQ.data)
      setSchool({
        name: schoolQ.data.name ?? "",
        address: schoolQ.data.address ?? "",
        phone: schoolQ.data.phone ?? "",
        email: schoolQ.data.email ?? "",
        timezone: schoolQ.data.timezone ?? "",
        currency: schoolQ.data.currency ?? "",
      });
  }, [schoolQ.data]);

  const saveMe = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: me.full_name.trim() || null,
          phone: me.phone.trim() || null,
        })
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile saved");
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message || "Failed"),
  });

  const saveSchool = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("schools")
        .update({
          name: school.name.trim(),
          address: school.address.trim() || null,
          phone: school.phone.trim() || null,
          email: school.email.trim() || null,
          timezone: school.timezone.trim() || "Africa/Mogadishu",
          currency: school.currency.trim() || "USD",
        })
        .eq("id", profile!.school_id!);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("School updated");
      qc.invalidateQueries({ queryKey: ["school"] });
    },
    onError: (e: Error) => toast.error(e.message || "Failed"),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your account details and school configuration.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/settings/users">
            <Users2 className="mr-1.5 h-4 w-4" /> Users &amp; roles
          </Link>
        </Button>
      </div>

      <div className="glass space-y-4 rounded-2xl p-6">
        <div className="flex items-center gap-2">
          <SettingsIcon className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-wider">My profile</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Full name</Label>
            <Input
              value={me.full_name}
              onChange={(e) => setMe({ ...me, full_name: e.target.value })}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Phone</Label>
            <Input
              value={me.phone}
              onChange={(e) => setMe({ ...me, phone: e.target.value })}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={user?.email ?? ""} disabled className="mt-1.5" />
          </div>
          <div>
            <Label>Roles</Label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {roles.length === 0 ? (
                <span className="text-sm text-muted-foreground">No roles assigned</span>
              ) : (
                roles.map((r) => (
                  <Badge key={r} variant="secondary">
                    {roleLabel(r)}
                  </Badge>
                ))
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            onClick={() => saveMe.mutate()}
            disabled={saveMe.isPending}
            className="bg-gradient-primary shadow-glow"
          >
            {saveMe.isPending ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1.5 h-4 w-4" />
            )}
            Save profile
          </Button>
        </div>
      </div>

      <div className="glass space-y-4 rounded-2xl p-6">
        <div className="flex items-center gap-2">
          <School className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-wider">School</h2>
        </div>
        {!profile?.school_id ? (
          <p className="text-sm text-muted-foreground">
            You are not assigned to a school yet.
          </p>
        ) : schoolQ.isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>School name</Label>
                <Input
                  value={school.name}
                  onChange={(e) => setSchool({ ...school, name: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Contact phone</Label>
                <Input
                  value={school.phone}
                  onChange={(e) => setSchool({ ...school, phone: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Contact email</Label>
                <Input
                  value={school.email}
                  onChange={(e) => setSchool({ ...school, email: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Timezone</Label>
                <Input
                  value={school.timezone}
                  onChange={(e) => setSchool({ ...school, timezone: e.target.value })}
                  placeholder="Africa/Mogadishu"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Currency</Label>
                <Input
                  value={school.currency}
                  onChange={(e) => setSchool({ ...school, currency: e.target.value })}
                  placeholder="USD"
                  className="mt-1.5"
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Address</Label>
                <Textarea
                  rows={2}
                  value={school.address}
                  onChange={(e) => setSchool({ ...school, address: e.target.value })}
                  className="mt-1.5"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  if (!school.name.trim()) {
                    toast.error("School name is required");
                    return;
                  }
                  saveSchool.mutate();
                }}
                disabled={saveSchool.isPending}
                className="bg-gradient-primary shadow-glow"
              >
                {saveSchool.isPending ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-1.5 h-4 w-4" />
                )}
                Save school
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
