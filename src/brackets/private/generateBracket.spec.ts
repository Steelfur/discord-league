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

test('generateBracket(3): the bye match is pruned and seed 1 starts in the WB final', (t) => {
  const map = byKey(generateBracket(ids(3)))
  t.false(map.has('W-1-0'), 'seed 1 vs bye is removed, not left as a stub')
  const wbFinal = map.get('W-2-0')!
  t.is(wbFinal.participantAId, 1, 'seed 1 is placed straight into the WB final')
})

// Play a whole bracket through (higher seed always wins) and check the double
// elimination structure holds: everyone can lose once, one champion emerges.
for (const n of [2, 3, 4, 5, 6, 8, 12, 16]) {
  test(`generateBracket(${n}): full playthrough crowns exactly one champion`, (t) => {
    const map = byKey(generateBracket(ids(n)))
    const A = (m: LocalMatch) => m.participantAId
    const B = (m: LocalMatch) => m.participantBId
    const losses = new Map<number, number>()

    let guard = 0
    let progressed = true
    while (progressed && guard++ < 500) {
      progressed = false
      for (const m of map.values()) {
        if (m.winnerId != null || A(m) == null || B(m) == null) continue
        const winner = Math.min(A(m) as number, B(m) as number) // higher seed = lower id
        const loser = winner === A(m) ? (B(m) as number) : (A(m) as number)
        m.winnerId = winner
        losses.set(loser, (losses.get(loser) ?? 0) + 1)
        if (m.winnerToKey) {
          const d = map.get(m.winnerToKey)!
          if (m.winnerToSlot === 'A') d.participantAId = winner
          else d.participantBId = winner
        }
        if (m.loserToKey) {
          const d = map.get(m.loserToKey)!
          if (m.loserToSlot === 'A') d.participantAId = loser
          else d.participantBId = loser
        }
        progressed = true
      }
    }

    const gf = [...map.values()].find((m) => m.side === 'grandFinal')!
    t.not(gf.winnerId, null, 'grand final has a winner')
    t.is(gf.winnerId, 1, 'top seed wins when higher seed always wins')
    // nobody is eliminated with fewer than 2 losses except the champion (0)
    for (const id of ids(n)) {
      if (id === gf.winnerId) {
        t.true((losses.get(id) ?? 0) <= 1, `champion ${id} lost at most once`)
      } else {
        t.is(losses.get(id) ?? 0, 2, `player ${id} was eliminated after exactly 2 losses`)
      }
    }
  })
}
