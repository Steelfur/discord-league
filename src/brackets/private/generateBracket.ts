/**
 * Pure builder for a single double-elimination bracket.
 *
 * Input: participant ids already ordered by seed (index 0 = seed 1 = strongest).
 * Output: a flat list of bracket "slots" with local string keys and routing
 * (`winnerToKey` / `loserToKey` + slot) that the storage layer turns into rows
 * with real ids. Byes (seed numbers beyond the field) are resolved here so the
 * first real round only contains genuine matchups.
 */

export type Side = 'winners' | 'losers' | 'grandFinal'
export type SlotName = 'A' | 'B'

export interface LocalMatch {
  key: string
  side: Side
  round: number
  slot: number
  participantAId: number | null
  participantBId: number | null
  seedA: number | null
  seedB: number | null
  winnerId: number | null
  winnerToKey: string | null
  winnerToSlot: SlotName | null
  loserToKey: string | null
  loserToSlot: SlotName | null
}

function nextPow2(n: number): number {
  let p = 1
  while (p < n) p *= 2
  return p
}

/** Classic bracket seed order: size 4 -> [1,4,2,3], size 8 -> [1,8,4,5,2,7,3,6]. */
function seedOrder(size: number): number[] {
  let seeds = [1, 2]
  while (seeds.length < size) {
    const sum = seeds.length * 2 + 1
    const next: number[] = []
    for (const s of seeds) next.push(s, sum - s)
    seeds = next
  }
  return seeds
}

const K = (side: 'W' | 'L' | 'GF', round: number, slot: number) => `${side}-${round}-${slot}`

export function generateBracket(seededParticipantIds: number[]): LocalMatch[] {
  const n = seededParticipantIds.length
  if (n < 2) return []

  const size = nextPow2(n)
  const wbRounds = Math.log2(size)
  const order = seedOrder(size)
  const idForSeed = (seed: number): number | null => seededParticipantIds[seed - 1] ?? null

  const matches = new Map<string, LocalMatch>()
  const make = (m: Omit<LocalMatch, 'winnerId'>) => matches.set(m.key, { ...m, winnerId: null })

  const grandKey = K('GF', 1, 0)

  // ---- winners bracket ----
  for (let round = 1; round <= wbRounds; round++) {
    const count = size / 2 ** round
    for (let slot = 0; slot < count; slot++) {
      const key = K('W', round, slot)
      const isFinal = round === wbRounds
      const winnerToKey = isFinal ? grandKey : K('W', round + 1, Math.floor(slot / 2))
      const winnerToSlot: SlotName = isFinal ? 'A' : slot % 2 === 0 ? 'A' : 'B'
      make({
        key,
        side: 'winners',
        round,
        slot,
        participantAId: null,
        participantBId: null,
        seedA: round === 1 ? order[slot * 2] : null,
        seedB: round === 1 ? order[slot * 2 + 1] : null,
        winnerToKey,
        winnerToSlot,
        // losers routing is filled in below
        loserToKey: null,
        loserToSlot: null,
      })
    }
  }
  // seed round 1
  for (let slot = 0; slot < size / 2; slot++) {
    const m = matches.get(K('W', 1, slot))!
    m.participantAId = idForSeed(m.seedA!)
    m.participantBId = idForSeed(m.seedB!)
  }

  // ---- losers bracket ----
  // lbRounds = 2 * wbRounds - 2   (0 when size === 2)
  const lbRounds = 2 * wbRounds - 2
  for (let k = 1; k <= lbRounds; k++) {
    const exp = Math.floor((k - 1) / 2) + 2
    const count = Math.max(1, size / 2 ** exp)
    for (let slot = 0; slot < count; slot++) {
      const key = K('L', k, slot)
      const isLast = k === lbRounds
      // Odd LB rounds feed 1:1 into slot A of the next (even) round, whose slot B
      // is reserved for a fresh winners-bracket loser. Even LB rounds are
      // consolidation rounds and halve into the next round.
      let winnerToKey: string
      let winnerToSlot: SlotName
      if (isLast) {
        winnerToKey = grandKey
        winnerToSlot = 'B'
      } else if (k % 2 === 1) {
        winnerToKey = K('L', k + 1, slot)
        winnerToSlot = 'A'
      } else {
        winnerToKey = K('L', k + 1, Math.floor(slot / 2))
        winnerToSlot = slot % 2 === 0 ? 'A' : 'B'
      }
      make({
        key,
        side: 'losers',
        round: k,
        slot,
        participantAId: null,
        participantBId: null,
        seedA: null,
        seedB: null,
        winnerToKey,
        winnerToSlot,
        loserToKey: null,
        loserToSlot: null,
      })
    }
  }

  // route winners-bracket losers into the losers bracket
  if (lbRounds > 0) {
    // WB round 1 losers -> LB round 1 (two per LB match)
    for (let slot = 0; slot < size / 2; slot++) {
      const src = matches.get(K('W', 1, slot))!
      src.loserToKey = K('L', 1, Math.floor(slot / 2))
      src.loserToSlot = slot % 2 === 0 ? 'A' : 'B'
    }
    // WB round r (r>=2) losers -> LB round 2*(r-1), slot B
    for (let r = 2; r <= wbRounds; r++) {
      const lbRound = 2 * (r - 1)
      const count = size / 2 ** r
      for (let slot = 0; slot < count; slot++) {
        const src = matches.get(K('W', r, slot))!
        src.loserToKey = K('L', lbRound, slot)
        src.loserToSlot = 'B'
      }
    }
  } else {
    // size === 2: WB final loser goes straight to the grand final
    matches.get(K('W', 1, 0))!.loserToKey = grandKey
    matches.get(K('W', 1, 0))!.loserToSlot = 'B'
  }

  // ---- grand final ----
  make({
    key: grandKey,
    side: 'grandFinal',
    round: 1,
    slot: 0,
    participantAId: null,
    participantBId: null,
    seedA: null,
    seedB: null,
    winnerToKey: null,
    winnerToSlot: null,
    loserToKey: null,
    loserToSlot: null,
  })

  resolveByes(matches)
  return [...matches.values()]
}

/** Auto-advance any match where one player is set and the other slot can never fill. */
function resolveByes(matches: Map<string, LocalMatch>): void {
  // A slot is "closed empty" if nothing routes into it and it has no participant.
  const routedInto = new Set<string>() // `${key}:${slot}`
  for (const m of matches.values()) {
    if (m.winnerToKey) routedInto.add(`${m.winnerToKey}:${m.winnerToSlot}`)
    if (m.loserToKey) routedInto.add(`${m.loserToKey}:${m.loserToSlot}`)
  }

  let changed = true
  while (changed) {
    changed = false
    for (const m of matches.values()) {
      if (m.winnerId != null) continue
      const aFilled = m.participantAId != null
      const bFilled = m.participantBId != null
      const aEmpty = !aFilled && !routedInto.has(`${m.key}:A`)
      const bEmpty = !bFilled && !routedInto.has(`${m.key}:B`)

      let advancing: number | null = null
      if (aFilled && bEmpty) advancing = m.participantAId
      else if (bFilled && aEmpty) advancing = m.participantBId
      else if (aEmpty && bEmpty) advancing = null // dead match, nothing to do
      if (advancing == null) continue

      m.winnerId = advancing
      changed = true
      if (m.winnerToKey) {
        const dest = matches.get(m.winnerToKey)!
        if (m.winnerToSlot === 'A') dest.participantAId = advancing
        else dest.participantBId = advancing
        routedInto.delete(`${m.winnerToKey}:${m.winnerToSlot}`)
      }
      // a bye has no loser: close that downstream slot
      if (m.loserToKey) {
        routedInto.delete(`${m.loserToKey}:${m.loserToSlot}`)
      }
    }
  }
}
