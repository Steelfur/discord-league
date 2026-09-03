import { pg } from './pg'
import type { LocalMatch } from '../../../brackets/private/generateBracket'

export const TABLE = 'bracket_matches'

export interface BracketMatchRecord {
  id: number
  tournamentId: number
  side: 'winners' | 'losers' | 'grandFinal'
  round: number
  slot: number
  participantAId: number | null
  participantBId: number | null
  winnerId: number | null
  seedA: number | null
  seedB: number | null
  winnerToId: number | null
  winnerToSlot: 'A' | 'B' | null
  loserToId: number | null
  loserToSlot: 'A' | 'B' | null
}

const columns = [
  'id',
  'tournamentId',
  'side',
  'round',
  'slot',
  'participantAId',
  'participantBId',
  'winnerId',
  'seedA',
  'seedB',
  'winnerToId',
  'winnerToSlot',
  'loserToId',
  'loserToSlot',
]

export async function fetchBracketMatches(tournamentId: number): Promise<BracketMatchRecord[]> {
  return pg(TABLE)
    .select(columns)
    .where({ tournamentId })
    .orderBy([{ column: 'side' }, { column: 'round' }, { column: 'slot' }])
}

export async function fetchBracketMatchById(id: number): Promise<BracketMatchRecord | undefined> {
  return pg(TABLE).select(columns).where({ id }).first()
}

/** Replace a tournament's bracket with a freshly seeded one. */
export async function createBracketMatches(
  tournamentId: number,
  local: LocalMatch[]
): Promise<void> {
  await pg.transaction(async (trx) => {
    await trx(TABLE).where({ tournamentId }).del()

    const keyToId = new Map<string, number>()
    for (const m of local) {
      const [row] = await trx(TABLE).insert(
        {
          tournamentId,
          side: m.side,
          round: m.round,
          slot: m.slot,
          participantAId: m.participantAId,
          participantBId: m.participantBId,
          winnerId: m.winnerId,
          seedA: m.seedA,
          seedB: m.seedB,
        },
        ['id']
      )
      keyToId.set(m.key, row.id)
    }

    for (const m of local) {
      await trx(TABLE)
        .where({ id: keyToId.get(m.key) })
        .update({
          winnerToId: m.winnerToKey ? keyToId.get(m.winnerToKey) ?? null : null,
          winnerToSlot: m.winnerToSlot,
          loserToId: m.loserToKey ? keyToId.get(m.loserToKey) ?? null : null,
          loserToSlot: m.loserToSlot,
        })
    }
  })
}

/**
 * Record a winner for one bracket match and push the winner / loser into their
 * next slots. Placing a player into a downstream match clears that match's
 * result, so it must be re-reported.
 */
export async function applyBracketResult(matchId: number, winnerId: number): Promise<void> {
  await pg.transaction(async (trx) => {
    const m: BracketMatchRecord | undefined = await trx(TABLE).where({ id: matchId }).first(columns)
    if (!m) {
      throw new Error('bracket match not found')
    }
    if (winnerId !== m.participantAId && winnerId !== m.participantBId) {
      throw new Error('winner is not in this match')
    }
    const loserId = winnerId === m.participantAId ? m.participantBId : m.participantAId

    await trx(TABLE).where({ id: matchId }).update({ winnerId, updated_at: new Date() })

    const place = async (targetId: number, slot: 'A' | 'B' | null, participantId: number) => {
      const col = slot === 'B' ? 'participantBId' : 'participantAId'
      await trx(TABLE)
        .where({ id: targetId })
        .update({ [col]: participantId, winnerId: null, updated_at: new Date() })
    }

    if (m.winnerToId) {
      await place(m.winnerToId, m.winnerToSlot, winnerId)
    }
    if (m.loserToId && loserId != null) {
      await place(m.loserToId, m.loserToSlot, loserId)
    }
  })
}
