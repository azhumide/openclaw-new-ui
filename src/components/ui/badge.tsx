import * as React from "react"
import { cn } from "@/lib/utils"

const Badge = ({ children, variant = "default", className }: { children: React.ReactNode, variant?: "default" | "outline" | "secondary" | "destructive" | "success" | "warning", className?: string }) => {
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/80 border-transparent",
    outline: "text-foreground border border-input hover:bg-accent hover:text-accent-foreground",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border-transparent",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/80 border-transparent",
    success: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
  };
  return (
    <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", variants[variant], className)}>
      {children}
    </div>
  );
};

export { Badge }
