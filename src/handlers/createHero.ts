import { Hero$create } from '@dl/api'
import { Response } from 'express'
import Joi from 'joi'

import * as db from '../gateways/storage'
import { ValidatedRequest } from '../middlewares/validator'

export const schema = {
  body: Joi.object<Hero$create['request']['body']>({
    name: Joi.string().trim().min(1).required(),
    classId: Joi.number().integer().min(1).required(),
    active: Joi.boolean().optional(),
  }),
}

export async function handler(
  req: ValidatedRequest<typeof schema>,
  res: Response<Hero$create['response']>
): Promise<void> {
  const hero = await db.insertHero({
    name: req.body.name,
    classId: req.body.classId,
    active: req.body.active ?? true,
  })
  res.status(201).send(hero)
}
