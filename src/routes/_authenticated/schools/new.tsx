import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Building2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/schools/new")({
  component: NewSchoolPage,
});

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

function NewSchoolPage() {
  const { roles, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isSuper = roles.includes("super_admin");

  const [form, setForm] = useState({
    name: "",
    slug: "",
    email: "",
    phone: "",
    address: "",
    timezone: "Africa/Mogadishu",
    currency: "USD",
  });
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    if (!loading && !isSuper) navigate({ to: "/dashboard", replace: true });
  }, [loading, isSuper, navigate]);

  const create = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        slug: (form.slug || slugify(form.name)).trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        timezone: form.timezone.trim() || "Africa/Mogadishu",
        currency: form.currency.trim() || "USD",
      };
      const { data, error } = await supabase.from("schools").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("School created");
      qc.invalidateQueries({ queryKey: ["schools"] });
      navigate({ to: "/schools" });
    },
    onError: (e: Error) => {
      toast.error(e.message || "Failed to create school");
    },
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("School name is required");
    create.mutate();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link to="/schools">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to schools
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="bg-gradient-primary shadow-glow flex h-11 w-11 items-center justify-center rounded-xl text-primary-foreground">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">New school</h1>
            <p className="text-sm text-muted-foreground">
              Create a tenant school on the EduSom platform.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="glass space-y-5 rounded-2xl p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="name">School name *</Label>
            <Input
              id="name"
              required
              value={form.name}
              onChange={(e) => {
                const name = e.target.value;
                setForm((f) => ({
                  ...f,
                  name,
                  slug: slugTouched ? f.slug : slugify(name),
                }));
              }}
              placeholder="Mogadishu International School"
              className="mt-1.5"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="slug">URL slug *</Label>
            <Input
              id="slug"
              required
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                setForm((f) => ({ ...f, slug: slugify(e.target.value) }));
              }}
              placeholder="mogadishu-international"
              className="mt-1.5 font-mono text-sm"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Used in URLs and identifiers. Lowercase letters, numbers, and dashes.
            </p>
          </div>

          <div>
            <Label htmlFor="email">Contact email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="admin@school.edu"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="phone">Contact phone</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+252 61 234 5678"
              className="mt-1.5"
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              placeholder="Street, city, region"
              className="mt-1.5"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="timezone">Timezone</Label>
            <Input
              id="timezone"
              value={form.timezone}
              onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="currency">Currency</Label>
            <Input
              id="currency"
              value={form.currency}
              onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value.toUpperCase() }))}
              maxLength={3}
              className="mt-1.5 uppercase"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button asChild type="button" variant="ghost">
            <Link to="/schools">Cancel</Link>
          </Button>
          <Button
            type="submit"
            disabled={create.isPending}
            className="bg-gradient-primary shadow-glow"
          >
            {create.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Create school
          </Button>
        </div>
      </form>
    </div>
  );
}
