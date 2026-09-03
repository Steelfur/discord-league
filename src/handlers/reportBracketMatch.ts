import { BracketMatch$report } from '@dl/api'
import { Response } from 'express'
import Joi from 'joi'

import * as db from '../gateways/storage'
import { ValidatedRequest } from '../middlewares/validator'

export const schema = {
  body: Joi.object<BracketMatch$report['request']['body']>({
    winnerId: Joi.number().integer().required(),
  }),
}

export async function handler(
  req: ValidatedRequest<typeof schema, BracketMatch$report['request']['params']>,
  res: Response<BracketMatch$report['response']>
): Promise<void> {
  const matchId = parseInt(req.params.matchId, 10)
  if (isNaN(matchId)) {
    res.sendStatus(400)
    return
  }

  const match = await db.fetchBracketMatchById(matchId)
  if (!match) {
    res.sendStatus(404)
    return
  }

  const isAdmin = req.user?.flags === 1
  if (!isAdmin) {
    const ids = [match.participantAId, match.participantBId].filter(
      (id): id is number => id != null
    )
    const participants = await db.fetchMultipleParticipantsWithUserData(ids)
    if (!participants.some((p) => p.userId === req.user?.d_id)) {
      res.sendStatus(403)
      return
    }
  }

  try {
    await db.applyBracketResult(matchId, req.body.winnerId)
    res.sendStatus(204)
  } catch (error) {
    res.status(400).send()
  }
}
