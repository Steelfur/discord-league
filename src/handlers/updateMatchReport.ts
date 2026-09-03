import { Match$updateReport } from '@dl/api'
import { Request, Response } from 'express'
import Joi from 'joi'

import * as db from '../gateways/storage'
import { ValidatedRequest } from '../middlewares/validator'

export const schema = {
  body: Joi.object<Match$updateReport['request']['body']>({
    id: Joi.number().integer().required(),
    winnerId: Joi.number().integer().allow(null).optional(),
    isDraw: Joi.boolean().optional(),
    noShow: Joi.boolean().optional(),
    firstPlayerId: Joi.number().integer().optional(),
    playerAHeroId: Joi.number().integer().min(1).optional(),
    playerBHeroId: Joi.number().integer().min(1).optional(),
  }),
}

function userIsAdmin(request: Request) {
  return request.user?.flags === 1
}

function userIsParticipant(request: Request, participants: db.ParticipantWithUserData[]) {
  return participants.find((participant) => participant.userId === request.user?.d_id)
}

export async function handler(
  req: ValidatedRequest<typeof schema, Match$updateReport['request']['params']>,
  res: Response<Match$updateReport['response']>
): Promise<void> {
  const matchId = parseInt(req.params.matchId, 10)
  if (isNaN(matchId)) {
    res.sendStatus(400)
    return
  }

  const match = await db.fetchMatch(matchId)
  if (!match) {
    res.sendStatus(404)
    return
  }

  const participants = await db.fetchMultipleParticipantsWithUserData([
    match.playerAId,
    match.playerBId,
  ])

  if (!(userIsAdmin(req) || userIsParticipant(req, participants))) {
    res.sendStatus(403)
    return
  }

  const { winnerId } = req.body
  if (winnerId != null && winnerId !== match.playerAId && winnerId !== match.playerBId) {
    res.status(400).send()
    return
  }

  await db.updateMatch({
    id: match.id,
    winnerId: winnerId ?? undefined,
    isDraw: req.body.isDraw ?? false,
    noShow: req.body.noShow ?? false,
    firstPlayerId: req.body.firstPlayerId,
    playerAHeroId: req.body.playerAHeroId,
    playerBHeroId: req.body.playerBHeroId,
  })

  res.sendStatus(204)
}
