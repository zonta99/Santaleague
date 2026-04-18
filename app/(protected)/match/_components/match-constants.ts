import { MatchStatus } from "@prisma/client";

export const statusLabel: Record<MatchStatus, string> = {
  SCHEDULED: "Programmata",
  ONGOING: "In corso",
  COMPLETED: "Conclusa",
  CANCELED: "Annullata",
};

export const statusVariant: Record<MatchStatus, "default" | "secondary" | "destructive" | "outline"> = {
  SCHEDULED: "secondary",
  ONGOING: "default",
  COMPLETED: "outline",
  CANCELED: "destructive",
};
