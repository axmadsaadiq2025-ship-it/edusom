import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { EduSomLogo } from "./primitives";
import { cn } from "@/lib/utils";

export const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "Features", href: "#features" },
  { label: "Modules", href: "#modules" },
  { label: "Pricing", href: "#pricing" },
  { label: "About", href: "#about" },
  { label: "Blog", href: "#blog" },
  { label: "Contact", href: "#contact" },
  { label: "Support", href: "#support" },
];

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-border/60 bg-background/80 shadow-sm backdrop-blur-xl"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <nav
        aria-label="Main navigation"
        className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4 sm:h-18 sm:px-6 lg:px-8"
      >
        <a href="#home" className="flex shrink-0 items-center" aria-label="EduSom home">
          <EduSomLogo priority className="h-8 w-auto sm:h-9" />
        </a>

        <ul className="ml-auto hidden items-center gap-1 xl:flex">
          {NAV_LINKS.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-2 xl:ml-4">
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link to="/auth">Login</Link>
          </Button>
          <Button
            asChild
            className="bg-gradient-primary shadow-glow rounded-xl text-primary-foreground transition-transform hover:scale-[1.03]"
          >
            <Link to="/auth">
              Start Free Trial
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open navigation menu"
                className="min-h-11 min-w-11 xl:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <EduSomLogo className="h-8 w-auto" />
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Close navigation menu"
                  onClick={() => setOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <ul className="flex flex-col p-3">
                {NAV_LINKS.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className="block rounded-xl px-4 py-3 text-base font-medium text-foreground transition-colors hover:bg-accent"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col gap-2 border-t border-border p-4">
                <Button asChild variant="outline" className="rounded-xl">
                  <Link to="/auth">Login</Link>
                </Button>
                <Button
                  asChild
                  className="bg-gradient-primary rounded-xl text-primary-foreground"
                >
                  <Link to="/auth">Start Free Trial</Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
