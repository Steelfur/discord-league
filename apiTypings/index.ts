export type WithParsedDates<T, K extends keyof T> = {
  [P in keyof T]: P extends K ? Date : T[P]
}

export interface BracketMatch {
  id: number
  tournamentId: number
  side: 'winners' | 'losers' | 'grandFinal'
  round: number
  slot: number
  participantAId: number | null
  participantBId: number | null
  winnerId: number | null
  seedA: number | null
  seedB: number | null
  winnerToId: number | null
  winnerToSlot: 'A' | 'B' | null
  loserToId: number | null
  loserToSlot: 'A' | 'B' | null
}

export interface BracketMatch$report {
  request: { params: { matchId: string }; body: { winnerId: number } }
  response: void
}

export interface Class {
  id: number
  name: string
  sortOrder: number
  active: boolean
}

export interface Hero {
  id: number
  name: string
  classId: number
  active: boolean
}

export interface Decklist {
  bracket: 'silverCup' | 'goldCup' | null
  heroId: number
  decklist: string
  discordAvatar: string
  discordId: string
  discordName: string
  link: string
  locked: boolean
  participantId: number
}

export interface Tournament {
  id: number
  name: string
  startDate: string
  statusId: 'upcoming' | 'group' | 'endOfGroup' | 'bracket' | 'finished'
  typeId: 'monthly' | 'pod6'
  description?: string
}
export interface Participant {
  id: number
  userId: string
  heroId: number
  dropped: boolean
  discordAvatar: string
  discordId: string
  discordName: string
  bracket: 'silverCup' | 'goldCup' | null
  wins: number
  losses: number
  position: number
}

export interface ParticipantWithUserData {
  id: number
  userId: string
  heroId: number
  discordAvatar: string
  discordId: string
  discordName: string
  discordTag: string
  dropped: boolean
  bracket: 'silverCup' | 'goldCup' | null
}

export interface MatchData {
  id: number
  podId: number
  createdAt: Date
  updatedAt: Date
  playerAId: number
  playerBId: number
  winnerId?: number
  firstPlayerId?: number
  playerAHeroId?: number
  playerBHeroId?: number
  isDraw: boolean
  noShow: boolean
  deadline?: Date
}

export type ShortMatchData = Omit<MatchData, 'podId'>

export interface ExtendedMatch {
  id: number
  createdAt: Date
  updatedAt: Date
  playerAId: number
  playerBId: number
  winnerId?: number
  firstPlayerId?: number
  playerAHeroId?: number
  playerBHeroId?: number
  isDraw: boolean
  noShow: boolean
  deadline?: Date
  participantA: ParticipantWithUserData
  participantB: ParticipantWithUserData
}

export interface RankedParticipant {
  bracket: 'silverCup' | 'goldCup' | null
  heroId: number
  discordAvatar: string
  discordId: string
  discordName: string
  discordTag: string
  dropped: boolean
  id: number
  losses: number
  position: number
  userId: string
  wins: number
}

export interface PodResult {
  id: number
  name: string
  tournamentId: number
  matches: MatchData[]
  participants: RankedParticipant[]
}

export interface User {
  discordId: string
  gemId?: string
  permissions: number
  preferredHeroId?: number
  displayAvatarURL: string
  tag: string
}

export interface UserRowData {
  discordName: string
  displayAvatarURL: string
  gemId: string
  preferredHero: string
  preferredHeroId?: number
  role: 'Player' | 'Admin'
  userId: string
}

export interface Pod$findById {
  request: { params: { podId: string } }
  response: PodResult
}

export interface User$findById {
  request: { params: { userId: string } }
  response: User
}

export interface User$findMatches {
  request: { params: { userId: string } }
  response: Array<{
    tournament: Tournament
    matchesDone: ExtendedMatch[]
    matchesToPlay: ExtendedMatch[]
  }>
}

export interface User$findCurrent {
  response: User
}

export interface User$patchById {
  request: {
    params: { userId: string }
    body: Partial<{ permissions: number; preferredHeroId: number; gemId: string }>
  }
  response: User
}

export interface User$findAll {
  response: UserRowData[]
}

export interface Match$updateReport {
  request: {
    params: { matchId: string }
    body: {
      id: number
      // winnerId set => that player won. Omit / null for a draw or all-no-show.
      winnerId?: number | null
      isDraw?: boolean
      noShow?: boolean
      firstPlayerId?: number
      playerAHeroId?: number
      playerBHeroId?: number
    }
  }
  response: undefined
}

export interface Participant$drop {
  request: {
    params: { participantId: string }
  }
  response: void
}

export interface Decklist$findAllForTournament {
  request: {
    params: { tournamentId: string }
  }
  response: Decklist[]
}

export interface Decklist$createForParticipant {
  request: {
    params: { participantId: string }
    body: { link: string; decklist?: string }
  }
  response: void
}

export interface Decklist$updateForParticipant {
  request: {
    params: { participantId: string }
    body: { link: string; decklist?: string }
  }
  response: void
}

export interface Tournament$findAll {
  response: {
    upcoming: Tournament[]
    ongoing: Tournament[]
    past: Tournament[]
  }
}

export interface Tournament$updateById {
  request: {
    params: { tournamentId: string }
    body: Omit<Tournament, 'id'>
  }
  response: void
}

export interface Tournament$deleteById {
  request: {
    params: { tournamentId: string }
  }
  response: void
}

export interface Tournament$startGroupStage {
  request: {
    params: { tournamentId: string }
    body: { deadline: string }
  }
  response: void
}

export interface Tournament$findById {
  request: { params: { tournamentId: string } }
  response: {
    tournament: Tournament
    pods: PodResult[]
    bracketMatches: BracketMatch[]
    participants: RankedParticipant[]
  }
}

export interface Tournament$findStatistics {
  request: { params: { tournamentId: string } }
  response: {
    // [classId, powerScore] — Markov-stable win-power per class, descending.
    ranking: [classId: number, power: number][]
  }
}

export interface Class$findAll {
  response: Class[]
}

export interface Class$create {
  request: { body: { name: string } }
  response: Class
}

export interface Class$update {
  request: {
    params: { classId: string }
    body: Partial<{ name: string; sortOrder: number; active: boolean }>
  }
  response: Class
}

export interface Class$delete {
  request: { params: { classId: string } }
  response: void
}

export interface Hero$findAll {
  response: Hero[]
}

export interface Hero$create {
  request: { body: { name: string; classId: number; active?: boolean } }
  response: Hero
}

export interface Hero$update {
  request: {
    params: { heroId: string }
    body: Partial<{ name: string; classId: number; active: boolean }>
  }
  response: Hero
}

export interface Hero$delete {
  request: { params: { heroId: string } }
  response: void
}
