import { Construction, Sparkles } from "lucide-react";

export function UnderConstructionPlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="relative size-32 mb-8">
        <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl opacity-50 animate-pulse" />
        <div className="relative size-full bg-background border border-border/50 shadow-xl rounded-full flex items-center justify-center">
          <Construction className="size-12 text-primary" strokeWidth={1.5} />
        </div>
        <div className="absolute -top-2 -right-2">
           <Sparkles className="size-6 text-yellow-500 animate-bounce" />
        </div>
      </div>
      <h2 className="text-3xl font-bold tracking-tight mb-3">{title}</h2>
      <p className="text-muted-foreground max-w-sm mb-8 leading-relaxed">
        {description}
      </p>
      <div className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-muted/50 border border-border/50 text-sm font-medium">
        模块重构与对接中，敬请期待
      </div>
    </div>
  );
}
