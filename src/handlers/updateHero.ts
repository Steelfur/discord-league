import { Hero$update } from '@dl/api'
import { Response } from 'express'
import Joi from 'joi'

import * as db from '../gateways/storage'
import { ValidatedRequest } from '../middlewares/validator'

export const schema = {
  body: Joi.object<Hero$update['request']['body']>({
    name: Joi.string().trim().min(1).optional(),
    classId: Joi.number().integer().min(1).optional(),
    active: Joi.boolean().optional(),
  }),
}

export async function handler(
  req: ValidatedRequest<typeof schema, Hero$update['request']['params']>,
  res: Response<Hero$update['response']>
): Promise<void> {
  const heroId = parseInt(req.params.heroId, 10)
  if (isNaN(heroId)) {
    res.sendStatus(400)
    return
  }

  const existing = await db.fetchHero(heroId)
  if (!existing) {
    res.sendStatus(404)
    return
  }

  const hero = await db.updateHero(heroId, req.body)
  res.status(200).send(hero)
}
