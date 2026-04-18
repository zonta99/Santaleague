import { getPlayerProfile } from "@/data/stats";
import { getAllSeasons } from "@/data/season";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { TierBadge } from "@/components/tier-badge";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingUp, Trophy, BarChart2 } from "lucide-react";

interface Props {
  userId: string;
}

export async function SeasonBreakdown({ userId }: Props) {
  const seasons = await getAllSeasons();
  const completed = seasons.filter((s) => s.status === "COMPLETED");

  if (completed.length === 0) return null;

  const profiles = await Promise.all(
    completed.map((s) => getPlayerProfile(userId, s.id).then((p) => ({ season: s, ...p })))
  );

  const played = profiles.filter((p) => p.matchRows.length > 0);
  if (played.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Stagione per stagione</h2>
      <Accordion type="multiple" className="w-full space-y-1">
        {played.map(({ season, totals, matchRows }) => (
          <AccordionItem key={season.id} value={String(season.id)} className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <span className="font-medium">{season.name}</span>
                <TierBadge tier={totals.tier} level={totals.level} />
                <Badge variant="secondary">{matchRows.length} partite</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pb-2">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Target className="h-3.5 w-3.5 text-green-500" /> Gol
                  </div>
                  <span className="text-xl font-bold">{totals.goals}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <TrendingUp className="h-3.5 w-3.5 text-blue-500" /> Vittorie
                  </div>
                  <span className="text-xl font-bold">{totals.wins}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Trophy className="h-3.5 w-3.5 text-primary" /> Punti
                  </div>
                  <span className="text-xl font-bold">{totals.points}</span>
                </div>
                {totals.avgFieldRating !== null && (
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <BarChart2 className="h-3.5 w-3.5 text-purple-400" /> Rating campo
                    </div>
                    <span className="text-xl font-bold">{totals.avgFieldRating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
