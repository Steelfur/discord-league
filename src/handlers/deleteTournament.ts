import { Tournament$deleteById } from '@dl/api'
import { Request, Response } from 'express'
import * as db from '../gateways/storage'

export async function handler(
  req: Request<Tournament$deleteById['request']['params']>,
  res: Response<Tournament$deleteById['response']>
): Promise<void> {
  const tournamentId = parseInt(req.params.tournamentId, 10)
  if (isNaN(tournamentId)) {
    res.sendStatus(400)
    return
  }

  const tournament = await db.getTournament(tournamentId)
  if (!tournament) {
    res.sendStatus(404)
    return
  }

  // Admin-only route: delete the tournament and everything attached to it,
  // whatever stage it is in.
  await db.deleteTournamentDeep(tournamentId)
  res.sendStatus(204)
}
