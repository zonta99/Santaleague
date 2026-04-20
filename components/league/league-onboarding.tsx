"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Shield, Users } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createLeague, acceptInvite, setActiveLeagueAction } from "@/actions/league";

export function LeagueOnboarding() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState({ name: "", slug: "", description: "" });
  const [inviteToken, setInviteToken] = useState("");

  const handleCreate = () => {
    setError(null);
    startTransition(async () => {
      const result = await createLeague(createForm);
      if (result.error) { setError(result.error); return; }
      if (result.leagueId) {
        await setActiveLeagueAction(result.leagueId);
        router.push("/dashboard");
      }
    });
  };

  const handleJoin = () => {
    setError(null);
    startTransition(async () => {
      const result = await acceptInvite(inviteToken.trim());
      if (result.error) { setError(result.error); return; }
      if (result.leagueId) {
        await setActiveLeagueAction(result.leagueId);
        router.push("/dashboard");
      }
    });
  };

  const autoSlug = (name: string) =>
    name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  return (
    <div className="w-full space-y-4">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold">Benvenuto su Santaleague</h1>
        <p className="text-muted-foreground text-sm">Crea la tua lega o unisciti a una esistente</p>
      </div>

      <Tabs defaultValue="create">
        <TabsList className="w-full">
          <TabsTrigger value="create" className="flex-1 gap-2">
            <Shield className="h-4 w-4" /> Crea lega
          </TabsTrigger>
          <TabsTrigger value="join" className="flex-1 gap-2">
            <Users className="h-4 w-4" /> Ho un invito
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Nuova lega</CardTitle>
              <CardDescription>Diventerai il proprietario e potrai invitare i tuoi amici.</CardDescription>
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
          </Card>
        </TabsContent>

        <TabsContent value="join">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Inserisci il token di invito</CardTitle>
              <CardDescription>Trovi il token nel link che hai ricevuto via email.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Incolla il token qui..."
                value={inviteToken}
                onChange={(e) => setInviteToken(e.target.value)}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button className="w-full" onClick={handleJoin} disabled={isPending || !inviteToken}>
                {isPending ? "Verifica..." : "Unisciti alla lega"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
