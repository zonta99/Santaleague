"use client";

import { useTransition } from "react";
import { Check, X, UserCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { approveJoinRequest, rejectJoinRequest } from "@/actions/league";
import { toast } from "sonner";

interface JoinRequest {
  id: string;
  created_at: Date;
  User: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
}

interface JoinRequestsListProps {
  requests: JoinRequest[];
}

function JoinRequestRow({ request }: { request: JoinRequest }) {
  const [isPending, startTransition] = useTransition();

  const handleApprove = () => {
    startTransition(async () => {
      const result = await approveJoinRequest(request.id);
      if (result.error) toast.error(result.error);
      else toast.success(result.success);
    });
  };

  const handleReject = () => {
    startTransition(async () => {
      const result = await rejectJoinRequest(request.id);
      if (result.error) toast.error(result.error);
      else toast.success(result.success);
    });
  };

  const initials = request.User.name
    ? request.User.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <div className="flex items-center gap-3 p-2 rounded border border-border bg-card/50">
      <Avatar className="h-8 w-8">
        <AvatarImage src={request.User.image ?? undefined} />
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{request.User.name ?? "Utente sconosciuto"}</p>
        <p className="text-xs text-muted-foreground truncate">{request.User.email}</p>
      </div>
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-green-500 hover:text-green-500 hover:bg-green-500/10"
          onClick={handleApprove}
          disabled={isPending}
          title="Approva"
        >
          <Check className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={handleReject}
          disabled={isPending}
          title="Rifiuta"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function JoinRequestsList({ requests }: JoinRequestsListProps) {
  if (requests.length === 0) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
        <UserCheck className="h-4 w-4" />
        <span>Nessuna richiesta in sospeso</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {requests.map((request) => (
        <JoinRequestRow key={request.id} request={request} />
      ))}
    </div>
  );
}
