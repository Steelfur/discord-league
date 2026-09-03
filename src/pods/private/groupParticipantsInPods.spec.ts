import test from 'ava'

import { groupParticipantsInPods } from './groupParticipantsInPods'
import { Player } from './types'

function players(n: number): Player[] {
  return Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    userId: `u${i + 1}`,
    heroId: 1,
    tournamentId: 1,
    dropped: false,
    bracket: null,
  }))
}

for (const [n, size] of [
  [1, 6],
  [5, 6],
  [6, 6],
  [7, 6],
  [13, 6],
  [24, 8],
  [30, 8],
] as const) {
  test(`groupParticipantsInPods(${size}, ${n}): places everyone, pods within 1 of each other`, (t) => {
    const pods = groupParticipantsInPods(size, players(n))

    const placed = pods.flatMap((p) => p.players.map((pl) => pl.id))
    t.is(placed.length, n, 'every participant placed exactly once')
    t.is(new Set(placed).size, n, 'no participant placed twice')

    const sizes = pods.map((p) => p.players.length)
    t.true(Math.max(...sizes) - Math.min(...sizes) <= 1, `pod sizes ${sizes} differ by > 1`)
    t.true(pods.length >= 1)
  })
}

test('groupParticipantsInPods: no participants -> no pods', (t) => {
  t.deepEqual(groupParticipantsInPods(6, []), [])
})
