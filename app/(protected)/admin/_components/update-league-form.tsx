"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updateLeague } from "@/actions/league";
import { Building2 } from "lucide-react";

interface Props {
  leagueId: string;
  league: { name: string; description: string | null };
}

export function UpdateLeagueForm({ leagueId, league }: Props) {
  const [name, setName] = useState(league.name);
  const [description, setDescription] = useState(league.description ?? "");
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateLeague(leagueId, { name, description: description || undefined });
      if (result.error) toast.error(result.error);
      else toast.success(result.success);
    });
  };

  const isDirty = name !== league.name || description !== (league.description ?? "");

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 className="h-4 w-4 text-blue-400" />
          Impostazioni lega
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="league-name">Nome</Label>
          <Input
            id="league-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome della lega"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="league-desc">Descrizione</Label>
          <textarea
            id="league-desc"
            value={description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
            placeholder="Descrizione opzionale"
            rows={3}
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <Button onClick={handleSave} disabled={!isDirty || isPending || !name} size="sm">
          {isPending ? "Salvataggio..." : "Salva"}
        </Button>
      </CardContent>
    </Card>
  );
}
