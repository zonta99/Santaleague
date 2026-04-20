"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Shield } from "lucide-react";
import { LeagueRole } from "@prisma/client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { acceptInvite, setActiveLeagueAction } from "@/actions/league";
import { toast } from "sonner";

interface InviteAcceptProps {
  token: string;
  leagueName: string;
  role: LeagueRole;
}

const roleLabel = { OWNER: "Proprietario", MANAGER: "Manager", MEMBER: "Membro" };

export function InviteAccept({ token, leagueName, role }: InviteAcceptProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleAccept = () => {
    startTransition(async () => {
      const result = await acceptInvite(token);
      if (result.error) { toast.error(result.error); return; }
      if (result.leagueId) await setActiveLeagueAction(result.leagueId);
      toast.success(result.success);
      router.push("/dashboard");
    });
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <Shield className="h-10 w-10 text-primary" />
        </div>
        <CardTitle>Invito a {leagueName}</CardTitle>
        <CardDescription>
          Sei stato invitato come <strong>{roleLabel[role]}</strong> in questa lega.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button className="w-full" onClick={handleAccept} disabled={isPending}>
          {isPending ? "Accettazione..." : "Accetta invito"}
        </Button>
      </CardContent>
    </Card>
  );
}
