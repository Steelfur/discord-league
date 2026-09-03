import { Pod6Tournament } from './pod6'
import { TournamentData, PodData, MatchData, ParticipantData } from './types'

// There is only one tournament format now: pods of ~6, ranked head-to-head.
export function toTournament(
  tournament: TournamentData,
  pods: PodData[],
  matches: MatchData[],
  participants: ParticipantData[]
): Pod6Tournament {
  return new Pod6Tournament(tournament, pods, matches, participants)
}
