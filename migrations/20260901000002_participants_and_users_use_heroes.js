/**
 * Point participant + user "clan" references at the new `heroes` table and
 * rename the columns accordingly.
 *
 *   participants.clanId        -> participants.heroId
 *   users.preferredClanId      -> users.preferredHeroId
 *   users.jigokuName           -> users.gemId   (Flesh and Blood GEM player ID)
 */

exports.up = async function (knex) {
  // --- participants.clanId -> heroId ---
  await knex.schema.alterTable('participants', function (table) {
    table.dropForeign('clanId')
  })
  await knex.schema.alterTable('participants', function (table) {
    table.renameColumn('clanId', 'heroId')
  })
  await knex.schema.alterTable('participants', function (table) {
    table.foreign('heroId').references('heroes.id')
  })

  // --- users.preferredClanId -> preferredHeroId, users.jigokuName -> gemId ---
  await knex.schema.alterTable('users', function (table) {
    table.dropForeign('preferredClanId')
  })
  await knex.schema.alterTable('users', function (table) {
    table.renameColumn('preferredClanId', 'preferredHeroId')
    table.renameColumn('jigokuName', 'gemId')
  })
  await knex.schema.alterTable('users', function (table) {
    table.foreign('preferredHeroId').references('heroes.id')
  })
}

exports.down = async function (knex) {
  await knex.schema.alterTable('users', function (table) {
    table.dropForeign('preferredHeroId')
  })
  await knex.schema.alterTable('users', function (table) {
    table.renameColumn('preferredHeroId', 'preferredClanId')
    table.renameColumn('gemId', 'jigokuName')
  })

  await knex.schema.alterTable('participants', function (table) {
    table.dropForeign('heroId')
  })
  await knex.schema.alterTable('participants', function (table) {
    table.renameColumn('heroId', 'clanId')
  })
}
