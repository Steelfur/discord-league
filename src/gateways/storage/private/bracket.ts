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

// Recursively wipe a slot and everything it feeds downstream.
async function clearFrom(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  trx: any,
  matchId: number,
  slot: 'A' | 'B' | null
): Promise<void> {
  const m: BracketMatchRecord | undefined = await trx(TABLE).where({ id: matchId }).first(columns)
  if (!m) return
  const col = slot === 'B' ? 'participantBId' : 'participantAId'
  const hadWinner = m.winnerId != null
  await trx(TABLE)
    .where({ id: matchId })
    .update({ [col]: null, winnerId: null, updated_at: new Date() })
  if (hadWinner) {
    if (m.winnerToId) await clearFrom(trx, m.winnerToId, m.winnerToSlot)
    if (m.loserToId) await clearFrom(trx, m.loserToId, m.loserToSlot)
  }
}

/**
 * Record a winner for one bracket match and push the winner / loser into their
 * next slots. If a downstream slot changes hands, that match and everything
 * below it is reset so it can be re-reported.
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
      const dest: BracketMatchRecord = await trx(TABLE).where({ id: targetId }).first(columns)
      if (dest && dest[col as 'participantAId' | 'participantBId'] !== participantId) {
        await clearFrom(trx, targetId, slot)
      }
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

/** Clear a bracket match's result and reset everything it fed. */
export async function clearBracketResult(matchId: number): Promise<void> {
  await pg.transaction(async (trx) => {
    const m: BracketMatchRecord | undefined = await trx(TABLE).where({ id: matchId }).first(columns)
    if (!m) throw new Error('bracket match not found')
    await trx(TABLE).where({ id: matchId }).update({ winnerId: null, updated_at: new Date() })
    if (m.winnerToId) await clearFrom(trx, m.winnerToId, m.winnerToSlot)
    if (m.loserToId) await clearFrom(trx, m.loserToId, m.loserToSlot)
  })
}
