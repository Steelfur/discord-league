import test from 'ava'

import { generateBracket, LocalMatch } from './generateBracket'

function ids(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i + 1)
}

function byKey(matches: LocalMatch[]): Map<string, LocalMatch> {
  return new Map(matches.map((m) => [m.key, m]))
}

for (const n of [2, 3, 4, 5, 6, 7, 8, 11, 16]) {
  test(`generateBracket(${n}): structure is sound`, (t) => {
    const matches = generateBracket(ids(n))
    const map = byKey(matches)

    // exactly one grand final
    t.is(matches.filter((m) => m.side === 'grandFinal').length, 1)

    // every routing target exists and names a real slot
    const routedInto = new Map<string, number>()
    for (const m of matches) {
      for (const [toKey, toSlot] of [
        [m.winnerToKey, m.winnerToSlot],
        [m.loserToKey, m.loserToSlot],
      ] as const) {
        if (toKey == null) continue
        t.true(map.has(toKey), `${m.key} routes to missing ${toKey}`)
        t.true(toSlot === 'A' || toSlot === 'B', `${m.key} routes to bad slot ${toSlot}`)
        const dest = `${toKey}:${toSlot}`
        routedInto.set(dest, (routedInto.get(dest) ?? 0) + 1)
      }
    }

    // no destination slot is fed by two different matches
    for (const [dest, count] of routedInto) {
      t.is(count, 1, `${dest} is fed ${count} times`)
    }

    // every seeded participant shows up somewhere as a starting participant or a bye winner
    const seen = new Set<number>()
    for (const m of matches) {
      if (m.participantAId) seen.add(m.participantAId)
      if (m.participantBId) seen.add(m.participantBId)
      if (m.winnerId) seen.add(m.winnerId)
    }
    for (const id of ids(n)) {
      t.true(seen.has(id), `participant ${id} never appears`)
    }

    // the grand final is reachable from both halves (something routes into A and B)
    const gf = matches.find((m) => m.side === 'grandFinal')!
    const intoA = matches.some((m) => m.winnerToKey === gf.key && m.winnerToSlot === 'A')
    const intoBWinner = matches.some((m) => m.winnerToKey === gf.key && m.winnerToSlot === 'B')
    const intoBLoser = matches.some((m) => m.loserToKey === gf.key && m.loserToSlot === 'B')
    t.true(intoA, 'nothing routes into grand final slot A')
    t.true(intoBWinner || intoBLoser, 'nothing routes into grand final slot B')
  })
}

test('generateBracket: fewer than two players yields no bracket', (t) => {
  t.deepEqual(generateBracket([]), [])
  t.deepEqual(generateBracket([1]), [])
})

test('generateBracket(4): top seed gets a bye and auto-advances', (t) => {
  const matches = generateBracket(ids(3))
  const map = byKey(matches)
  // seed 1 vs seed 4(bye) is W-1-0
  const first = map.get('W-1-0')!
  t.is(first.participantAId, 1)
  t.is(first.participantBId, null)
  t.is(first.winnerId, 1, 'bye should auto-advance seed 1')
  const wbFinal = map.get('W-2-0')!
  t.is(wbFinal.participantAId, 1, 'bye winner should be placed into the WB final')
})
