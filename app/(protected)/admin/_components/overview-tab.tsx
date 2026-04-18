import { getAdminDashboardStats } from "@/data/stats";
import { getMatchesPerMonth } from "@/data/match";
import { KpiCards } from "./kpi-cards";
import { MatchesPerMonthChart } from "./matches-per-month-chart";
import { TopPlayersWidget } from "./top-players-widget";
import { MatchCompletionRate } from "./match-completion-rate";
import { ExportButton } from "./export-button";

export async function OverviewTab({ seasonId }: { seasonId?: number }) {
  const [stats, monthData] = await Promise.all([
    getAdminDashboardStats(seasonId),
    getMatchesPerMonth(seasonId),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">Panoramica stagione</h2>
        <ExportButton seasonId={seasonId} />
      </div>

      <KpiCards
        totalPlayers={stats.totalPlayers}
        matchesThisSeason={stats.completedMatches}
        avgGoalsPerMatch={stats.avgGoalsPerMatch}
        avgPlayerRating={stats.avgPlayerRating}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <MatchesPerMonthChart data={monthData} />
        <MatchCompletionRate
          completed={stats.completedMatches}
          scheduled={stats.scheduledMatches}
          total={stats.totalMatches}
        />
      </div>

      <TopPlayersWidget players={stats.topPlayers} />
    </div>
  );
}
