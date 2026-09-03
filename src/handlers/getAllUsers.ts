import { User$findAll } from '@dl/api'
import { Request, Response } from 'express'

import * as db from '../gateways/storage'

const NOT_SPECIFIED = 'Not specified'

function displayAvatarURL(userId: string, userAvatar: string) {
  return `https://cdn.discordapp.com/avatars/${userId}/${userAvatar}.webp`
}

function permissionsToRole(permissions: number): 'Player' | 'Admin' {
  return permissions === 1 ? 'Admin' : 'Player'
}

export async function handler(
  req: Request,
  res: Response<User$findAll['response']>
): Promise<void> {
  const [users, heroes] = await Promise.all([db.getAllUsers(), db.fetchHeroes()])
  const heroNameById = new Map(heroes.map((h) => [h.id, h.name]))

  const preparedUsers = users.map((user) => ({
    discordName:
      user.discordDiscriminator && user.discordDiscriminator !== '0'
        ? `${user.discordName}#${user.discordDiscriminator}`
        : user.discordName,
    displayAvatarURL: displayAvatarURL(user.discordId, user.discordAvatar),
    gemId: user.gemId ?? NOT_SPECIFIED,
    preferredHero:
      user.preferredHeroId != null
        ? heroNameById.get(user.preferredHeroId) ?? NOT_SPECIFIED
        : NOT_SPECIFIED,
    preferredHeroId: user.preferredHeroId,
    role: permissionsToRole(user.permissions),
    userId: user.discordId,
  }))

  res.status(200).send(preparedUsers)
}
