import { BadgeType } from "@prisma/client";

export const BADGE_DEFINITIONS = [
  // Season badges
  {
    key: "top_scorer",
    name: "Capocannoniere",
    description: "Più gol segnati in una stagione",
    icon: "⚽",
    type: BadgeType.SEASON,
  },
  {
    key: "most_wins",
    name: "Re delle vittorie",
    description: "Più vittorie accumulate in una stagione",
    icon: "🏆",
    type: BadgeType.SEASON,
  },
  {
    key: "best_field_rating",
    name: "Miglior campo",
    description: "Rating campo più alto in stagione (min. 5 partite)",
    icon: "⭐",
    type: BadgeType.SEASON,
  },
  {
    key: "best_gk_rating",
    name: "Miglior portiere",
    description: "Rating portiere più alto in stagione (min. 5 partite)",
    icon: "🧤",
    type: BadgeType.SEASON,
  },
  {
    key: "most_improved",
    name: "Più migliorato",
    description: "Maggior crescita di livello rispetto alla stagione precedente",
    icon: "📈",
    type: BadgeType.SEASON,
  },
  {
    key: "season_champion",
    name: "Campione",
    description: "Primo in classifica alla fine della stagione",
    icon: "👑",
    type: BadgeType.SEASON,
  },
  // Career badges
  {
    key: "first_goal",
    name: "Primo gol",
    description: "Primo gol segnato in carriera",
    icon: "🎯",
    type: BadgeType.CAREER,
  },
  {
    key: "hat_trick",
    name: "Hat-trick",
    description: "3 gol segnati in una sola gara",
    icon: "🎩",
    type: BadgeType.CAREER,
  },
  {
    key: "matches_10",
    name: "Veterano",
    description: "10 giornate giocate",
    icon: "🔟",
    type: BadgeType.CAREER,
  },
  {
    key: "matches_50",
    name: "Esperto",
    description: "50 giornate giocate",
    icon: "🌟",
    type: BadgeType.CAREER,
  },
  {
    key: "matches_100",
    name: "Leggenda",
    description: "100 giornate giocate",
    icon: "💯",
    type: BadgeType.CAREER,
  },
  {
    key: "perfect_10",
    name: "Perfetto",
    description: "Ha ricevuto un voto 10 da un compagno",
    icon: "🌈",
    type: BadgeType.CAREER,
  },
  {
    key: "ironman_5",
    name: "Ironman",
    description: "5 giornate consecutive senza saltarne una",
    icon: "🔥",
    type: BadgeType.CAREER,
  },
  {
    key: "ironman_10",
    name: "Super Ironman",
    description: "10 giornate consecutive senza saltarne una",
    icon: "⚡",
    type: BadgeType.CAREER,
  },
  {
    key: "ironman_20",
    name: "Leggenda Ironman",
    description: "20 giornate consecutive senza saltarne una",
    icon: "🌊",
    type: BadgeType.CAREER,
  },
] as const;

export type BadgeKey = (typeof BADGE_DEFINITIONS)[number]["key"];

export const RARE_BADGE_KEYS: BadgeKey[] = [
  "season_champion",
  "hat_trick",
  "matches_100",
  "perfect_10",
  "ironman_20",
];
