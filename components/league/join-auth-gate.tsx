"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface JoinAuthGateProps {
  token: string;
  leagueName: string;
  leagueDescription: string | null;
}

export function JoinAuthGate({ token, leagueName, leagueDescription }: JoinAuthGateProps) {
  const callbackUrl = encodeURIComponent(`/leagues/join?token=${token}`);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <Users className="h-10 w-10 text-primary" />
        </div>
        <CardTitle>Unisciti a {leagueName}</CardTitle>
        <CardDescription>
          {leagueDescription ?? "Accedi o registrati per richiedere di unirti a questa lega."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button asChild className="w-full">
          <Link href={`/auth/login?callbackUrl=${callbackUrl}`}>Accedi</Link>
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link href={`/auth/register?callbackUrl=${callbackUrl}`}>Registrati</Link>
        </Button>
        <p className="text-xs text-muted-foreground text-center pt-2">
          La tua richiesta dovrà essere approvata da un admin della lega.
        </p>
      </CardContent>
    </Card>
  );
}
