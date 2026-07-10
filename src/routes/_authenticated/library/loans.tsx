import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Plus, Loader2, ArrowRightLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/library/loans")({
  component: LoansPage,
});

interface Loan {
  id: string;
  book_id: string;
  student_id: string;
  issued_at: string;
  due_date: string;
  returned_at: string | null;
  status: "issued" | "returned" | "overdue" | "lost";
  fine_amount: number | null;
  book: { title: string } | null;
  student: { first_name: string; last_name: string; admission_number: string } | null;
}

function LoansPage() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [form, setForm] = useState({
    book_id: "",
    student_id: "",
    due_date: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
  });

  const loansQ = useQuery({
    queryKey: ["library_loans", filter],
    queryFn: async () => {
      let q = supabase
        .from("library_loans")
        .select(
          "id,book_id,student_id,issued_at,due_date,returned_at,status,fine_amount,book:library_books(title),student:students(first_name,last_name,admission_number)",
        )
        .order("issued_at", { ascending: false });
      if (filter !== "all") q = q.eq("status", filter as Loan["status"]);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as Loan[];
    },
  });

  const booksQ = useQuery({
    queryKey: ["library_books_available"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("library_books")
        .select("id,title,available_copies")
        .gt("available_copies", 0)
        .order("title");
      if (error) throw error;
      return data ?? [];
    },
  });

  const studentsQ = useQuery({
    queryKey: ["students_lookup"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id,first_name,last_name,admission_number")
        .eq("status", "active")
        .order("first_name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const issue = useMutation({
    mutationFn: async () => {
      if (!profile?.school_id) throw new Error("No school assigned");
      if (!form.book_id || !form.student_id) throw new Error("Pick book and student");
      const { error } = await supabase.from("library_loans").insert({
        school_id: profile.school_id,
        book_id: form.book_id,
        student_id: form.student_id,
        due_date: form.due_date,
        status: "issued",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Book issued");
      qc.invalidateQueries({ queryKey: ["library_loans"] });
      qc.invalidateQueries({ queryKey: ["library_books"] });
      qc.invalidateQueries({ queryKey: ["library_books_available"] });
      qc.invalidateQueries({ queryKey: ["library_loans_active"] });
      setOpen(false);
      setForm({
        book_id: "",
        student_id: "",
        due_date: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      });
    },
    onError: (e: Error) => toast.error(e.message || "Failed"),
  });

  const markReturned = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("library_loans")
        .update({ status: "returned", returned_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Marked as returned");
      qc.invalidateQueries({ queryKey: ["library_loans"] });
      qc.invalidateQueries({ queryKey: ["library_books"] });
      qc.invalidateQueries({ queryKey: ["library_books_available"] });
      qc.invalidateQueries({ queryKey: ["library_loans_active"] });
    },
    onError: (e: Error) => toast.error(e.message || "Failed"),
  });

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
            <Link to="/library">
              <ArrowLeft className="mr-1 h-4 w-4" /> Library
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Loans
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Issue and track book loans across students.
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="issued">Issued</SelectItem>
              <SelectItem value="returned">Returned</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary shadow-glow">
                <Plus className="mr-1.5 h-4 w-4" /> Issue book
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Issue book</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Book *</Label>
                  <Select
                    value={form.book_id}
                    onValueChange={(v) => setForm({ ...form, book_id: v })}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select a book" />
                    </SelectTrigger>
                    <SelectContent>
                      {(booksQ.data ?? []).map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.title} ({b.available_copies} avail.)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Student *</Label>
                  <Select
                    value={form.student_id}
                    onValueChange={(v) => setForm({ ...form, student_id: v })}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select a student" />
                    </SelectTrigger>
                    <SelectContent>
                      {(studentsQ.data ?? []).map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.first_name} {s.last_name} · {s.admission_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Due date *</Label>
                  <Input
                    type="date"
                    value={form.due_date}
                    onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => issue.mutate()}
                  disabled={issue.isPending}
                  className="bg-gradient-primary shadow-glow"
                >
                  {issue.isPending && (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  )}
                  Issue
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loansQ.isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 rounded-xl" />
          ))}
        </div>
      ) : (loansQ.data ?? []).length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <div className="bg-gradient-primary shadow-glow mx-auto flex h-14 w-14 items-center justify-center rounded-2xl">
            <ArrowRightLeft className="h-6 w-6 text-primary-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No loans</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Issue a book to a student to get started.
          </p>
        </div>
      ) : (
        <div className="glass overflow-hidden rounded-2xl">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Book</TableHead>
                <TableHead>Student</TableHead>
                <TableHead className="hidden md:table-cell">Issued</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(loansQ.data ?? []).map((l) => {
                const overdue = l.status === "issued" && l.due_date < today;
                return (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">
                      {l.book?.title ?? "—"}
                    </TableCell>
                    <TableCell>
                      {l.student ? (
                        <div>
                          <div className="font-medium">
                            {l.student.first_name} {l.student.last_name}
                          </div>
                          <div className="font-mono text-xs text-muted-foreground">
                            {l.student.admission_number}
                          </div>
                        </div>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {new Date(l.issued_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(l.due_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          l.status === "returned"
                            ? "secondary"
                            : overdue || l.status === "overdue" || l.status === "lost"
                              ? "destructive"
                              : "default"
                        }
                      >
                        {overdue && l.status === "issued" ? "overdue" : l.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {l.status === "issued" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markReturned.mutate(l.id)}
                          disabled={markReturned.isPending}
                        >
                          Return
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
