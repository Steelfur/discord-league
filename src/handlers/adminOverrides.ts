import { Response } from 'express'
import Joi from 'joi'

import { processBrackets } from '../brackets'
import * as db from '../gateways/storage'
import { ValidatedRequest } from '../middlewares/validator'
import { createPodsForParticipants } from '../pods'
import { toTournament } from '../tournaments'

const STATUSES = ['upcoming', 'group', 'endOfGroup', 'bracket', 'finished'] as const

// PATCH /tournament/:tournamentId/status  { statusId }
export const setStatusSchema = {
  body: Joi.object<{ statusId: typeof STATUSES[number] }>({
    statusId: Joi.string()
      .valid(...STATUSES)
      .required(),
  }),
}

export async function setStatusHandler(
  req: ValidatedRequest<typeof setStatusSchema, { tournamentId: string }>,
  res: Response
): Promise<void> {
  const id = parseInt(req.params.tournamentId, 10)
  if (isNaN(id)) {
    res.sendStatus(400)
    return
  }
  const tournament = await db.getTournament(id)
  if (!tournament) {
    res.sendStatus(404)
    return
  }
  await db.updateTournament(id, { statusId: req.body.statusId })
  res.sendStatus(200)
}

// POST /tournament/:tournamentId/regenerate-pods  { deadline }
export const regeneratePodsSchema = {
  body: Joi.object<{ deadline: Date }>({
    deadline: Joi.date().required(),
  }),
}

export async function regeneratePodsHandler(
  req: ValidatedRequest<typeof regeneratePodsSchema, { tournamentId: string }>,
  res: Response
): Promise<void> {
  const id = parseInt(req.params.tournamentId, 10)
  if (isNaN(id)) {
    res.sendStatus(400)
    return
  }
  const tournament = await db.getTournament(id)
  if (!tournament) {
    res.sendStatus(404)
    return
  }
  if (tournament.statusId !== 'group') {
    res.status(409).send('Pods can only be regenerated during the group stage.')
    return
  }

  await db.deleteTournamentPodsAndMatches(id)
  const participants = await db.fetchParticipants(id)
  await createPodsForParticipants(id, req.body.deadline, participants)
  res.sendStatus(200)
}

// POST /tournament/:tournamentId/reseed-bracket
export async function reseedBracketHandler(
  req: ValidatedRequest<Record<string, never>, { tournamentId: string }>,
  res: Response
): Promise<void> {
  const id = parseInt(req.params.tournamentId, 10)
  if (isNaN(id)) {
    res.sendStatus(400)
    return
  }
  const tournamentRecord = await db.fetchTournament(id)
  if (!tournamentRecord) {
    res.sendStatus(404)
    return
  }
  if (tournamentRecord.statusId !== 'bracket') {
    res.status(409).send('The tournament is not in the bracket stage.')
    return
  }

  const podRecords = await db.fetchTournamentPods(id)
  const matchRecords = await db.fetchMatchesForMultiplePods(podRecords.map((p) => p.id))
  const participantRecords = await db.fetchMultipleParticipantsWithUserData(
    matchRecords.flatMap((m) => [m.playerAId, m.playerBId])
  )
  const tournament = toTournament(tournamentRecord, podRecords, matchRecords, participantRecords)
  const cutSize = await processBrackets(id, tournament.toPodResults())
  if (cutSize < 2) {
    res
      .status(409)
      .send(`Only ${cutSize} player(s) have a winning record — not enough to seed a bracket.`)
    return
  }
  res.sendStatus(200)
}
