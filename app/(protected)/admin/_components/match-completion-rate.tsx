"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MatchCompletionRateProps {
  completed: number;
  scheduled: number;
  total: number;
}

export function MatchCompletionRate({ completed, scheduled, total }: MatchCompletionRateProps) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Tasso di completamento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-end justify-between">
          <span className="text-3xl font-bold">{pct}%</span>
          <span className="text-xs text-muted-foreground pb-1">{completed} / {total} partite</span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{completed} completate</span>
          <span>{scheduled} programmate</span>
        </div>
      </CardContent>
    </Card>
  );
}
