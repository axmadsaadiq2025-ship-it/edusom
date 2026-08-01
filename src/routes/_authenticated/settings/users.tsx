import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowLeft,
  Copy,
  Loader2,
  Mail,
  Plus,
  Trash2,
  UserPlus,
  Users2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { ALL_ROLES, roleLabel, type AppRole } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatCard } from "@/components/dashboard/stat-card";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings/users")({
  component: UsersPage,
  head: () => ({
    meta: [
      { title: "Users & Roles · EduSom School Management" },
      {
        name: "description",
        content:
          "Invite staff to your school, assign EduSom roles and manage member access permissions.",
      },
      { property: "og:title", content: "Users & Roles · EduSom" },
      {
        property: "og:description",
        content: "Invite staff and manage role-based access in EduSom.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const INVITE_ROLES: AppRole[] = ALL_ROLES.filter((r) => r !== "super_admin");

interface Member {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  is_active: boolean;
}

function UsersPage() {
  const { profile, user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{ email: string; role: AppRole }>({
    email: "",
    role: "teacher",
  });

  const membersQ = useQuery({
    queryKey: ["members", profile?.school_id],
    enabled: !!profile?.school_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,full_name,email,phone,is_active")
        .eq("school_id", profile!.school_id!)
        .order("full_name");
      if (error) throw error;
      return (data ?? []) as Member[];
    },
  });

  const rolesQ = useQuery({
    queryKey: ["member_roles", profile?.school_id],
    enabled: !!profile?.school_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id,role,id");
      if (error) throw error;
      return (data ?? []) as { user_id: string; role: AppRole; id: string }[];
    },
  });

  const invitesQ = useQuery({
    queryKey: ["invitations", profile?.school_id],
    enabled: !!profile?.school_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invitations")
        .select("id,email,role,token,expires_at,accepted_at,created_at")
        .eq("school_id", profile!.school_id!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const invite = useMutation({
    mutationFn: async () => {
      if (!profile?.school_id) throw new Error("No school assigned");
      const token = crypto.randomUUID().replace(/-/g, "");
      const expires = new Date();
      expires.setDate(expires.getDate() + 14);
      const { error } = await supabase.from("invitations").insert({
        email: form.email.trim().toLowerCase(),
        school_id: profile.school_id,
        role: form.role,
        token,
        invited_by: user?.id ?? null,
        expires_at: expires.toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Invitation created");
      qc.invalidateQueries({ queryKey: ["invitations"] });
      setOpen(false);
      setForm({ email: "", role: "teacher" });
    },
    onError: (e: Error) => toast.error(e.message || "Failed"),
  });

  const revoke = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("invitations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Invitation revoked");
      qc.invalidateQueries({ queryKey: ["invitations"] });
    },
    onError: (e: Error) => toast.error(e.message || "Failed"),
  });

  const addRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase.from("user_roles").insert({
        user_id: userId,
        role,
        school_id: profile?.school_id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Role assigned");
      qc.invalidateQueries({ queryKey: ["member_roles"] });
    },
    onError: (e: Error) => toast.error(e.message || "Failed"),
  });

  const removeRole = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_roles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Role removed");
      qc.invalidateQueries({ queryKey: ["member_roles"] });
    },
    onError: (e: Error) => toast.error(e.message || "Failed"),
  });

  const members = membersQ.data ?? [];
  const invites = invitesQ.data ?? [];
  const pending = invites.filter((i) => !i.accepted_at);

  function rolesFor(id: string) {
    return (rolesQ.data ?? []).filter((r) => r.user_id === id);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Button variant="ghost" size="sm" asChild className="-ml-2 mb-1">
            <Link to="/settings">
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Settings
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Users &amp; roles
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Invite staff and control what each member can access.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary shadow-glow">
              <UserPlus className="mr-1.5 h-4 w-4" /> Invite user
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Invite user</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="name@school.so"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Role *</Label>
                <Select
                  value={form.role}
                  onValueChange={(v) => setForm({ ...form, role: v as AppRole })}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INVITE_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {roleLabel(r)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                The invite link is valid for 14 days. Share it with the person so they
                can create their account.
              </p>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!form.email.trim()) {
                    toast.error("Email is required");
                    return;
                  }
                  invite.mutate();
                }}
                disabled={invite.isPending}
                className="bg-gradient-primary shadow-glow"
              >
                {invite.isPending && (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                )}
                Create invite
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Members" value={members.length.toString()} icon={Users2} />
        <StatCard label="Pending invites" value={pending.length.toString()} icon={Mail} />
        <StatCard
          label="Role assignments"
          value={(rolesQ.data ?? []).length.toString()}
          icon={Plus}
        />
      </div>

      <div className="glass overflow-hidden rounded-2xl">
        <div className="border-b border-border/60 px-4 py-3 text-sm font-semibold">
          Members
        </div>
        {membersQ.isLoading ? (
          <div className="space-y-2 p-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 rounded-xl" />
            ))}
          </div>
        ) : members.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No members yet. Invite your team to get started.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead className="w-48">Assign role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">
                    {m.full_name ?? "—"}
                    {m.id === user?.id && (
                      <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden text-sm md:table-cell">
                    {m.email ?? "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      {rolesFor(m.id).length === 0 ? (
                        <span className="text-xs text-muted-foreground">None</span>
                      ) : (
                        rolesFor(m.id).map((r) => (
                          <Badge
                            key={r.id}
                            variant="secondary"
                            className="cursor-pointer gap-1"
                            onClick={() => {
                              if (confirm(`Remove ${roleLabel(r.role)} role?`))
                                removeRole.mutate(r.id);
                            }}
                          >
                            {roleLabel(r.role)}
                            <Trash2 className="h-3 w-3" />
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value=""
                      onValueChange={(v) =>
                        addRole.mutate({ userId: m.id, role: v as AppRole })
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Add role…" />
                      </SelectTrigger>
                      <SelectContent>
                        {INVITE_ROLES.map((r) => (
                          <SelectItem key={r} value={r}>
                            {roleLabel(r)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="glass overflow-hidden rounded-2xl">
        <div className="border-b border-border/60 px-4 py-3 text-sm font-semibold">
          Invitations
        </div>
        {invitesQ.isLoading ? (
          <div className="space-y-2 p-4">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-12 rounded-xl" />
            ))}
          </div>
        ) : invites.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No invitations sent yet.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="hidden md:table-cell">Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {invites.map((i) => {
                const expired = new Date(i.expires_at) < new Date();
                return (
                  <TableRow key={i.id}>
                    <TableCell className="font-medium">{i.email}</TableCell>
                    <TableCell>{roleLabel(i.role)}</TableCell>
                    <TableCell className="hidden text-sm md:table-cell">
                      {new Date(i.expires_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          i.accepted_at
                            ? "secondary"
                            : expired
                              ? "destructive"
                              : "outline"
                        }
                      >
                        {i.accepted_at ? "Accepted" : expired ? "Expired" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Copy invite link"
                          onClick={() => {
                            const url = `${window.location.origin}/auth?invite=${i.token}`;
                            navigator.clipboard.writeText(url);
                            toast.success("Invite link copied");
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        {!i.accepted_at && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => {
                              if (confirm(`Revoke invite for ${i.email}?`))
                                revoke.mutate(i.id);
                            }}
                            disabled={revoke.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
