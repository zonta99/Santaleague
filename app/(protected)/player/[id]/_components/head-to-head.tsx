"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getHeadToHeadAction } from "@/actions/player";
import { Swords } from "lucide-react";

type Opponent = { id: string; name: string | null; image: string | null };

interface Props {
  userId: string;
  allPlayers: Opponent[];
}

export function HeadToHead({ userId, allPlayers }: Props) {
  const [opponentId, setOpponentId] = useState<string>("");
  const [result, setResult] = useState<{ total: number; sameTeam: number; opposing: number; userWins: number } | null>(null);
  const [isPending, startTransition] = useTransition();

  const opponent = allPlayers.find((p) => p.id === opponentId);

  function handleChange(id: string) {
    setOpponentId(id);
    if (!id) { setResult(null); return; }
    startTransition(async () => {
      const data = await getHeadToHeadAction(userId, id);
      setResult(data);
    });
  }

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Testa a testa</h2>
      <select
        value={opponentId}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">Seleziona un avversario…</option>
        {allPlayers.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name ?? p.id}
          </option>
        ))}
      </select>

      {isPending && <p className="text-sm text-muted-foreground">Caricamento…</p>}

      {result && opponent && !isPending && (
        <Card>
          <CardContent className="py-4 space-y-4">
            <div className="flex items-center gap-3">
              {opponent.image ? (
                <Image src={opponent.image} alt="" width={36} height={36} className="rounded-full" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-sm font-bold">
                  {opponent.name?.[0] ?? "?"}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Swords className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{opponent.name}</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-2xl font-bold">{result.total}</p>
                <p className="text-xs text-muted-foreground">Partite insieme</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{result.sameTeam}</p>
                <p className="text-xs text-muted-foreground">Stesso team</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{result.opposing}</p>
                <p className="text-xs text-muted-foreground">Avversari</p>
              </div>
            </div>
            {result.opposing > 0 && (
              <div className="text-center">
                <Badge variant="secondary">
                  {result.userWins} vittorie su {result.opposing} sfide dirette
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {result && result.total === 0 && !isPending && (
        <p className="text-sm text-muted-foreground">Nessuna partita in comune.</p>
      )}
    </section>
  );
}
