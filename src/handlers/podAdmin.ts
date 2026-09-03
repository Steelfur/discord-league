import { Response } from 'express'
import Joi from 'joi'

import * as db from '../gateways/storage'
import { ValidatedRequest } from '../middlewares/validator'

// PATCH /pod/:podId  { name }
export const renameSchema = {
  body: Joi.object<{ name: string }>({
    name: Joi.string().trim().min(1).required(),
  }),
}

export async function renameHandler(
  req: ValidatedRequest<typeof renameSchema, { podId: string }>,
  res: Response
): Promise<void> {
  const podId = parseInt(req.params.podId, 10)
  if (isNaN(podId)) {
    res.sendStatus(400)
    return
  }
  const pod = await db.fetchPod(podId)
  if (!pod) {
    res.sendStatus(404)
    return
  }
  const updated = await db.updatePod(podId, { name: req.body.name })
  res.status(200).send(updated)
}

// POST /pod/:podId/move-participant  { participantId }
export const moveSchema = {
  body: Joi.object<{ participantId: number }>({
    participantId: Joi.number().integer().required(),
  }),
}

export async function moveParticipantHandler(
  req: ValidatedRequest<typeof moveSchema, { podId: string }>,
  res: Response
): Promise<void> {
  const podId = parseInt(req.params.podId, 10)
  if (isNaN(podId)) {
    res.sendStatus(400)
    return
  }
  const pod = await db.fetchPod(podId)
  if (!pod) {
    res.sendStatus(404)
    return
  }

  try {
    await db.moveParticipantToPod(req.body.participantId, podId)
    res.sendStatus(200)
  } catch (error) {
    res.status(400).send(error instanceof Error ? error.message : 'Could not move participant')
  }
}
