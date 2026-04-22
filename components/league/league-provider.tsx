"use client";

import { createContext, useContext } from "react";
import { LeagueRole } from "@prisma/client";

interface LeagueContextValue {
  leagueId: string;
  leagueName: string;
  role: LeagueRole;
}

const LeagueContext = createContext<LeagueContextValue | null>(null);

export function LeagueProvider({
  leagueId,
  leagueName,
  role,
  children,
}: {
  leagueId: string;
  leagueName: string;
  role: LeagueRole;
  children: React.ReactNode;
}) {
  return (
    <LeagueContext.Provider value={{ leagueId, leagueName, role }}>
      {children}
    </LeagueContext.Provider>
  );
}

export function useLeague(): LeagueContextValue {
  const ctx = useContext(LeagueContext);
  if (!ctx) throw new Error("useLeague must be used inside LeagueProvider");
  return ctx;
}
