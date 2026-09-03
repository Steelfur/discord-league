import { Response } from 'express'
import Joi from 'joi'

import * as db from '../gateways/storage'
import { ValidatedRequest } from '../middlewares/validator'
import { createPodsForParticipants } from '../pods'

export const schema = {
  body: Joi.object<{
    players?: number
    name?: string
    start?: boolean
    withResults?: boolean
  }>({
    players: Joi.number().integer().min(2).max(200).optional(),
    name: Joi.string().trim().optional(),
    start: Joi.boolean().optional(),
    withResults: Joi.boolean().optional(),
  }),
}

const TEST_PREFIX = 'test-'
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

/**
 * Admin-only. Spins up a throwaway tournament with fake players so the whole
 * flow (pods -> group -> cut -> bracket) can be exercised without real signups.
 */
export async function handler(req: ValidatedRequest<typeof schema>, res: Response): Promise<void> {
  const count = req.body.players ?? 18
  const start = req.body.start ?? true
  const withResults = req.body.withResults ?? true

  const activeHeroes = (await db.fetchHeroes()).filter((h) => h.active)
  if (activeHeroes.length === 0) {
    res.status(409).send('Add at least one active hero first (Admin -> Heroes).')
    return
  }

  const stamp = Date.now().toString(36)
  const tournament = await db.createTournament({
    name:
      req.body.name ?? `Test Tournament ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`,
    startDate: new Date(),
    statusId: 'upcoming',
    typeId: 'pod6',
    description: 'Auto-generated for testing. Safe to delete.',
  })

  for (let i = 0; i < count; i++) {
    const discordId = `${TEST_PREFIX}${stamp}-${i}`
    await db.upsertUser({
      discordId,
      discordName: `Test Player ${String(i + 1).padStart(2, '0')}`,
      discordDiscriminator: '0',
      discordAvatar: '',
      discordAccessToken: '',
      discordRefreshToken: '',
    })
    await db.insertParticipant({
      userId: discordId,
      tournamentId: tournament.id,
      heroId: pick(activeHeroes).id,
    })
  }

  if (start) {
    await db.updateTournament(tournament.id, { statusId: 'group' })
    const participants = await db.fetchParticipants(tournament.id)
    const deadline = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    await createPodsForParticipants(tournament.id, deadline, participants)

    if (withResults) {
      const pods = await db.fetchTournamentPods(tournament.id)
      const matches = await db.fetchMatchesForMultiplePods(pods.map((p) => p.id))
      for (const m of matches) {
        await db.updateMatch({
          id: m.id,
          winnerId: pick([m.playerAId, m.playerBId]),
          isDraw: false,
          noShow: false,
        })
      }
    }
  }

  res.status(201).send({ id: tournament.id, name: tournament.name })
}
