import { pg } from './pg'
import { UserRecord } from './user'

export const TABLE = 'participants'

export interface ParticipantRecord {
  id: number
  userId: string
  heroId: number
  tournamentId: number
  dropped: boolean
  bracket: 'silverCup' | 'goldCup' | null
}

export type ParticipantWithUserData = ParticipantRecord &
  Pick<UserRecord, 'discordAvatar' | 'discordId' | 'discordName'> & {
    discordTag: string
  }

// Discord dropped discriminators; migrated accounts have "0". Show a bare
// username in that case rather than "name#0".
const DISCORD_TAG = `
  CASE
    WHEN u."discordDiscriminator" IS NULL OR u."discordDiscriminator" IN ('0', '')
      THEN u."discordName"
    ELSE CONCAT(u."discordName", '#', u."discordDiscriminator")
  END as "discordTag"
`

const PARTICIPANT_SELECT = `
  p."id" as "id",
  p."userId" as "userId",
  p."heroId" as "heroId",
  p."tournamentId" as "tournamentId",
  p."dropped" as "dropped",
  p."bracket" as "bracket",
  u."discordId" as "discordId",
  u."discordName" as "discordName",
  u."discordAvatar" as "discordAvatar",
  ${DISCORD_TAG}
`

export async function fetchParticipant(
  participantId: number
): Promise<ParticipantRecord | undefined> {
  return pg(TABLE).where('id', participantId).first()
}

export async function fetchParticipants(tournamentId: number): Promise<ParticipantWithUserData[]> {
  return pg
    .raw(
      `
      SELECT ${PARTICIPANT_SELECT}
      FROM "participants" as p
      INNER JOIN "users" as u ON u."discordId" = p."userId"
      WHERE p."tournamentId" = :tournamentId
  `,
      { tournamentId }
    )
    .then(({ rows }) => rows)
}

export async function fetchParticipantsForUser(userId: string): Promise<ParticipantRecord[]> {
  return pg
    .raw(
      `
      SELECT *
      FROM "participants" AS p
      WHERE p."userId" = :userId
  `,
      { userId }
    )
    .then(({ rows }) => rows)
}

export async function fetchParticipantWithUserData(
  participantId: number
): Promise<ParticipantWithUserData> {
  return pg
    .raw(
      `
      SELECT ${PARTICIPANT_SELECT}
      FROM "participants" as p
      INNER JOIN "users" as u ON u."discordId" = p."userId"
      WHERE p."id" = :participantId
      LIMIT 1
  `,
      { participantId }
    )
    .then(({ rows }) => rows[0])
}

export async function fetchMultipleParticipantsWithUserData(
  participantIds: number[]
): Promise<ParticipantWithUserData[]> {
  return pg
    .raw(
      `
      SELECT ${PARTICIPANT_SELECT}
      FROM "participants" as p
      INNER JOIN "users" as u ON u."discordId" = p."userId"
      WHERE p."id" IN(:participantIds)
  `,
      { participantIds: pg.raw(participantIds) }
    )
    .then(({ rows }) => rows)
}

export async function updateParticipant(
  participant: Pick<ParticipantRecord, 'id'> & Partial<Pick<ParticipantRecord, 'userId' | 'heroId'>>
): Promise<ParticipantRecord> {
  const result = await pg(TABLE)
    .where('id', participant.id)
    .update({ ...participant }, '*')
  return result[0]
}

export async function updateParticipants(
  ids: ParticipantRecord['id'][],
  update: Partial<Pick<ParticipantRecord, 'heroId' | 'dropped' | 'bracket'>>
): Promise<ParticipantRecord[]> {
  return pg(TABLE).whereIn('id', ids).update(update, '*')
}

export async function insertParticipant(
  participant: Pick<ParticipantRecord, 'userId' | 'heroId' | 'tournamentId'>
): Promise<ParticipantRecord> {
  return pg(TABLE)
    .insert(participant, '*')
    .then(([row]) => row)
}

export async function deleteParticipant(id: number): Promise<void> {
  return pg(TABLE)
    .where('id', id)
    .del()
    .then(() => undefined)
}

export async function dropParticipant(id: number): Promise<number> {
  return pg(TABLE).update({ dropped: true }).where('id', id)
}
