import * as express from 'express-serve-static-core'
import Joi from 'joi'

import * as db from '../gateways/storage'
import { ValidatedRequest } from '../middlewares/validator'

export const schema = {
  body: Joi.object<{
    userId: string
    heroId: number
  }>({
    userId: Joi.string().required(),
    heroId: Joi.number().integer().min(1).required(),
  }),
}

export async function handler(
  req: ValidatedRequest<typeof schema, { tournamentId: string }>,
  res: express.Response
): Promise<void> {
  if (!req.user?.d_id && req.user?.flags !== 1 && req.user?.d_id !== req.body.userId) {
    res.status(403).send('You cannot register this user as participant.')
    return
  }

  const tournamentId = parseInt(req.params.tournamentId, 10)
  if (isNaN(tournamentId)) {
    res.status(400).send()
    return
  }

  const participant = await db.insertParticipant({
    userId: req.body.userId,
    tournamentId: tournamentId,
    heroId: req.body.heroId,
  })
  const participantWithUserData = await db.fetchParticipantWithUserData(participant.id)
  res.status(201).send(participantWithUserData)
}
