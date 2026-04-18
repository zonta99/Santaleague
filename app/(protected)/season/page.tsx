import Link from "next/link";
import { getAllSeasons } from "@/data/season";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, ArrowLeft, CalendarRange } from "lucide-react";

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" });
}

export default async function SeasonsArchivePage() {
  const seasons = await getAllSeasons();

  return (
    <div className="w-full max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/leaderboard">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Classifica
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Archivio stagioni</h1>
        <p className="text-muted-foreground text-sm">Storico di tutte le stagioni della lega</p>
      </div>

      {seasons.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nessuna stagione ancora creata.</p>
      ) : (
        <div className="space-y-3">
          {seasons.map((s) => (
            <Link key={s.id} href={`/season/${s.id}`}>
              <Card className="hover:bg-accent transition-colors cursor-pointer">
                <CardContent className="flex items-center justify-between py-4 px-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{s.name}</span>
                      <Badge variant={s.status === "ACTIVE" ? "default" : "secondary"}>
                        {s.status === "ACTIVE" ? "In corso" : "Conclusa"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <CalendarRange className="h-3 w-3" />
                      {formatDate(s.start_date)} → {formatDate(s.end_date)}
                    </p>
                  </div>
                  {s.Champion && (
                    <div className="flex items-center gap-1.5 text-sm text-amber-400">
                      <Crown className="h-4 w-4" />
                      <span className="font-medium">{s.Champion.name}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
