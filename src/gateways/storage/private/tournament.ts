import { pg } from './pg'

export const TABLE = 'tournaments'

export interface TournamentRecord {
  id: number
  name: string
  startDate: Date
  statusId: 'upcoming' | 'group' | 'endOfGroup' | 'bracket' | 'finished'
  typeId: 'monthly' | 'pod6'
  description?: string
  createdAt: Date
  updatedAt: Date
}

export async function getTournament(id: number): Promise<TournamentRecord | undefined> {
  return pg(TABLE).select('*').where('id', id).first()
}

export async function createTournament(
  tournament: Omit<TournamentRecord, 'id' | 'createdAt' | 'updatedAt'>
): Promise<TournamentRecord> {
  return pg(TABLE)
    .insert(tournament, '*')
    .then(([row]) => row)
}

export async function deleteTournament(id: number): Promise<number> {
  return pg(TABLE).where('id', id).del()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function deepDeleteTournament(trx: any, id: number): Promise<void> {
  const participantIds = (await trx('participants').where({ tournamentId: id }).select('id')).map(
    (r: { id: number }) => r.id
  )
  const podIds = (await trx('pods').where({ tournamentId: id }).select('id')).map(
    (r: { id: number }) => r.id
  )
  const matchIds = podIds.length
    ? (await trx('pods_matches').whereIn('podId', podIds).select('matchId')).map(
        (r: { matchId: number }) => r.matchId
      )
    : []

  await trx('bracket_matches').where({ tournamentId: id }).del()
  if (participantIds.length) {
    await trx('decklists').whereIn('participantId', participantIds).del()
    await trx('feedbacks').whereIn('participantId', participantIds).del()
  }
  if (podIds.length) await trx('pods_matches').whereIn('podId', podIds).del()
  if (matchIds.length) await trx('matches').whereIn('id', matchIds).del()
  if (podIds.length) await trx('pods').whereIn('id', podIds).del()
  if (participantIds.length) await trx('participants').whereIn('id', participantIds).del()
  await trx(TABLE).where({ id }).del()
}

/** Delete a tournament and everything hanging off it, in dependency order. */
export async function deleteTournamentDeep(id: number): Promise<void> {
  await pg.transaction((trx) => deepDeleteTournament(trx, id))
}

/**
 * Delete every tournament whose participants are ALL fake "test-" users, plus
 * any now-orphaned test users.
 */
export async function purgeTestData(): Promise<{ tournaments: number; users: number }> {
  return pg.transaction(async (trx) => {
    const rows: { id: number }[] = await trx('tournaments as t')
      .select('t.id')
      .whereExists(function () {
        this.select(1)
          .from('participants as p')
          .whereRaw('p."tournamentId" = t.id')
          .andWhere('p.userId', 'like', 'test-%')
      })
      .whereNotExists(function () {
        this.select(1)
          .from('participants as q')
          .whereRaw('q."tournamentId" = t.id')
          .andWhere('q.userId', 'not like', 'test-%')
      })

    for (const { id } of rows) {
      await deepDeleteTournament(trx, id)
    }

    const users = await trx('users')
      .where('discordId', 'like', 'test-%')
      .whereNotIn('discordId', trx('participants').select('userId'))
      .del()

    return { tournaments: rows.length, users }
  })
}

/** Delete just the pods + pod matches for a tournament (used before regenerating). */
export async function deleteTournamentPodsAndMatches(id: number): Promise<void> {
  await pg.transaction(async (trx) => {
    const podIds = (await trx('pods').where({ tournamentId: id }).select('id')).map((r) => r.id)
    if (!podIds.length) return
    const matchIds = (await trx('pods_matches').whereIn('podId', podIds).select('matchId')).map(
      (r) => r.matchId
    )
    await trx('pods_matches').whereIn('podId', podIds).del()
    if (matchIds.length) await trx('matches').whereIn('id', matchIds).del()
    await trx('pods').whereIn('id', podIds).del()
  })
}

export async function updateTournament(
  id: number,
  tournament: Partial<Omit<TournamentRecord, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<TournamentRecord> {
  const result = await pg(TABLE)
    .where('id', id)
    .update({ ...tournament, updatedAt: new Date() }, '*')
  return result[0]
}

export async function getAllTournaments(): Promise<
  Array<Pick<TournamentRecord, 'id' | 'name' | 'startDate' | 'statusId' | 'typeId' | 'description'>>
> {
  return pg
    .raw(
      `
          SELECT
            "id",
            "name",
            "startDate",
            "statusId",
            "typeId",
            "description"
          FROM
            tournaments
          ORDER BY
            "startDate" DESC
      `
    )
    .then(({ rows }) => rows)
}

export async function fetchTournaments(tournamentIds: number[]): Promise<TournamentRecord[]> {
  return pg(TABLE).whereIn('id', tournamentIds)
}

export async function fetchTournament(id: number): Promise<TournamentRecord | undefined> {
  return pg(TABLE).where('id', id).first()
}

export async function fetchTournamentsForUser(
  discordId: string
): Promise<
  Array<Pick<TournamentRecord, 'id' | 'name' | 'startDate' | 'statusId' | 'typeId' | 'description'>>
> {
  return pg
    .raw(
      `
      SELECT
        tnmt."id",
        tnmt."name",
        tnmt."startDate",
        tnmt."statusId",
        tnmt."typeId",
        tnmt."description"
      FROM "participants" AS part
        INNER JOIN "tournaments" AS tnmt
          ON tnmt."id" = part."tournamentId"
      WHERE part."userId" = :discordId
        AND tnmt."statusId" IN ('group', 'endOfGroup', 'bracket', 'finished')
  `,
      { discordId }
    )
    .then(({ rows }) => rows)
}
