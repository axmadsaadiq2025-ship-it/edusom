import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Plus, Trash2, Loader2, Receipt, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/fees/$id")({
  component: InvoiceDetailPage,
});

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  partial: "bg-amber-500/15 text-amber-700 dark:text-amber-500",
  paid: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  overdue: "bg-destructive/15 text-destructive",
  cancelled: "bg-muted text-muted-foreground line-through",
};

function InvoiceDetailPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();

  const invQ = useQuery({
    queryKey: ["fee_invoice", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fee_invoices")
        .select("*, students(first_name,last_name,admission_number,phone), fee_invoice_items(*), fee_payments(*)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  const [payOpen, setPayOpen] = useState(false);
  const [payForm, setPayForm] = useState({
    amount: "",
    method: "cash" as "cash" | "bank_transfer" | "mobile_money" | "card" | "cheque" | "other",
    paid_at: format(new Date(), "yyyy-MM-dd"),
    reference: "",
    notes: "",
  });

  const balance = invQ.data ? Number(invQ.data.total_amount) - Number(invQ.data.amount_paid) : 0;

  const payMut = useMutation({
    mutationFn: async () => {
      const amt = Number(payForm.amount);
      if (!amt || amt <= 0) throw new Error("Enter an amount.");
      const { error } = await supabase.from("fee_payments").insert({
        invoice_id: id,
        amount: amt,
        method: payForm.method,
        paid_at: payForm.paid_at,
        reference: payForm.reference || null,
        notes: payForm.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Payment recorded");
      qc.invalidateQueries({ queryKey: ["fee_invoice", id] });
      qc.invalidateQueries({ queryKey: ["fee_invoices"] });
      setPayOpen(false);
      setPayForm({ ...payForm, amount: "", reference: "", notes: "" });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const deletePayMut = useMutation({
    mutationFn: async (pid: string) => {
      const { error } = await supabase.from("fee_payments").delete().eq("id", pid);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Payment removed");
      qc.invalidateQueries({ queryKey: ["fee_invoice", id] });
      qc.invalidateQueries({ queryKey: ["fee_invoices"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const cancelMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("fee_invoices").update({ status: "cancelled" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Invoice cancelled");
      qc.invalidateQueries({ queryKey: ["fee_invoice", id] });
      qc.invalidateQueries({ queryKey: ["fee_invoices"] });
    },
  });

  if (invQ.isLoading) {
    return <div className="space-y-3"><Skeleton className="h-24 w-full" /><Skeleton className="h-40 w-full" /></div>;
  }
  if (!invQ.data) {
    return <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">Invoice not found.</div>;
  }

  const inv = invQ.data;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link to="/fees"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{inv.invoice_number}</h1>
            <Badge variant="secondary" className={STATUS_STYLES[inv.status]}>{inv.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {inv.students?.first_name} {inv.students?.last_name} · #{inv.students?.admission_number}
          </p>
        </div>
        {inv.status !== "cancelled" && inv.status !== "paid" && (
          <Dialog open={payOpen} onOpenChange={setPayOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary shadow-glow"><CreditCard className="mr-2 h-4 w-4" /> Record payment</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Record payment</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="rounded-lg bg-muted p-3 text-sm">
                  Balance due: <span className="font-semibold">${balance.toFixed(2)}</span>
                </div>
                <div className="space-y-1.5">
                  <Label>Amount</Label>
                  <Input type="number" min="0" step="0.01" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} placeholder={balance.toFixed(2)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Method</Label>
                    <Select value={payForm.method} onValueChange={(v: any) => setPayForm({ ...payForm, method: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                        <SelectItem value="mobile_money">Mobile money</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Date</Label>
                    <Input type="date" value={payForm.paid_at} onChange={(e) => setPayForm({ ...payForm, paid_at: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Reference (optional)</Label>
                  <Input value={payForm.reference} onChange={(e) => setPayForm({ ...payForm, reference: e.target.value })} placeholder="Transaction ID, cheque #, etc." />
                </div>
                <div className="space-y-1.5">
                  <Label>Notes</Label>
                  <Textarea rows={2} value={payForm.notes} onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPayOpen(false)}>Cancel</Button>
                <Button className="bg-gradient-primary shadow-glow" disabled={payMut.isPending} onClick={() => payMut.mutate()}>
                  {payMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save payment
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border bg-card p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Total</div>
          <div className="mt-1 text-2xl font-bold">${Number(inv.total_amount).toFixed(2)}</div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Paid</div>
          <div className="mt-1 text-2xl font-bold text-emerald-600">${Number(inv.amount_paid).toFixed(2)}</div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Balance</div>
          <div className="mt-1 text-2xl font-bold text-primary">${balance.toFixed(2)}</div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Due</div>
          <div className="mt-1 text-lg font-semibold">{format(new Date(inv.due_date), "MMM d, yyyy")}</div>
          <div className="text-xs text-muted-foreground">Issued {format(new Date(inv.issue_date), "MMM d, yyyy")}</div>
        </div>
      </div>

      <div className="rounded-xl border bg-card">
        <div className="flex items-center gap-2 border-b p-4">
          <Receipt className="h-4 w-4 text-muted-foreground" /><h2 className="font-semibold">Line items</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Unit price</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(inv.fee_invoice_items ?? []).map((it: any) => (
              <TableRow key={it.id}>
                <TableCell>{it.description}</TableCell>
                <TableCell className="text-right">{Number(it.quantity)}</TableCell>
                <TableCell className="text-right">${Number(it.unit_price).toFixed(2)}</TableCell>
                <TableCell className="text-right font-medium">${Number(it.total).toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="rounded-xl border bg-card">
        <div className="flex items-center gap-2 border-b p-4">
          <CreditCard className="h-4 w-4 text-muted-foreground" /><h2 className="font-semibold">Payments</h2>
        </div>
        {(inv.fee_payments ?? []).length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No payments recorded yet.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(inv.fee_payments ?? []).map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell>{format(new Date(p.paid_at), "MMM d, yyyy")}</TableCell>
                  <TableCell className="capitalize">{p.method.replace("_", " ")}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.reference ?? "—"}</TableCell>
                  <TableCell className="text-right font-medium">${Number(p.amount).toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => deletePayMut.mutate(p.id)} disabled={deletePayMut.isPending}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {inv.notes && (
        <div className="rounded-xl border bg-card p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Notes</div>
          <p className="mt-1 text-sm">{inv.notes}</p>
        </div>
      )}

      {inv.status !== "cancelled" && (
        <div className="flex justify-end">
          <Button variant="outline" className="text-destructive" onClick={() => cancelMut.mutate()} disabled={cancelMut.isPending}>
            Cancel invoice
          </Button>
        </div>
      )}
    </div>
  );
}
