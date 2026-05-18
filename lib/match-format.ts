export type MatchFormat = "NORMALE" | "GIRONE" | "BRACKET_ELIMINATION" | "BRACKET_GROUPS"

export type BracketSlot = {
  round: string
  bracket_slot: number
  pair_a: number | null  // seed index (0-based) or null if TBD
  pair_b: number | null
  fed_from_slot_a: number | null  // bracket_slot of game whose winner fills pair_a
  fed_from_slot_b: number | null
}

export function deriveFormat(
  numTeams: number,
  adminChoice?: "GIRONE" | "BRACKET_ELIMINATION" | "BRACKET_GROUPS"
): MatchFormat {
  if (numTeams === 2) return "NORMALE"
  if (numTeams === 3) return "GIRONE"
  return adminChoice ?? "GIRONE"
}

export function roundRobinPairs(n: number): [number, number][] {
  const pairs: [number, number][] = []
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++)
      pairs.push([i, j])
  return pairs
}

// Returns the smallest power of 2 >= n
function nextPowerOf2(n: number): number {
  let p = 1
  while (p < n) p *= 2
  return p
}

// Builds a single-elimination bracket for numTeams participants.
// Seeds are 0-based indices into the seeded team array.
// Returns slots in bracket_slot order (1-based).
// First-round byes are represented by games where pair_b = null (the seed advances automatically).
export function buildEliminationBracket(numTeams: number): BracketSlot[] {
  const bracketSize = nextPowerOf2(numTeams)
  const rounds = Math.log2(bracketSize)
  const slots: BracketSlot[] = []
  let slotCounter = 1

  // Build from final backwards
  // Use a recursive structure: each round doubles the games
  // Round labels: FINAL, SF, QF, R16, R32...
  const roundLabels: Record<number, string> = {
    1: "FINAL",
    2: "SF",
    4: "QF",
    8: "R16",
    16: "R32",
  }

  // First round: assign seeds using standard bracket seeding (1 vs last, 2 vs second-to-last, etc.)
  const firstRoundGames = bracketSize / 2
  const roundLabel = roundLabels[firstRoundGames] ?? `R${firstRoundGames}`

  // Standard seeding order for bracket: 1v(n), 2v(n-1), etc. in interleaved pattern
  const seeds = buildSeedOrder(bracketSize)

  for (let i = 0; i < firstRoundGames; i++) {
    const seedA = seeds[i * 2]      // 0-based seed index
    const seedB = seeds[i * 2 + 1]  // 0-based seed index

    // If seedA or seedB >= numTeams, that's a "bye" (no opponent)
    const pairA = seedA < numTeams ? seedA : null
    const pairB = seedB < numTeams ? seedB : null

    slots.push({
      round: roundLabel,
      bracket_slot: slotCounter++,
      pair_a: pairA,
      pair_b: pairB,
      fed_from_slot_a: null,
      fed_from_slot_b: null,
    })
  }

  // Subsequent rounds: winners feed into next round
  let prevRoundStart = 0
  let prevRoundCount = firstRoundGames

  for (let r = 1; r < rounds; r++) {
    const thisRoundCount = prevRoundCount / 2
    const thisRoundLabel = roundLabels[thisRoundCount] ?? `R${thisRoundCount}`

    for (let i = 0; i < thisRoundCount; i++) {
      const feeder1 = slots[prevRoundStart + i * 2]
      const feeder2 = slots[prevRoundStart + i * 2 + 1]

      slots.push({
        round: thisRoundLabel,
        bracket_slot: slotCounter++,
        pair_a: null,  // TBD — filled when feeder1 completes
        pair_b: null,  // TBD — filled when feeder2 completes
        fed_from_slot_a: feeder1.bracket_slot,
        fed_from_slot_b: feeder2.bracket_slot,
      })
    }

    prevRoundStart += prevRoundCount
    prevRoundCount = thisRoundCount
  }

  return slots
}

// Standard seeding pattern for single-elimination bracket
// Returns array of seed indices (0-based) in matchup order
function buildSeedOrder(bracketSize: number): number[] {
  let order = [0, bracketSize - 1]
  while (order.length < bracketSize) {
    const next: number[] = []
    for (const seed of order) {
      next.push(seed, bracketSize - 1 - seed)
    }
    order = next
  }
  return order
}

export function totalGames(
  numTeams: number,
  format: MatchFormat,
  numGamesNormal = 1
): number {
  if (format === "NORMALE") return numGamesNormal
  if (format === "GIRONE") return (numTeams * (numTeams - 1)) / 2
  // BRACKET: all slots including byes (byes auto-resolve, no game needed)
  const bracket = buildEliminationBracket(numTeams)
  // Count only real games (both pair_a and pair_b have a seed, or are fed games)
  // For BRACKET_GROUPS we count all bracket games + group games — simplified for now
  return bracket.length
}

export function formatLabel(format: MatchFormat): string {
  switch (format) {
    case "NORMALE": return "Normale"
    case "GIRONE": return "Girone all'italiana"
    case "BRACKET_ELIMINATION": return "Eliminazione diretta"
    case "BRACKET_GROUPS": return "Gironi + Eliminazione"
  }
}
