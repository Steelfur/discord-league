import { fc } from 'ava-fast-check'

import { Player, Match } from './types'

export function player(opts?: Partial<Player>): fc.Arbitrary<Player> {
  return fc.record<Player>({
    id: opts?.id != null ? fc.constant(opts.id) : fc.nat(),
    userId: opts?.userId != null ? fc.constant(opts.userId) : fc.string(16, 32),
    heroId: opts?.heroId != null ? fc.constant(opts.heroId) : fc.integer(1, 7),
    tournamentId: opts?.tournamentId != null ? fc.constant(opts.tournamentId) : fc.nat(),
    timezoneId: opts?.timezoneId != null ? fc.constant(opts.timezoneId) : fc.integer(1, 7),
    timezonePreferenceId:
      opts?.timezonePreferenceId != null
        ? fc.constant(opts.timezonePreferenceId)
        : fc.constantFrom('similar', 'neutral', 'dissimilar'),
    dropped: opts?.dropped != null ? fc.constant(opts.dropped) : fc.boolean(),
    bracket: opts?.bracket != null ? fc.constant(opts.bracket) : fc.constant(null),
  })
}

export function match(opts?: Partial<Match>): fc.Arbitrary<Match> {
  return fc.record<Match>({
    id: opts?.id != null ? fc.constant(opts.id) : fc.nat(),
    createdAt: opts?.createdAt != null ? fc.constant(opts.createdAt) : fc.date(),
    updatedAt: opts?.updatedAt != null ? fc.constant(opts.updatedAt) : fc.date(),
    playerAId: opts?.playerAId != null ? fc.constant(opts.playerAId) : fc.nat(),
    playerBId: opts?.playerBId != null ? fc.constant(opts.playerBId) : fc.nat(),
    winnerId:
      opts && 'winnerId' in opts
        ? opts.winnerId === null
          ? fc.constant(undefined)
          : fc.constant(opts.winnerId)
        : fc.nat(),
    firstPlayerId:
      opts && 'firstPlayerId' in opts
        ? opts.firstPlayerId === null
          ? fc.constant(undefined)
          : fc.constant(opts.firstPlayerId)
        : fc.nat(),
    playerAHeroId:
      opts && 'playerAHeroId' in opts
        ? opts.playerAHeroId === null
          ? fc.constant(undefined)
          : fc.constant(opts.playerAHeroId)
        : fc.nat(),
    playerBHeroId:
      opts && 'playerBHeroId' in opts
        ? opts.playerBHeroId === null
          ? fc.constant(undefined)
          : fc.constant(opts.playerBHeroId)
        : fc.nat(),
    isDraw: opts?.isDraw != null ? fc.constant(opts.isDraw) : fc.constant(false),
    noShow: opts?.noShow != null ? fc.constant(opts.noShow) : fc.constant(false),
    deadline:
      opts && 'deadline' in opts
        ? opts.deadline === null
          ? fc.constant(undefined)
          : fc.constant(opts.deadline)
        : fc.date(),
  })
}
