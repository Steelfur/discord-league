/**
 * Remove the L5R-only lookup tables now that nothing references them.
 * `clans` is replaced by `heroes`; rings/roles/victory-conditions are gone.
 */

exports.up = async function (knex) {
  // CASCADE mops up any leftover FK constraints from the old snake_case era.
  await knex.raw(`
    DROP TABLE IF EXISTS "roles" CASCADE;
    DROP TABLE IF EXISTS "role_types" CASCADE;
    DROP TABLE IF EXISTS "elements" CASCADE;
    DROP TABLE IF EXISTS "victory_conditions" CASCADE;
    DROP TABLE IF EXISTS "clans" CASCADE;
  `)
}

exports.down = async function (knex) {
  // Recreate empty shells only — original L5R seed data is not restored.
  await knex.schema.createTable('clans', function (table) {
    table.increments('id').primary()
    table.string('name').notNullable()
  })
  await knex.schema.createTable('victory_conditions', function (table) {
    table.increments('id').primary()
    table.string('name').notNullable()
  })
  await knex.schema.createTable('elements', function (table) {
    table.increments('id').primary()
    table.string('name').notNullable()
  })
  await knex.schema.createTable('role_types', function (table) {
    table.increments('id').primary()
    table.string('name').notNullable()
  })
  await knex.schema.createTable('roles', function (table) {
    table.increments('id').primary()
    table.string('name').notNullable()
    table.integer('role_type_id').references('role_types.id')
    table.integer('element_id').references('elements.id')
  })
}
