import { Class$create, Class$update } from '@dl/api'
import { Request, Response } from 'express'
import Joi from 'joi'

import * as db from '../gateways/storage'
import { ValidatedRequest } from '../middlewares/validator'

export const createSchema = {
  body: Joi.object<Class$create['request']['body']>({
    name: Joi.string().trim().min(1).required(),
  }),
}

export async function createHandler(
  req: ValidatedRequest<typeof createSchema>,
  res: Response<Class$create['response']>
): Promise<void> {
  const created = await db.insertClass({ name: req.body.name })
  res.status(201).send(created)
}

export const updateSchema = {
  body: Joi.object<Class$update['request']['body']>({
    name: Joi.string().trim().min(1).optional(),
    sortOrder: Joi.number().integer().optional(),
    active: Joi.boolean().optional(),
  }),
}

export async function updateHandler(
  req: ValidatedRequest<typeof updateSchema, Class$update['request']['params']>,
  res: Response<Class$update['response']>
): Promise<void> {
  const classId = parseInt(req.params.classId, 10)
  if (isNaN(classId)) {
    res.sendStatus(400)
    return
  }
  const existing = await db.fetchClass(classId)
  if (!existing) {
    res.sendStatus(404)
    return
  }
  const updated = await db.updateClass(classId, req.body)
  res.status(200).send(updated)
}

export async function deleteHandler(
  req: Request<{ classId: string }>,
  res: Response
): Promise<void> {
  const classId = parseInt(req.params.classId, 10)
  if (isNaN(classId)) {
    res.sendStatus(400)
    return
  }
  try {
    await db.deleteClass(classId)
    res.sendStatus(204)
  } catch (error) {
    if (db.isDbError(error) && error.code === '23503') {
      res
        .status(409)
        .send(
          'Cannot delete: a hero in this class has been used in a tournament. Reassign it first.'
        )
      return
    }
    throw error
  }
}
