import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";
import logoAsset from "@/assets/edusom-logo.png.asset.json";
import { cn } from "@/lib/utils";

/** Official EduSom logo (uploaded brand asset). Never redraw or replace. */
export function EduSomLogo({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <img
      src={logoAsset.url}
      alt="EduSom — Empowering Modern Learning"
      width={1919}
      height={627}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      className={cn("h-9 w-auto object-contain", className)}
    />
  );
}

export function useInView<T extends HTMLElement>(once = true) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            if (once) io.disconnect();
          } else if (!once) {
            setInView(false);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [once]);

  return { ref, inView };
}

export function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className,
  id,
}: {
  children: ReactNode;
  delay?: number;
  as?: ElementType;
  className?: string;
  id?: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <Tag
      id={id}
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(inView ? "reveal-shown" : "reveal-hidden", className)}
    >
      {children}
    </Tag>
  );
}

export function Counter({
  value,
  suffix = "",
  decimals = 0,
  duration = 1600,
}: {
  value: number;
  suffix?: string;
  decimals?: number;
  duration?: number;
}) {
  const { ref, inView } = useInView<HTMLSpanElement>();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(value * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration]);

  const formatted =
    decimals > 0
      ? display.toFixed(decimals)
      : Math.round(display).toLocaleString("en-US");

  return (
    <span ref={ref} className="tabular-nums">
      {formatted}
      {suffix}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
}) {
  return (
    <Reveal
      className={cn(
        "mx-auto max-w-2xl",
        align === "center" ? "text-center" : "mx-0 text-left",
      )}
    >
      {eyebrow && (
        <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-primary">
          {eyebrow}
        </span>
      )}
      <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
    </Reveal>
  );
}
