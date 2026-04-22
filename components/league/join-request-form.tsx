"use client";

import { useState, useTransition } from "react";
import { Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requestJoinLeague } from "@/actions/league";
import { toast } from "sonner";

interface JoinRequestFormProps {
  token: string;
  leagueName: string;
  leagueDescription: string | null;
}

export function JoinRequestForm({ token, leagueName, leagueDescription }: JoinRequestFormProps) {
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  const handleRequest = () => {
    startTransition(async () => {
      const result = await requestJoinLeague(token);
      if (result.error) { toast.error(result.error); return; }
      toast.success(result.success);
      setSent(true);
    });
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <Users className="h-10 w-10 text-primary" />
        </div>
        <CardTitle>Unisciti a {leagueName}</CardTitle>
        {leagueDescription && (
          <CardDescription>{leagueDescription}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {sent ? (
          <p className="text-center text-sm text-muted-foreground">
            Richiesta inviata! L&apos;admin valuterà la tua richiesta.
          </p>
        ) : (
          <Button className="w-full" onClick={handleRequest} disabled={isPending}>
            {isPending ? "Invio in corso..." : "Richiedi di unirti"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
