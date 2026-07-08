import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Plus, Trash2, Save, Loader2 } from "lucide-react";
import { format, addDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/fees/new")({
  component: NewInvoicePage,
});

interface LineItem {
  fee_category_id: string | null;
  description: string;
  quantity: string;
  unit_price: string;
}

function NewInvoicePage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const schoolId = profile?.school_id ?? "";

  const [studentId, setStudentId] = useState("");
  const [yearId, setYearId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState(() => `INV-${Date.now().toString().slice(-8)}`);
  const [issueDate, setIssueDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [dueDate, setDueDate] = useState(format(addDays(new Date(), 30), "yyyy-MM-dd"));
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([
    { fee_category_id: null, description: "", quantity: "1", unit_price: "0" },
  ]);

  const studentsQ = useQuery({
    queryKey: ["students", "picker", schoolId],
    enabled: !!schoolId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id,first_name,last_name,admission_number")
        .eq("school_id", schoolId)
        .eq("status", "active")
        .order("first_name");
      if (error) throw error;
      return data;
    },
  });

  const yearsQ = useQuery({
    queryKey: ["academic_years", schoolId],
    enabled: !!schoolId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academic_years")
        .select("id,name,is_current")
        .eq("school_id", schoolId)
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!yearId && yearsQ.data) {
      const cur = yearsQ.data.find((y) => y.is_current) ?? yearsQ.data[0];
      if (cur) setYearId(cur.id);
    }
  }, [yearsQ.data, yearId]);

  const catsQ = useQuery({
    queryKey: ["fee_categories", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fee_categories")
        .select("id,name,default_amount")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const total = useMemo(
    () => items.reduce((sum, it) => sum + Number(it.quantity || 0) * Number(it.unit_price || 0), 0),
    [items],
  );

  function updateItem(idx: number, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  function pickCategory(idx: number, catId: string) {
    const cat = (catsQ.data ?? []).find((c) => c.id === catId);
    updateItem(idx, {
      fee_category_id: catId,
      description: cat?.name ?? "",
      unit_price: cat ? String(cat.default_amount) : "0",
    });
  }

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!schoolId || !studentId || !yearId) throw new Error("Select student and academic year.");
      const validItems = items.filter((i) => i.description.trim() && Number(i.quantity) > 0);
      if (validItems.length === 0) throw new Error("Add at least one line item.");
      const { data: inv, error } = await supabase
        .from("fee_invoices")
        .insert({
          school_id: schoolId,
          academic_year_id: yearId,
          student_id: studentId,
          invoice_number: invoiceNumber.trim(),
          issue_date: issueDate,
          due_date: dueDate,
          total_amount: total,
          notes: notes || null,
        })
        .select("id")
        .single();
      if (error) throw error;
      const rows = validItems.map((it) => ({
        invoice_id: inv.id,
        fee_category_id: it.fee_category_id,
        description: it.description.trim(),
        quantity: Number(it.quantity),
        unit_price: Number(it.unit_price),
        total: Number(it.quantity) * Number(it.unit_price),
      }));
      const { error: iErr } = await supabase.from("fee_invoice_items").insert(rows);
      if (iErr) throw iErr;
      return inv.id;
    },
    onSuccess: (id) => {
      toast.success("Invoice created");
      qc.invalidateQueries({ queryKey: ["fee_invoices"] });
      navigate({ to: "/fees/$id", params: { id } });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to create invoice"),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link to="/fees"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">New Invoice</h1>
          <p className="text-sm text-muted-foreground">Bill a student for one or more fee items.</p>
        </div>
      </div>

      <div className="grid gap-4 rounded-xl border bg-card p-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Student</Label>
          <Select value={studentId} onValueChange={setStudentId}>
            <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
            <SelectContent>
              {(studentsQ.data ?? []).map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.first_name} {s.last_name} · #{s.admission_number}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Academic year</Label>
          <Select value={yearId} onValueChange={setYearId}>
            <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
            <SelectContent>
              {(yearsQ.data ?? []).map((y) => (
                <SelectItem key={y.id} value={y.id}>{y.name}{y.is_current && " (current)"}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Invoice number</Label>
          <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Issue date</Label>
            <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Due date</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="font-semibold">Line items</h2>
          <Button variant="outline" size="sm" onClick={() => setItems([...items, { fee_category_id: null, description: "", quantity: "1", unit_price: "0" }])}>
            <Plus className="mr-2 h-4 w-4" /> Add item
          </Button>
        </div>
        <div className="divide-y">
          {items.map((it, idx) => (
            <div key={idx} className="grid gap-2 p-4 md:grid-cols-[1.5fr_2fr_0.7fr_0.9fr_0.9fr_auto]">
              <Select value={it.fee_category_id ?? ""} onValueChange={(v) => pickCategory(idx, v)}>
                <SelectTrigger><SelectValue placeholder="Category (optional)" /></SelectTrigger>
                <SelectContent>
                  {(catsQ.data ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input placeholder="Description" value={it.description} onChange={(e) => updateItem(idx, { description: e.target.value })} />
              <Input type="number" min="0" step="0.01" value={it.quantity} onChange={(e) => updateItem(idx, { quantity: e.target.value })} placeholder="Qty" />
              <Input type="number" min="0" step="0.01" value={it.unit_price} onChange={(e) => updateItem(idx, { unit_price: e.target.value })} placeholder="Unit price" />
              <div className="flex items-center justify-end px-2 font-medium">
                ${(Number(it.quantity || 0) * Number(it.unit_price || 0)).toFixed(2)}
              </div>
              <Button variant="ghost" size="icon" onClick={() => setItems(items.filter((_, i) => i !== idx))} disabled={items.length === 1}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-end gap-3 border-t p-4">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-2xl font-bold text-primary">${total.toFixed(2)}</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Notes (optional)</Label>
        <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" asChild><Link to="/fees">Cancel</Link></Button>
        <Button className="bg-gradient-primary shadow-glow" onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
          {saveMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Create invoice
        </Button>
      </div>
    </div>
  );
}
