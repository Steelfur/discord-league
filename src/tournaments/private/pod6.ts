import { LeagueBase } from './leagueBase'
import { PlayerRecord, MatchData, ExtendedParticipant, RankedParticipant } from './types'
import { rankPodParticipants } from '../../pods'

export class Pod6Tournament extends LeagueBase {
  protected playerRecordReduce(
    records: Record<number, PlayerRecord>,
    match: MatchData
  ): Record<number, PlayerRecord> {
    const { [match.playerAId]: recordPlayerA, [match.playerBId]: recordPlayerB } = records

    if (recordPlayerA.dropped !== recordPlayerB.dropped) {
      // One of the participants dropped, but not both. Results need to be adjusted
      const [winner, loser] = recordPlayerA.dropped
        ? [recordPlayerB, recordPlayerA]
        : [recordPlayerA, recordPlayerB]
      winner.wins = winner.wins + 1
      loser.losses = loser.losses + 1
    } else if (match.winnerId != null) {
      // There's a match report, follow normal process
      const [winnerRecord, loserRecord] =
        match.winnerId === recordPlayerA.participantId
          ? [recordPlayerA, recordPlayerB]
          : [recordPlayerB, recordPlayerA]
      winnerRecord.wins = winnerRecord.wins + 1
      loserRecord.losses = loserRecord.losses + 1
    } else if (this.isPodStageDone) {
      // enforce double loss to unplayed matches
      recordPlayerA.losses = recordPlayerA.losses + 1
      recordPlayerB.losses = recordPlayerB.losses + 1
    }

    return records
  }

  protected rankParticipants(
    extendedParticipants: ExtendedParticipant[],
    matches: MatchData[]
  ): RankedParticipant[] {
    const rankedParticipants = rankPodParticipants(extendedParticipants, matches)
    // `bracket` is the "made the cut" flag set by closeGroupStage — keep it as
    // stored, don't re-derive it from pod position.
    return rankedParticipants.flatMap(({ id }, idx) => {
      const participant = extendedParticipants.find(
        (extendedParticipant) => id === extendedParticipant.id
      )
      return participant ? [{ ...participant, position: idx + 1 }] : []
    })
  }
}
