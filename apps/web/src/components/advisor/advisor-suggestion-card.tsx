"use client";

import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdvisorSuggestionCardProps {
  icon: LucideIcon;
  title: string;
  prompt: string;
  description: string;
  onSelect: (prompt: string) => void;
  accentClassName?: string;
}

export function AdvisorSuggestionCard({
  icon: Icon,
  title,
  prompt,
  description,
  onSelect,
  accentClassName,
}: AdvisorSuggestionCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(prompt)}
      className="group block h-full w-full text-left"
    >
      <div className="relative h-full overflow-hidden rounded-[28px] border border-border/70 bg-background/95 p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg">
        <div
          className={cn(
            "absolute right-0 top-0 h-20 w-20 rounded-full blur-3xl",
            accentClassName ?? "bg-emerald-500/10"
          )}
        />
        <div className="relative space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-foreground">
              <Icon className="h-5 w-5" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">{title}</h3>
            <p className="text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
          <p className="line-clamp-2 text-sm font-medium text-foreground/90">{prompt}</p>
        </div>
      </div>
    </button>
  );
}
