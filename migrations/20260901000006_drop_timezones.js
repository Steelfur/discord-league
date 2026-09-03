/**
 * Timezones are gone: pods are now formed by a plain random shuffle, and
 * players no longer pick a timezone or timezone preference at signup.
 */

exports.up = async function (knex) {
  await knex.schema.alterTable('participants', function (table) {
    table.dropColumn('timezoneId')
    table.dropColumn('timezonePreferenceId')
  })
  await knex.schema.alterTable('pods', function (table) {
    table.dropColumn('timezoneId')
  })
  await knex.raw(`
    DROP TABLE IF EXISTS "timezone_preferences" CASCADE;
    DROP TABLE IF EXISTS "timezones" CASCADE;
  `)
}

exports.down = async function (knex) {
  await knex.schema.createTable('timezones', function (table) {
    table.increments('id').primary()
    table.string('name')
  })
  await knex.schema.createTable('timezone_preferences', function (table) {
    table.string('id').primary()
    table.string('name').notNullable()
  })
  await knex.schema.alterTable('participants', function (table) {
    table.integer('timezoneId')
    table.string('timezonePreferenceId')
  })
  await knex.schema.alterTable('pods', function (table) {
    table.integer('timezoneId')
  })
}
