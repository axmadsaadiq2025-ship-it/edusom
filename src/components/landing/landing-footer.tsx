import { Link } from "@tanstack/react-router";
import { Facebook, Twitter, Linkedin, Youtube, Mail, Phone, MapPin } from "lucide-react";
import { EduSomLogo } from "./primitives";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Modules", href: "#modules" },
      { label: "Pricing", href: "#pricing" },
      { label: "Parent App", href: "#parent-app" },
      { label: "Teacher Portal", href: "#teacher-portal" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#about" },
      { label: "Blog", href: "#blog" },
      { label: "Contact", href: "#contact" },
      { label: "Support", href: "#support" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "#privacy" },
      { label: "Terms of Service", href: "#terms" },
      { label: "Data Protection", href: "#privacy" },
      { label: "FAQ", href: "#faq" },
    ],
  },
];

const SOCIALS = [
  { label: "EduSom on Facebook", icon: Facebook, href: "#" },
  { label: "EduSom on X", icon: Twitter, href: "#" },
  { label: "EduSom on LinkedIn", icon: Linkedin, href: "#" },
  { label: "EduSom on YouTube", icon: Youtube, href: "#" },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-card/60">
      <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <EduSomLogo className="h-9 w-auto" />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              EduSom Cloud is a secure, modern school management platform built for
              schools across Somalia and Africa — from admissions to graduation.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" aria-hidden="true" />
                <a className="hover:text-foreground" href="mailto:hello@edusom.app">
                  hello@edusom.app
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" aria-hidden="true" />
                <span>+252 61 000 0000</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
                <span>Mogadishu, Somalia</span>
              </li>
            </ul>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className="text-sm font-semibold text-foreground">{col.title}</h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-5 border-t border-border pt-7 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} EduSom Cloud. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                aria-label={s.label}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <s.icon className="h-4 w-4" aria-hidden="true" />
              </a>
            ))}
          </div>
          <Link
            to="/auth"
            className="text-xs font-semibold text-primary hover:underline"
          >
            Login to EduSom
          </Link>
        </div>
      </div>
    </footer>
  );
}
