import * as db from '../gateways/storage'
import { groupParticipantsInPods } from './private/groupParticipantsInPods'
import { matchesForPod } from './private/matchesForPod'
import { namePods } from './private/podNames'
import { Player } from './private/types'

const POD_SIZE = 6

/**
 * Randomly split `participants` into pods of ~6, create the pod rows and every
 * round-robin match, all tagged with `deadline`.
 */
export async function createPodsForParticipants(
  tournamentId: number,
  deadline: Date,
  participants: Player[]
): Promise<void> {
  const pods = groupParticipantsInPods(POD_SIZE, participants)
  const namedPods = namePods(pods)

  await Promise.all(
    namedPods.map((pod) =>
      db
        .createTournamentPod({ tournamentId, name: pod.name })
        .then((createdPod) =>
          Promise.all(
            matchesForPod(pod).map(
              ([
                { id: playerAId, heroId: playerAHeroId },
                { id: playerBId, heroId: playerBHeroId },
              ]) =>
                db
                  .insertMatch({ playerAId, playerAHeroId, playerBId, playerBHeroId, deadline })
                  .then((match) => db.connectMatchToPod(match.id, createdPod.id))
            )
          )
        )
    )
  )
}
