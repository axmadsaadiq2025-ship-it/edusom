import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Tag, Loader2, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/fees/categories")({
  component: FeeCategoriesPage,
});

interface Category {
  id: string;
  name: string;
  description: string | null;
  default_amount: number;
  is_active: boolean;
  school_id: string;
}

function FeeCategoriesPage() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const catsQ = useQuery({
    queryKey: ["fee_categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("fee_categories").select("*").order("name");
      if (error) throw error;
      return data as Category[];
    },
  });

  const [form, setForm] = useState({ name: "", description: "", default_amount: "0", is_active: true });

  function resetForm() {
    setForm({ name: "", description: "", default_amount: "0", is_active: true });
    setEditing(null);
  }

  function openEdit(c: Category) {
    setEditing(c);
    setForm({
      name: c.name,
      description: c.description ?? "",
      default_amount: String(c.default_amount),
      is_active: c.is_active,
    });
    setOpen(true);
  }

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        default_amount: Number(form.default_amount) || 0,
        is_active: form.is_active,
      };
      if (editing) {
        const { error } = await supabase.from("fee_categories").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        if (!profile?.school_id) throw new Error("No school assigned to your profile.");
        const { error } = await supabase.from("fee_categories").insert({ ...payload, school_id: profile.school_id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Category updated" : "Category created");
      qc.invalidateQueries({ queryKey: ["fee_categories"] });
      setOpen(false);
      resetForm();
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Fee Categories</h1>
          <p className="text-sm text-muted-foreground">Define reusable fee buckets used on invoices.</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary shadow-glow">
              <Plus className="mr-2 h-4 w-4" /> New category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit category" : "New fee category"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Tuition" />
              </div>
              <div className="space-y-1.5">
                <Label>Default amount</Label>
                <Input type="number" min="0" step="0.01" value={form.default_amount} onChange={(e) => setForm({ ...form, default_amount: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>Active</Label>
                  <p className="text-xs text-muted-foreground">Inactive categories are hidden from invoice forms.</p>
                </div>
                <Switch checked={form.is_active} onCheckedChange={(c) => setForm({ ...form, is_active: c })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button className="bg-gradient-primary shadow-glow" disabled={!form.name.trim() || saveMut.isPending} onClick={() => saveMut.mutate()}>
                {saveMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {catsQ.isLoading ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : (catsQ.data ?? []).length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border bg-card py-16 text-center">
          <Tag className="h-10 w-10 text-muted-foreground" />
          <h3 className="mt-2 font-semibold">No fee categories yet</h3>
          <p className="text-sm text-muted-foreground">Create your first category to start billing.</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {(catsQ.data ?? []).map((c) => (
            <div key={c.id} className="flex flex-col gap-2 rounded-xl border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{c.name}</h3>
                    {!c.is_active && <Badge variant="secondary">Inactive</Badge>}
                  </div>
                  {c.description && <p className="text-xs text-muted-foreground">{c.description}</p>}
                </div>
                <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-lg font-semibold text-primary">${Number(c.default_amount).toFixed(2)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
