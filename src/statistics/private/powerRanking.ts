import * as A from 'fp-ts/lib/Array'
import { markovStable } from './markovStable'

/**
 * Markov-stable "power" ranking over a set of entities (classes) based on
 * head-to-head match results. Ported from the original per-clan "kami" ranking,
 * generalised to any set of entity ids and count.
 */

export interface RankableMatch {
  playerAId: number
  playerBId: number
  winnerId: number
  entityA: number
  entityB: number
}

const MIN_MATCHES_EASE_IN = 5

const MirrorMatch = Symbol('MirrorMatch')

export function powerRanking(
  matches: RankableMatch[],
  entityIds: number[]
): [entityId: number, power: number][] {
  const ids = Array.from(new Set(entityIds)).sort((a, b) => a - b)
  const count = ids.length
  if (count === 0) {
    return []
  }

  const makeTable = (): Map<number, Map<number, RankableMatch[]>> =>
    new Map(ids.map((idA) => [idA, new Map(ids.map((idB) => [idB, [] as RankableMatch[]]))]))

  const table = matches.reduce((table, match) => {
    const rowA = table.get(match.entityA)
    const rowB = table.get(match.entityB)
    if (!rowA || !rowB) {
      return table
    }
    rowA.get(match.entityB)?.push(match)
    rowB.get(match.entityA)?.push(match)
    return table
  }, makeTable())

  const ns = Array.from(table.entries()).map<[entityId: number, matchVector: number[]]>(
    ([entityId, matchMap]) => {
      const firstPass = Array.from(matchMap.entries()).map(([oppId, oppMatches]) => {
        if (oppId === entityId) {
          return MirrorMatch
        } else if (oppMatches.length === 0) {
          return 0.5 / count
        } else {
          const losses = oppMatches.filter((m) =>
            m.playerAId === m.winnerId ? m.entityB === entityId : m.entityA === entityId
          ).length

          const matchesToEaseIn = Math.max(0, MIN_MATCHES_EASE_IN - oppMatches.length)
          const easedLosses = losses + matchesToEaseIn * 0.5 + 0.5
          const easedMatchCount = oppMatches.length + matchesToEaseIn + 1

          return easedLosses / easedMatchCount / count
        }
      })
      const secondPass = firstPass.map((n) => {
        if (n !== MirrorMatch) {
          return n
        }
        return 1 - firstPass.reduce<number>((a, b) => (b === MirrorMatch ? a : a + b), 0)
      })

      return [entityId, secondPass]
    }
  )

  const matrix = ns.sort(([a], [b]) => a - b).map(([, vector]) => vector)
  const steady = markovStable(matrix)
  return A.zip(
    ns.map(([id]) => id),
    steady
  )
}
