import { pg } from './pg'

export const TABLE = 'pods'

export interface TournamentPodRecord {
  id: number
  name: string
  tournamentId: number
}

export async function createTournamentPod(
  tournamentPod: Omit<TournamentPodRecord, 'id'>
): Promise<TournamentPodRecord> {
  return pg(TABLE)
    .insert(tournamentPod, '*')
    .then(([row]) => row)
}

export async function updatePod(
  podId: number,
  update: Partial<Pick<TournamentPodRecord, 'name'>>
): Promise<TournamentPodRecord> {
  const [row] = await pg(TABLE).where('id', podId).update(update, '*')
  return row
}

export async function fetchTournamentPods(tournamentId: number): Promise<TournamentPodRecord[]> {
  return pg(TABLE).where('tournamentId', tournamentId)
}

export async function fetchPod(podId: number): Promise<TournamentPodRecord | undefined> {
  return pg(TABLE).where('id', podId).first()
}

/**
 * Move a participant into `targetPodId`: drop their existing pod matches for
 * this tournament and create a fresh round-robin set against the target pod's
 * current members.
 */
export async function moveParticipantToPod(
  participantId: number,
  targetPodId: number
): Promise<void> {
  await pg.transaction(async (trx) => {
    const targetPod = await trx('pods').where({ id: targetPodId }).first()
    if (!targetPod) throw new Error('target pod not found')

    // this tournament's pod ids
    const podIds = (
      await trx('pods').where({ tournamentId: targetPod.tournamentId }).select('id')
    ).map((r) => r.id)

    // the participant's current matches within those pods
    const currentMatchIds = (
      await trx('matches')
        .join('pods_matches', 'matches.id', 'pods_matches.matchId')
        .whereIn('pods_matches.podId', podIds)
        .andWhere(function () {
          this.where('matches.playerAId', participantId).orWhere('matches.playerBId', participantId)
        })
        .select('matches.id')
    ).map((r) => r.id)

    if (currentMatchIds.length) {
      await trx('pods_matches').whereIn('matchId', currentMatchIds).del()
      await trx('matches').whereIn('id', currentMatchIds).del()
    }

    const participant = await trx('participants').where({ id: participantId }).first()
    if (!participant) throw new Error('participant not found')

    // members already in the target pod (and a deadline to copy)
    const targetMatches = await trx('matches')
      .join('pods_matches', 'matches.id', 'pods_matches.matchId')
      .where('pods_matches.podId', targetPodId)
      .select('matches.playerAId', 'matches.playerBId', 'matches.deadline')
    const deadline = targetMatches[0]?.deadline
    const memberIds = Array.from(
      new Set(targetMatches.flatMap((m) => [m.playerAId, m.playerBId]))
    ).filter((id) => id !== participantId)

    if (!memberIds.length) return

    const members = await trx('participants').whereIn('id', memberIds).select('id', 'heroId')
    for (const member of members) {
      const [match] = await trx('matches').insert(
        {
          playerAId: member.id,
          playerAHeroId: member.heroId,
          playerBId: participantId,
          playerBHeroId: participant.heroId,
          deadline,
        },
        ['id']
      )
      await trx('pods_matches').insert({ podId: targetPodId, matchId: match.id })
    }
  })
}
