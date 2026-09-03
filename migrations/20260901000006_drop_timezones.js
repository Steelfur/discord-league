/**
 * Timezones are gone: pods are now formed by a plain random shuffle, and
 * players no longer pick a timezone or timezone preference at signup.
 */

exports.up = async function (knex) {
  // Raw + IF EXISTS so a partial earlier run can't wedge the migration.
  await knex.raw(`
    ALTER TABLE "participants" DROP COLUMN IF EXISTS "timezoneId";
    ALTER TABLE "participants" DROP COLUMN IF EXISTS "timezonePreferenceId";
    ALTER TABLE "pods" DROP COLUMN IF EXISTS "timezoneId";
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
