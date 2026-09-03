import { User$findCurrent } from '@dl/api'
import { Request, Response } from 'express'

import * as discordClient from '../clients/discord'
import * as db from '../gateways/storage'

export async function handler(
  req: Request,
  res: Response<User$findCurrent['response']>
): Promise<void> {
  if (!req.user?.d_id) {
    res.sendStatus(400)
    return
  }

  const userRow = await db.getUser(req.user.d_id)
  if (!userRow) {
    res.sendStatus(404)
    return
  }

  const discordUser = await discordClient.fetchUser(userRow.discordId)
  const user = {
    gemId: userRow.gemId,
    permissions: userRow.permissions,
    preferredHeroId: userRow.preferredHeroId,
    discordId: discordUser.id,
    tag: discordUser.tag,
    displayAvatarURL: discordUser.displayAvatarURL(),
  }

  res.status(200).send(user)
}
