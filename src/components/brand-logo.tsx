import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

export function BrandLogo({ className, showText = true, size = "md" }: BrandLogoProps) {
  const sizes = {
    sm: { box: "h-8 w-8", icon: "h-4 w-4", text: "text-base" },
    md: { box: "h-10 w-10", icon: "h-5 w-5", text: "text-lg" },
    lg: { box: "h-14 w-14", icon: "h-7 w-7", text: "text-2xl" },
  }[size];

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "bg-gradient-primary shadow-glow flex items-center justify-center rounded-xl text-primary-foreground",
          sizes.box,
        )}
      >
        <GraduationCap className={sizes.icon} strokeWidth={2.5} />
      </div>
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={cn("font-bold tracking-tight text-foreground", sizes.text)}>
            EduSom
          </span>
          <span className="mt-0.5 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Cloud
          </span>
        </div>
      )}
    </div>
  );
}
