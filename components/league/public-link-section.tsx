"use client";

import { useState, useTransition } from "react";
import { Link, RefreshCw, X, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generatePublicLink, disablePublicLink } from "@/actions/league";
import { toast } from "sonner";

interface PublicLinkSectionProps {
  leagueId: string;
  currentToken: string | null;
  appUrl: string;
}

export function PublicLinkSection({ leagueId, currentToken, appUrl }: PublicLinkSectionProps) {
  const [isPending, startTransition] = useTransition();
  const [token, setToken] = useState<string | null>(currentToken);
  const [copied, setCopied] = useState(false);

  const url = token ? `${appUrl}/leagues/join?token=${token}` : null;

  const handleGenerate = () => {
    startTransition(async () => {
      const result = await generatePublicLink(leagueId);
      if (result.error) { toast.error(result.error); return; }
      setToken(result.token!);
      toast.success(result.success);
    });
  };

  const handleDisable = () => {
    startTransition(async () => {
      const result = await disablePublicLink(leagueId);
      if (result.error) { toast.error(result.error); return; }
      setToken(null);
      toast.success(result.success);
    });
  };

  const handleCopy = () => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Link className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Link pubblico di iscrizione</span>
      </div>
      <p className="text-xs text-muted-foreground">
        Chiunque abbia questo link può richiedere di unirsi alla lega. Le richieste devono essere approvate da un admin.
      </p>

      {url ? (
        <div className="flex gap-2">
          <Input value={url} readOnly className="text-xs h-8" />
          <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={handleCopy}>
            {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={handleGenerate} disabled={isPending} title="Rigenera link">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8 shrink-0 text-destructive hover:text-destructive" onClick={handleDisable} disabled={isPending} title="Disabilita link">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={handleGenerate} disabled={isPending}>
          <Link className="h-3.5 w-3.5 mr-2" />
          Genera link pubblico
        </Button>
      )}
    </div>
  );
}
