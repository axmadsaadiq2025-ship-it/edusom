import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Plus, Search, Wallet, Filter } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { StatCard } from "@/components/dashboard/stat-card";

export const Route = createFileRoute("/_authenticated/fees/")({
  component: FeesPage,
});

type InvoiceStatus = "pending" | "partial" | "paid" | "overdue" | "cancelled";

const STATUS_STYLES: Record<InvoiceStatus, string> = {
  pending: "bg-muted text-muted-foreground",
  partial: "bg-amber-500/15 text-amber-700 dark:text-amber-500",
  paid: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  overdue: "bg-destructive/15 text-destructive",
  cancelled: "bg-muted text-muted-foreground line-through",
};

function FeesPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");

  const invQ = useQuery({
    queryKey: ["fee_invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fee_invoices")
        .select("id, invoice_number, issue_date, due_date, total_amount, amount_paid, status, student_id, students(first_name,last_name,admission_number)")
        .order("issue_date", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const filtered = useMemo(() => {
    const list = invQ.data ?? [];
    const query = q.trim().toLowerCase();
    return list.filter((i) => {
      if (status !== "all" && i.status !== status) return false;
      if (!query) return true;
      const s = i.students;
      const name = `${s?.first_name ?? ""} ${s?.last_name ?? ""}`.toLowerCase();
      return (
        i.invoice_number.toLowerCase().includes(query) ||
        name.includes(query) ||
        (s?.admission_number ?? "").toLowerCase().includes(query)
      );
    });
  }, [invQ.data, q, status]);

  const stats = useMemo(() => {
    const list = invQ.data ?? [];
    let total = 0, paid = 0, outstanding = 0, overdue = 0;
    list.forEach((i) => {
      total += Number(i.total_amount);
      paid += Number(i.amount_paid);
      const bal = Number(i.total_amount) - Number(i.amount_paid);
      if (i.status !== "cancelled" && i.status !== "paid") outstanding += bal;
      if (i.status === "overdue") overdue += bal;
    });
    return { total, paid, outstanding, overdue, count: list.length };
  }, [invQ.data]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Fees & Invoices</h1>
          <p className="text-sm text-muted-foreground">Manage student billing, invoices and payments.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/fees/categories">Categories</Link>
          </Button>
          <Button asChild className="bg-gradient-primary shadow-glow">
            <Link to="/fees/new">
              <Plus className="mr-2 h-4 w-4" /> New invoice
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total billed" value={`$${stats.total.toFixed(2)}`} icon={Wallet} />
        <StatCard label="Collected" value={`$${stats.paid.toFixed(2)}`} icon={Wallet} />
        <StatCard label="Outstanding" value={`$${stats.outstanding.toFixed(2)}`} icon={Wallet} />
        <StatCard label="Overdue" value={`$${stats.overdue.toFixed(2)}`} icon={Wallet} />
      </div>

      <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search invoice # or student…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full sm:w-48"><Filter className="mr-2 h-4 w-4" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border bg-card">
        {invQ.isLoading ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Wallet className="h-10 w-10 text-muted-foreground" />
            <h3 className="mt-2 font-semibold">No invoices found</h3>
            <p className="text-sm text-muted-foreground">Create your first invoice to start collecting fees.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Issue</TableHead>
                <TableHead>Due</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((i) => {
                const bal = Number(i.total_amount) - Number(i.amount_paid);
                return (
                  <TableRow key={i.id} className="cursor-pointer" onClick={() => { window.location.href = `/fees/${i.id}`; }}>
                    <TableCell className="font-mono text-xs">{i.invoice_number}</TableCell>
                    <TableCell>
                      <div className="font-medium">{i.students?.first_name} {i.students?.last_name}</div>
                      <div className="text-xs text-muted-foreground">#{i.students?.admission_number}</div>
                    </TableCell>
                    <TableCell className="text-sm">{format(new Date(i.issue_date), "MMM d, yyyy")}</TableCell>
                    <TableCell className="text-sm">{format(new Date(i.due_date), "MMM d, yyyy")}</TableCell>
                    <TableCell className="text-right font-medium">${Number(i.total_amount).toFixed(2)}</TableCell>
                    <TableCell className="text-right text-emerald-600">${Number(i.amount_paid).toFixed(2)}</TableCell>
                    <TableCell className="text-right font-semibold">${bal.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={STATUS_STYLES[i.status as InvoiceStatus]}>{i.status}</Badge>
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
