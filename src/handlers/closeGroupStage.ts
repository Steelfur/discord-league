import { Request, Response } from 'express'
import { toTournament } from '../tournaments'
import { computeCut } from '../brackets'

import * as db from '../gateways/storage'

function getParticipantIdsForMatches(matches: db.MatchRecordWithPodId[]): number[] {
  const participantIds = matches.flatMap((match) =>
    match.playerAId && match.playerBId ? [match.playerAId, match.playerBId] : []
  )
  return Array.from(new Set(participantIds))
}

export async function handler(
  req: Request<{ tournamentId: string }>,
  res: Response
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
  } else if (tournamentRecord.statusId !== 'group') {
    res.status(403).send('Tournament status incompatible with group stage cleanup')
    return
  }

  const pods = await db.fetchTournamentPods(tournamentId)
  if (pods.length === 0) {
    res.status(409).send('This tournament has no pods. Start the group stage first.')
    return
  }
  const matches = await db.fetchMatchesForMultiplePods(pods.map((pod) => pod.id))
  const participantIds = getParticipantIdsForMatches(matches)
  const participants = participantIds.length
    ? await db.fetchMultipleParticipantsWithUserData(participantIds)
    : []

  const tournament = toTournament(tournamentRecord, pods, matches, participants)
  const podResults = tournament.toPodResults()

  // Everyone with a winning record makes the cut into the bracket. `bracket`
  // is reused as an "in the cut" flag ('goldCup' = in, null = out).
  const cutIds = new Set(computeCut(podResults))
  const allIds = podResults.flatMap((p) => p.participants.map((x) => x.id))
  const inCut = allIds.filter((id) => cutIds.has(id))
  const out = allIds.filter((id) => !cutIds.has(id))

  await Promise.all([
    db.updateTournament(tournamentId, { statusId: 'endOfGroup' }),
    db.updateParticipants(inCut, { bracket: 'goldCup' }),
    db.updateParticipants(out, { bracket: null }),
  ])

  res.sendStatus(200)
}
