import * as express from 'express'

import { processBrackets } from '../brackets'
import * as db from '../gateways/storage'
import { toTournament } from '../tournaments'

export async function handler(
  req: express.Request<{ tournamentId: string }>,
  res: express.Response
): Promise<void> {
  const tournamentId = parseInt(req.params.tournamentId, 10)
  if (isNaN(tournamentId)) {
    res.sendStatus(400)
    return
  }

  const tournamentRecord = await db.fetchTournament(tournamentId)
  if (tournamentRecord == null) {
    res.sendStatus(404)
    return
  }
  // 'endOfGroup' starts the bracket; 'bracket' re-seeds it.
  if (tournamentRecord.statusId !== 'endOfGroup' && tournamentRecord.statusId !== 'bracket') {
    res.status(403).send('The group stage has to be closed before the bracket can start.')
    return
  }

  const podRecords = await db.fetchTournamentPods(tournamentRecord.id)
  const matchRecords = await db.fetchMatchesForMultiplePods(podRecords.map((pod) => pod.id))
  const participantRecords = await db.fetchMultipleParticipantsWithUserData(
    matchRecords.flatMap((match) => [match.playerAId, match.playerBId])
  )

  const tournament = toTournament(tournamentRecord, podRecords, matchRecords, participantRecords)
  const podResults = tournament.toPodResults()

  const cutSize = await processBrackets(tournamentRecord.id, podResults)
  if (cutSize < 2) {
    res
      .status(409)
      .send(
        `Only ${cutSize} player(s) finished with a winning record — not enough for a bracket. Report more results first.`
      )
    return
  }

  if (tournamentRecord.statusId === 'endOfGroup') {
    await Promise.all([
      db.lockTournamentDecklists(tournamentId),
      db.updateTournament(tournamentId, { statusId: 'bracket' }),
    ])
  }

  res.sendStatus(200)
}
