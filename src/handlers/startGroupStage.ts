import { Tournament$startGroupStage as API, WithParsedDates } from '@dl/api'
import { Response } from 'express'
import Joi from 'joi'

import * as db from '../gateways/storage'
import { ValidatedRequest } from '../middlewares/validator'
import { createPodsForParticipants } from '../pods'

export const schema = {
  body: Joi.object<WithParsedDates<API['request']['body'], 'deadline'>>({
    deadline: Joi.date().required(),
  }),
}

export async function handler(
  req: ValidatedRequest<typeof schema, API['request']['params']>,
  res: Response<API['response']>
): Promise<void> {
  const tournamentId = parseInt(req.params.tournamentId, 10)
  if (isNaN(tournamentId)) {
    res.sendStatus(400)
    return
  }

  const tournament = await db.fetchTournament(tournamentId)
  if (tournament == null) {
    res.sendStatus(404)
    return
  } else if (tournament.statusId !== 'upcoming') {
    res.sendStatus(403)
    return
  }

  await db.updateTournament(tournament.id, { statusId: 'group' })

  const participants = await db.fetchParticipants(tournamentId)
  await createPodsForParticipants(tournamentId, tournament.typeId, req.body.deadline, participants)

  res.sendStatus(201)
}
