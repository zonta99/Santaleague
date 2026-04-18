import { getPlayerBadges } from "@/data/badges";
import { RARE_BADGE_KEYS } from "@/lib/badge-definitions";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export async function BadgeDisplay({ userId }: { userId: string }) {
  const badges = await getPlayerBadges(userId);

  if (badges.length === 0) return null;

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-2">
        {badges.map((ub) => {
          const isRare = RARE_BADGE_KEYS.includes(ub.Badge.key as (typeof RARE_BADGE_KEYS)[number]);
          return (
            <Tooltip key={ub.id}>
              <TooltipTrigger
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full text-xl cursor-default select-none",
                  "bg-secondary border border-border",
                  isRare && "ring-2 ring-amber-400 animate-pulse"
                )}
              >
                {ub.Badge.icon}
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-48 text-center">
                <p className="font-semibold">{ub.Badge.name}</p>
                <p className="text-xs text-muted-foreground">{ub.Badge.description}</p>
                {ub.Season && (
                  <p className="text-xs text-amber-400 mt-0.5">{ub.Season.name}</p>
                )}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
