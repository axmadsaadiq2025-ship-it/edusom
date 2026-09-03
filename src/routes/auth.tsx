import { createFileRoute, redirect, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Mail, Lock, ArrowRight } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandLogo } from "@/components/brand-logo";
import { resolveAccessState } from "@/lib/access.functions";
import { ACCESS_COPY, type AccessResult } from "@/lib/access-shared";

/**
 * Authentication proved identity — now ask the server whether this identity is a
 * registered, approved and active EduSom user. Unauthorized identities are signed out.
 */
async function authorize(): Promise<AccessResult | null> {
  try {
    const result = await resolveAccessState();
    if (result.state !== "active") {
      await supabase.auth.signOut();
    }
    return result;
  } catch {
    await supabase.auth.signOut();
    return null;
  }
}

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: searchSchema,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    // A live session is only useful if it is also authorized.
    const result = await authorize();
    if (result?.state === "active" && result.redirectTo) {
      throw redirect({ to: result.redirectTo });
    }
    if (result && result.state !== "active") {
      throw redirect({ to: "/access-pending", search: { reason: result.state } });
    }
  },
  component: AuthPage,
});

const emailSchema = z.string().trim().email({ message: "Invalid email" }).max(255);
const passwordSchema = z
  .string()
  .min(8, { message: "Password must be at least 8 characters" })
  .max(72);

function AuthPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  const redirectTo = search.redirect ?? "/dashboard";

  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault();
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      toast.error(emailResult.error.issues[0].message);
      return;
    }
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      toast.error(passwordResult.error.issues[0].message);
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: emailResult.data,
      password: passwordResult.data,
    });

    if (error) {
      setSubmitting(false);
      toast.error(error.message);
      return;
    }

    const result = await authorize();
    setSubmitting(false);
    finish(result);
  }

  /** Route the user according to the server's authorization verdict. */
  function finish(result: AccessResult | null) {
    if (!result) {
      toast.error("We could not verify your EduSom access. Please try again.");
      return;
    }
    if (result.state !== "active") {
      toast.error(ACCESS_COPY[result.state].title);
      navigate({ to: "/access-pending", search: { reason: result.state } });
      return;
    }
    toast.success("Welcome back!");
    navigate({ to: result.isSuper ? "/platform/dashboard" : redirectTo });
  }

  async function handleGoogle() {
    setOauthLoading(true);
    let result;
    try {
      result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
    } catch {
      setOauthLoading(false);
      toast.error("Unable to sign in with Google. Please try again.");
      return;
    }

    if (result.error) {
      setOauthLoading(false);
      const message = String((result.error as { message?: string }).message ?? "").toLowerCase();
      toast.error(
        message.includes("cancel") || message.includes("closed") || message.includes("denied")
          ? "Google sign-in was cancelled."
          : "Unable to sign in with Google. Please try again.",
      );
      return;
    }
    // Full-page redirect to Google — authorization happens when we come back.
    if (result.redirected) return;

    const access = await authorize();
    setOauthLoading(false);
    finish(access);
  }

  return (
    <div className="bg-gradient-mesh relative flex min-h-screen items-center justify-center p-4">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-subtle" />

      <div className="grid w-full max-w-5xl grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-16">
        {/* Marketing panel */}
        <div className="hidden flex-col justify-between p-4 lg:flex">
          <BrandLogo size="lg" />

          <div className="space-y-6">
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-foreground">
              Run your school on one <span className="bg-gradient-primary bg-clip-text text-transparent">powerful</span> platform.
            </h1>
            <p className="text-lg text-muted-foreground">
              From admissions to graduation — students, teachers, attendance,
              fees, exams, and reports in one modern workspace built for schools in Somalia.
            </p>
            <ul className="space-y-3 text-sm text-foreground/80">
              {[
                "Enterprise-grade security with role-based access",
                "Multi-school ready with realtime updates",
                "Mobile-friendly for parents, teachers and students",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="bg-gradient-primary mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-primary-foreground">
                    <svg viewBox="0 0 20 20" className="h-3 w-3" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 011.4-1.4L8 12.58l7.3-7.3a1 1 0 011.4 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} EduSom Cloud. All rights reserved.
          </p>
        </div>

        {/* Auth card */}
        <div className="flex items-center">
          <div className="glass shadow-elegant w-full rounded-3xl p-8 sm:p-10">
            <div className="mb-8 flex flex-col items-center lg:hidden">
              <BrandLogo size="md" />
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                Sign in to your account
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Use your school-issued credentials to continue.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              className="h-11 w-full rounded-xl"
              onClick={handleGoogle}
              disabled={oauthLoading || submitting}
            >
              {oauthLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <GoogleIcon className="mr-2 h-4 w-4" />
              )}
              Continue with Google
            </Button>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs uppercase tracking-widest text-muted-foreground">
                or
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@school.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 rounded-xl pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    to="/auth"
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 rounded-xl pl-9"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={submitting || oauthLoading}
                className="bg-gradient-primary shadow-glow hover:shadow-glow h-11 w-full rounded-xl text-base font-medium transition-transform hover:scale-[1.01]"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Accounts are created by your school administrator.
              <br />
              Need access? Contact your Principal or School Owner.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0012 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.11A6.6 6.6 0 015.5 12c0-.73.13-1.44.34-2.11V7.05H2.18a11 11 0 000 9.9l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}
