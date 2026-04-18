import { cn } from "@/lib/utils";
import type { Tier } from "@/data/stats";

const TIER_STYLES: Record<Tier, string> = {
  Bronze: "bg-stone-700/30 text-stone-300 border-stone-600/40",
  Silver: "bg-slate-600/30 text-slate-200 border-slate-500/40",
  Gold: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
  Platinum: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
  Legend: "bg-orange-500/20 text-orange-300 border-orange-400/50 animate-pulse",
};

interface TierBadgeProps {
  tier: Tier;
  level: number;
  className?: string;
}

export function TierBadge({ tier, level, className }: TierBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        TIER_STYLES[tier],
        className
      )}
    >
      {tier}
      <span className="opacity-70">{level.toFixed(1)}</span>
    </span>
  );
}
