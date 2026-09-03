import { Class$findAll, Hero$findAll } from '@dl/api'
import { Request, Response } from 'express'

import * as db from '../gateways/storage'

export async function classesHandler(
  _req: Request,
  res: Response<Class$findAll['response']>
): Promise<void> {
  const classes = await db.fetchClasses()
  res.status(200).send(classes)
}

export async function heroesHandler(
  _req: Request,
  res: Response<Hero$findAll['response']>
): Promise<void> {
  const heroes = await db.fetchHeroes()
  res.status(200).send(heroes)
}
