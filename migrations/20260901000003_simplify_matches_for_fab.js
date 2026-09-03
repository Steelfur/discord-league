/**
 * Reduce match reporting to Flesh and Blood needs:
 *
 *   - drop L5R-only columns: victoryConditionId, deck{A,B}RoleId, deck{A,B}SplashId
 *   - deckAClanId / deckBClanId  -> playerAHeroId / playerBHeroId  (hero played that match)
 *   - add isDraw / noShow flags
 *
 * Result of a match is derived: winnerId set => that player won; isDraw => draw;
 * noShow => one or both players did not show (winnerId set alongside noShow means
 * the other player was a no-show).
 */

exports.up = async function (knex) {
  await knex.schema.alterTable('matches', function (table) {
    table.dropColumn('victoryConditionId')
    table.dropColumn('deckARoleId')
    table.dropColumn('deckASplashId')
    table.dropColumn('deckBRoleId')
    table.dropColumn('deckBSplashId')
  })

  await knex.schema.alterTable('matches', function (table) {
    table.dropForeign('deckAClanId')
    table.dropForeign('deckBClanId')
  })
  await knex.schema.alterTable('matches', function (table) {
    table.renameColumn('deckAClanId', 'playerAHeroId')
    table.renameColumn('deckBClanId', 'playerBHeroId')
  })
  await knex.schema.alterTable('matches', function (table) {
    table.foreign('playerAHeroId').references('heroes.id')
    table.foreign('playerBHeroId').references('heroes.id')
    table.boolean('isDraw').notNullable().defaultTo(false)
    table.boolean('noShow').notNullable().defaultTo(false)
  })
}

exports.down = async function (knex) {
  await knex.schema.alterTable('matches', function (table) {
    table.dropColumn('isDraw')
    table.dropColumn('noShow')
    table.dropForeign('playerAHeroId')
    table.dropForeign('playerBHeroId')
  })
  await knex.schema.alterTable('matches', function (table) {
    table.renameColumn('playerAHeroId', 'deckAClanId')
    table.renameColumn('playerBHeroId', 'deckBClanId')
  })
  await knex.schema.alterTable('matches', function (table) {
    table.integer('victoryConditionId')
    table.integer('deckARoleId')
    table.integer('deckASplashId')
    table.integer('deckBRoleId')
    table.integer('deckBSplashId')
  })
}
