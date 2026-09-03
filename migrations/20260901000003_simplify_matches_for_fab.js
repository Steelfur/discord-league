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
 *
 * NOTE: the deck*ClanId foreign keys on `matches` were created before an old
 * migration camelCased the columns, so their constraint names still use the
 * original snake_case ("matches_deck_a_clan_id_foreign"). Drop them by name
 * with IF EXISTS rather than knex's dropForeign(), which guesses the wrong name.
 */

exports.up = async function (knex) {
  await knex.schema.alterTable('matches', function (table) {
    table.dropColumn('victoryConditionId')
    table.dropColumn('deckARoleId')
    table.dropColumn('deckASplashId')
    table.dropColumn('deckBRoleId')
    table.dropColumn('deckBSplashId')
  })

  await knex.raw(`
    ALTER TABLE "matches" DROP CONSTRAINT IF EXISTS "matches_deck_a_clan_id_foreign";
    ALTER TABLE "matches" DROP CONSTRAINT IF EXISTS "matches_deck_b_clan_id_foreign";
    ALTER TABLE "matches" DROP CONSTRAINT IF EXISTS "matches_deckaclanid_foreign";
    ALTER TABLE "matches" DROP CONSTRAINT IF EXISTS "matches_deckbclanid_foreign";
  `)

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
  await knex.raw(`
    ALTER TABLE "matches" DROP CONSTRAINT IF EXISTS "matches_playeraheroid_foreign";
    ALTER TABLE "matches" DROP CONSTRAINT IF EXISTS "matches_playerbheroid_foreign";
  `)
  await knex.schema.alterTable('matches', function (table) {
    table.dropColumn('isDraw')
    table.dropColumn('noShow')
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
