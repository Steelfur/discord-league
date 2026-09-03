import { pg } from './pg'
import { TABLE as PODS_MATCHES } from './podsMatches'

export const TABLE = 'matches'

export interface MatchRecord {
  id: number
  createdAt: Date
  updatedAt: Date
  playerAId: number
  playerBId: number
  winnerId?: number
  firstPlayerId?: number
  playerAHeroId?: number
  playerBHeroId?: number
  isDraw: boolean
  noShow: boolean
  deadline?: Date
}

export type MatchRecordWithPodId = MatchRecord & { podId: number }

const matchRecordWithPodIdColumns = [
  `${TABLE}.id as id`,
  `${TABLE}.createdAt as createdAt`,
  `${TABLE}.updatedAt as updatedAt`,
  `${TABLE}.playerAId as playerAId`,
  `${TABLE}.playerBId as playerBId`,
  `${TABLE}.winnerId as winnerId`,
  `${TABLE}.firstPlayerId as firstPlayerId`,
  `${TABLE}.playerAHeroId as playerAHeroId`,
  `${TABLE}.playerBHeroId as playerBHeroId`,
  `${TABLE}.isDraw as isDraw`,
  `${TABLE}.noShow as noShow`,
  `${TABLE}.deadline as deadline`,
  `${PODS_MATCHES}.podId as podId`,
]

type MatchSummary = Pick<
  MatchRecord,
  | 'createdAt'
  | 'playerAHeroId'
  | 'playerBHeroId'
  | 'isDraw'
  | 'noShow'
  | 'firstPlayerId'
  | 'id'
  | 'playerAId'
  | 'playerBId'
  | 'updatedAt'
  | 'winnerId'
>

const MATCH_SUMMARY_SELECT = `
  mat."playerAHeroId",
  mat."playerBHeroId",
  mat."isDraw",
  mat."noShow",
  mat."firstPlayerId",
  mat."id",
  mat."playerAId",
  mat."playerBId",
  mat."createdAt",
  mat."updatedAt",
  mat."winnerId"
`

export async function fetchMatchesForUserInTournament(
  discordId: string,
  tournamentId: number
): Promise<MatchSummary[]> {
  return pg
    .raw(
      `
      SELECT ${MATCH_SUMMARY_SELECT}
      FROM "participants" AS part
        INNER JOIN "matches" AS mat
          ON mat."playerAId" = part."id" OR mat."playerBId" = part."id"
      WHERE part."tournamentId" = :tournamentId
        AND part."userId" = :discordId
  `,
      { tournamentId, discordId }
    )
    .then(({ rows }) => rows)
}

export async function fetchMatchesForTournament(tournamentId: number): Promise<MatchSummary[]> {
  return pg
    .raw(
      `
      SELECT ${MATCH_SUMMARY_SELECT}
      FROM "participants" AS part
        INNER JOIN "matches" AS mat
          ON mat."playerAId" = part."id" OR mat."playerBId" = part."id"
      WHERE part."tournamentId" = :tournamentId
  `,
      { tournamentId }
    )
    .then(({ rows }) => rows)
}

export async function insertMatch(
  match: Omit<MatchRecord, 'id' | 'createdAt' | 'updatedAt' | 'isDraw' | 'noShow'> &
    Partial<Pick<MatchRecord, 'isDraw' | 'noShow'>>
): Promise<MatchRecord> {
  return pg(TABLE)
    .insert(match, '*')
    .then(([row]) => row)
}

export async function fetchMatchesForMultiplePods(
  podIds: number[]
): Promise<MatchRecordWithPodId[]> {
  return pg(TABLE)
    .leftJoin(`${PODS_MATCHES}`, 'matches.id', `${PODS_MATCHES}.matchId`)
    .whereIn(`${PODS_MATCHES}.podId`, podIds)
    .select(matchRecordWithPodIdColumns)
}

export async function fetchMatchesForMultipleParticipants(
  participantIds: number[]
): Promise<MatchRecord[]> {
  return pg(TABLE).whereIn('playerAId', participantIds).orWhereIn('playerBId', participantIds)
}

export async function fetchMatch(matchId: number): Promise<MatchRecord> {
  return pg(TABLE).where('id', matchId).first()
}

export async function updateMatch(
  match: Pick<MatchRecord, 'id'> &
    Partial<
      Pick<
        MatchRecord,
        'winnerId' | 'firstPlayerId' | 'playerAHeroId' | 'playerBHeroId' | 'isDraw' | 'noShow'
      >
    >
): Promise<MatchRecord> {
  const result = await pg(TABLE)
    .where('id', match.id)
    .update({ ...match, updatedAt: new Date() }, '*')
  return result[0]
}

export async function deleteMatchReport(matchId: number): Promise<MatchRecord> {
  const result = await pg(TABLE)
    .where('id', matchId)
    .update(
      {
        winnerId: pg.raw('DEFAULT'),
        firstPlayerId: pg.raw('DEFAULT'),
        isDraw: pg.raw('DEFAULT'),
        noShow: pg.raw('DEFAULT'),
        updatedAt: new Date(),
      },
      '*'
    )
  return result[0]
}

export async function deleteMatches(matchIds: number[]): Promise<void> {
  return pg(TABLE)
    .whereIn('id', matchIds)
    .del()
    .then(() => undefined)
}
