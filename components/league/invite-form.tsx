"use client";

import { useState, useTransition } from "react";
import { Mail, Send, Trash2 } from "lucide-react";
import { LeagueRole } from "@prisma/client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { inviteMember, revokeInvite } from "@/actions/league";
import { toast } from "sonner";

interface Invite {
  id: string;
  email: string;
  role: LeagueRole;
  expires: Date;
}

interface InviteFormProps {
  leagueId: string;
  pendingInvites: Invite[];
}

export function InviteForm({ leagueId, pendingInvites }: InviteFormProps) {
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"MANAGER" | "MEMBER">("MEMBER");

  const handleInvite = () => {
    startTransition(async () => {
      const result = await inviteMember(leagueId, { email, role });
      if (result.error) toast.error(result.error);
      else { toast.success(result.success); setEmail(""); }
    });
  };

  const handleRevoke = (inviteId: string) => {
    startTransition(async () => {
      const result = await revokeInvite(leagueId, inviteId);
      if (result.error) toast.error(result.error);
      else toast.success(result.success);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="email@esempio.it"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1"
        />
        <Select value={role} onValueChange={(v) => setRole(v as "MANAGER" | "MEMBER")}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MANAGER">Manager</SelectItem>
            <SelectItem value="MEMBER">Member</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleInvite} disabled={isPending || !email} size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {pendingInvites.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Inviti in sospeso</p>
          {pendingInvites.map((invite) => (
            <div key={invite.id} className="flex items-center gap-2 p-2 rounded border border-border bg-card/50 text-sm">
              <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="flex-1 truncate">{invite.email}</span>
              <span className="text-xs text-muted-foreground">{invite.role}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive hover:text-destructive"
                onClick={() => handleRevoke(invite.id)}
                disabled={isPending}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
