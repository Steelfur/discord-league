import { Hero$delete } from '@dl/api'
import { Request, Response } from 'express'

import * as db from '../gateways/storage'

export async function handler(
  req: Request<Hero$delete['request']['params']>,
  res: Response
): Promise<void> {
  const heroId = parseInt(req.params.heroId, 10)
  if (isNaN(heroId)) {
    res.sendStatus(400)
    return
  }

  try {
    await db.deleteHero(heroId)
    res.sendStatus(204)
  } catch (error) {
    if (db.isDbError(error) && error.code === '23503') {
      res
        .status(409)
        .send('This hero is used by a participant or match. Set it inactive instead of deleting.')
      return
    }
    throw error
  }
}
