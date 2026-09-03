import { Tournament$findStatistics } from '@dl/api'
import { Request, Response } from 'express'

import * as db from '../gateways/storage'
import { powerRanking, RankableMatch } from '../statistics'

export async function handler(
  req: Request<Tournament$findStatistics['request']['params']>,
  res: Response<Tournament$findStatistics['response']>
): Promise<void> {
  const tournamentId = parseInt(req.params.tournamentId, 10)
  if (isNaN(tournamentId)) {
    res.sendStatus(400)
    return
  }

  const tournamentRecord = await db.getTournament(tournamentId)
  if (!tournamentRecord) {
    res.sendStatus(404)
    return
  }

  const [matches, heroes, classes] = await Promise.all([
    db.fetchMatchesForTournament(tournamentRecord.id),
    db.fetchHeroes(),
    db.fetchClasses(),
  ])

  const classIdByHeroId = new Map(heroes.map((h) => [h.id, h.classId]))

  // Only decisive, played games between two known, different classes count.
  const rankableMatches: RankableMatch[] = matches.flatMap((m) => {
    const entityA = m.playerAHeroId != null ? classIdByHeroId.get(m.playerAHeroId) : undefined
    const entityB = m.playerBHeroId != null ? classIdByHeroId.get(m.playerBHeroId) : undefined
    if (
      m.winnerId == null ||
      m.isDraw ||
      m.noShow ||
      entityA == null ||
      entityB == null ||
      entityA === entityB
    ) {
      return []
    }
    return [
      {
        playerAId: m.playerAId,
        playerBId: m.playerBId,
        winnerId: m.winnerId,
        entityA,
        entityB,
      },
    ]
  })

  const classesWithGames = new Set(rankableMatches.flatMap((m) => [m.entityA, m.entityB]))
  const rankedClassIds = classes.map((c) => c.id).filter((id) => classesWithGames.has(id))

  const ranking = powerRanking(rankableMatches, rankedClassIds)
    .sort(([, powerA], [, powerB]) => -(powerA - powerB))
    .map<[classId: number, power: number]>(([classId, power]) => [
      classId,
      Math.round(power * 1000) / 10,
    ])

  res.status(200).send({ ranking })
}
