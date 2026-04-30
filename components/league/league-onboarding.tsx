"use client";

import { useEffect, useState, useTransition } from "react";
import { Shield, ChevronRight } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createLeague } from "@/actions/league";
import type { League, LeagueMember } from "@prisma/client";

type Membership = LeagueMember & { League: League };

interface LeagueOnboardingProps {
  memberships?: Membership[];
  canCreateLeague?: boolean;
}

export function LeagueOnboarding({ memberships = [], canCreateLeague = false }: LeagueOnboardingProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState({ name: "", slug: "", description: "" });

  const handleCreate = () => {
    setError(null);
    startTransition(async () => {
      const result = await createLeague(createForm);
      if (result.error) { setError(result.error); return; }
      if (result.leagueId) {
        window.location.href = `/api/league/activate?id=${result.leagueId}&redirect=/dashboard`;
      }
    });
  };

  const autoSlug = (name: string) =>
    name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const handleSelect = (leagueId: string) => {
    window.location.href = `/api/league/activate?id=${leagueId}&redirect=/dashboard`;
  };

  useEffect(() => {
    if (memberships.length === 1) {
      window.location.href = `/api/league/activate?id=${memberships[0].league_id}&redirect=/dashboard`;
    }
  }, [memberships]);

  return (
    <div className="w-full space-y-4">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold">Benvenuto su Santaleague</h1>
        <p className="text-muted-foreground text-sm">
          {memberships.length > 0
            ? canCreateLeague ? "Seleziona una lega o creane una nuova" : "Seleziona una lega"
            : canCreateLeague ? "Crea la tua prima lega" : "Chiedi un link di invito al tuo admin"}
        </p>
      </div>

      {memberships.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Le tue leghe</CardTitle>
            <CardDescription>Seleziona una lega per entrare.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {memberships.map((m) => (
              <Button
                key={m.League.id}
                variant="outline"
                className="w-full justify-between"
                onClick={() => handleSelect(m.League.id)}
                disabled={isPending}
              >
                <span>{m.League.name}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      {canCreateLeague && <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" /> Crea una nuova lega
          </CardTitle>
          <CardDescription>Diventerai il proprietario e potrai invitare i tuoi amici tramite link condivisibile.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Nome lega</Label>
            <Input
              placeholder="Es. Santaleague Roma"
              value={createForm.name}
              onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value, slug: autoSlug(e.target.value) }))}
            />
          </div>
          <div className="space-y-1">
            <Label>Slug (URL)</Label>
            <Input
              placeholder="es. santaleague-roma"
              value={createForm.slug}
              onChange={(e) => setCreateForm((f) => ({ ...f, slug: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label>Descrizione (opzionale)</Label>
            <Input
              placeholder="Una breve descrizione..."
              value={createForm.description}
              onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button className="w-full" onClick={handleCreate} disabled={isPending || !createForm.name}>
            {isPending ? "Creazione..." : "Crea lega"}
          </Button>
        </CardContent>
      </Card>}
    </div>
  );
}
