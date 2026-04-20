"use client";

import { useTransition } from "react";
import { LeagueRole } from "@prisma/client";
import { Crown, Shield, User, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { removeMember, promoteMember } from "@/actions/league";
import { toast } from "sonner";

interface Member {
  id: string;
  league_id: string;
  user_id: string;
  role: LeagueRole;
  User: { id: string; name: string | null; email: string | null; image: string | null };
}

interface MembersTableProps {
  members: Member[];
  currentUserId: string;
  currentUserRole: LeagueRole;
  leagueId: string;
}

const roleIcon = { OWNER: Crown, MANAGER: Shield, MEMBER: User };
const roleBadgeVariant = { OWNER: "default", MANAGER: "secondary", MEMBER: "outline" } as const;

export function MembersTable({ members, currentUserId, currentUserRole, leagueId }: MembersTableProps) {
  const [isPending, startTransition] = useTransition();
  const isOwner = currentUserRole === LeagueRole.OWNER;

  const handleRemove = (userId: string) => {
    startTransition(async () => {
      const result = await removeMember(leagueId, userId);
      if (result.error) toast.error(result.error);
      else toast.success(result.success);
    });
  };

  const handlePromote = (userId: string, role: string) => {
    startTransition(async () => {
      const result = await promoteMember(leagueId, userId, role as LeagueRole);
      if (result.error) toast.error(result.error);
      else toast.success(result.success);
    });
  };

  return (
    <div className="space-y-2">
      {members.map((member) => {
        const Icon = roleIcon[member.role];
        const isSelf = member.user_id === currentUserId;
        const canManage = isOwner && !isSelf && member.role !== LeagueRole.OWNER;

        return (
          <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
            <Avatar className="h-8 w-8">
              <AvatarImage src={member.User.image ?? undefined} />
              <AvatarFallback>{member.User.name?.[0] ?? "?"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{member.User.name ?? "Utente"}</p>
              <p className="text-xs text-muted-foreground truncate">{member.User.email}</p>
            </div>
            <Badge variant={roleBadgeVariant[member.role]} className="gap-1 shrink-0">
              <Icon className="h-3 w-3" />
              {member.role}
            </Badge>
            {canManage && (
              <div className="flex items-center gap-2">
                <Select
                  defaultValue={member.role}
                  onValueChange={(val) => handlePromote(member.user_id, val)}
                  disabled={isPending}
                >
                  <SelectTrigger className="h-7 w-28 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="MEMBER">Member</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => handleRemove(member.user_id)}
                  disabled={isPending}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
