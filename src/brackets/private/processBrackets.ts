import * as db from '../../gateways/storage'
import { generateBracket } from './generateBracket'

interface StandingParticipant {
  id: number
  wins: number
  losses: number
  dropped: boolean
}

interface PodLike {
  participants: StandingParticipant[]
}

/**
 * Seed and persist the double-elimination bracket for a tournament.
 *
 * Cut = everyone who finished the group stage with a winning record. Seeding:
 * wins, then strength of schedule (average win rate of your pod opponents),
 * then fewest losses.
 */
export async function processBrackets(tournamentId: number, pods: PodLike[]): Promise<void> {
  const seeded: Array<{ id: number; wins: number; losses: number; sos: number }> = []

  for (const pod of pods) {
    const active = pod.participants.filter((p) => !p.dropped)
    for (const p of active) {
      const opponents = active.filter((o) => o.id !== p.id)
      const rates = opponents.map((o) => (o.wins + o.losses > 0 ? o.wins / (o.wins + o.losses) : 0))
      const sos = rates.length ? rates.reduce((a, b) => a + b, 0) / rates.length : 0
      seeded.push({ id: p.id, wins: p.wins, losses: p.losses, sos })
    }
  }

  const cut = seeded
    .filter((p) => p.wins > p.losses)
    .sort((a, b) => b.wins - a.wins || b.sos - a.sos || a.losses - b.losses)

  const local = generateBracket(cut.map((p) => p.id))
  await db.createBracketMatches(tournamentId, local)
}
