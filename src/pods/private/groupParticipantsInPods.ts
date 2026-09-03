import Chance from 'chance'

import { Player, Pod } from './types'

const chance = new Chance()

/**
 * Split participants into pods of roughly `targetSize`, completely at random.
 * Pod sizes differ by at most one.
 */
export function groupParticipantsInPods(targetSize: number, participants: Player[]): Pod[] {
  const shuffled = chance.shuffle(participants.slice())
  const total = shuffled.length
  if (total === 0) return []

  const podCount = Math.max(1, Math.round(total / targetSize))
  const base = Math.floor(total / podCount)
  const remainder = total % podCount

  const pods: Pod[] = []
  let cursor = 0
  for (let i = 0; i < podCount; i++) {
    const podSize = base + (i < remainder ? 1 : 0)
    pods.push({ players: shuffled.slice(cursor, cursor + podSize) })
    cursor += podSize
  }
  return pods
}
