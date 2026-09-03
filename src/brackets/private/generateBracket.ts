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

  return pruneByes(matches)
}

interface Feeder {
  match: LocalMatch
  outcome: 'winner' | 'loser'
}

/**
 * Remove bye paths produced by a non-power-of-2 field:
 *  - a real participant with no opponent auto-advances (the empty match is dropped)
 *  - a slot fed by a match whose sibling slot can never fill collapses: the feeder
 *    is rewired straight to where this match's winner would have gone.
 */
function pruneByes(matchMap: Map<string, LocalMatch>): LocalMatch[] {
  const removed = new Set<string>()

  const rebuildFeeders = () => {
    const feeders = new Map<string, Feeder>() // `${key}:${slot}` -> feeder
    for (const m of matchMap.values()) {
      if (removed.has(m.key)) continue
      if (m.winnerToKey && !removed.has(m.winnerToKey)) {
        feeders.set(`${m.winnerToKey}:${m.winnerToSlot}`, { match: m, outcome: 'winner' })
      }
      if (m.loserToKey && !removed.has(m.loserToKey)) {
        feeders.set(`${m.loserToKey}:${m.loserToSlot}`, { match: m, outcome: 'loser' })
      }
    }
    return feeders
  }

  let changed = true
  while (changed) {
    changed = false
    const feeders = rebuildFeeders()
    const sourced = (key: string, slot: 'A' | 'B', has: boolean) =>
      has || feeders.has(`${key}:${slot}`)

    for (const m of matchMap.values()) {
      if (removed.has(m.key) || m.winnerId != null || m.side === 'grandFinal') continue
      const aSourced = sourced(m.key, 'A', m.participantAId != null)
      const bSourced = sourced(m.key, 'B', m.participantBId != null)
      if (aSourced && bSourced) continue

      const liveSlot: 'A' | 'B' | null = aSourced ? 'A' : bSourced ? 'B' : null
      if (liveSlot == null) {
        removed.add(m.key)
        changed = true
        continue
      }

      const participant = liveSlot === 'A' ? m.participantAId : m.participantBId
      if (participant != null) {
        // real player, no opponent: advance them and drop this match
        if (m.winnerToKey) {
          const dest = matchMap.get(m.winnerToKey)!
          if (m.winnerToSlot === 'A') dest.participantAId = participant
          else dest.participantBId = participant
        }
      } else {
        // fed by a match whose sibling is dead: rewire that feeder past us
        const feeder = feeders.get(`${m.key}:${liveSlot}`)!
        if (feeder.outcome === 'winner') {
          feeder.match.winnerToKey = m.winnerToKey
          feeder.match.winnerToSlot = m.winnerToSlot
        } else {
          feeder.match.loserToKey = m.winnerToKey
          feeder.match.loserToSlot = m.winnerToSlot
        }
      }
      removed.add(m.key)
      changed = true
    }
  }

  return [...matchMap.values()].filter((m) => !removed.has(m.key))
}
