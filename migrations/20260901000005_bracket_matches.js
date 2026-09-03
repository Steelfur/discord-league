/**
 * In-app double-elimination bracket, replacing the old Challonge integration.
 *
 * One row per bracket slot across the winners half, losers half and the grand
 * final. `winnerToId` / `loserToId` (self-references) say where each player goes
 * next, so advancing a result is just "drop winner here, drop loser there".
 * Round 1 of the winners half is seeded from the group-stage standings when the
 * bracket phase starts; every other slot is filled as results come in.
 */

exports.up = async function (knex) {
  await knex.schema.dropTableIfExists('brackets')

  await knex.schema.createTable('bracket_matches', function (table) {
    table.increments('id').primary()
    table
      .integer('tournamentId')
      .notNullable()
      .references('tournaments.id')
      .onDelete('CASCADE')
      .index()
    // 'winners' | 'losers' | 'grandFinal'
    table.string('side').notNullable()
    table.integer('round').notNullable()
    // 0-based position of the match within its round
    table.integer('slot').notNullable()
    table.integer('participantAId').references('participants.id').onDelete('SET NULL')
    table.integer('participantBId').references('participants.id').onDelete('SET NULL')
    table.integer('winnerId').references('participants.id').onDelete('SET NULL')
    // original seed numbers (for display + bye handling)
    table.integer('seedA')
    table.integer('seedB')
    // routing: where the winner / loser of this match goes next
    table.integer('winnerToId').references('bracket_matches.id').onDelete('SET NULL')
    table.string('winnerToSlot') // 'A' | 'B'
    table.integer('loserToId').references('bracket_matches.id').onDelete('SET NULL')
    table.string('loserToSlot') // 'A' | 'B'
    table.timestamps(true, true)
    table.unique(['tournamentId', 'side', 'round', 'slot'])
  })
}

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('bracket_matches')
  await knex.schema.createTable('brackets', function (table) {
    table.increments('id').primary()
    table.integer('tournamentId').notNullable().index()
    table.foreign('tournamentId').references('tournaments.id')
    table.string('bracket').notNullable()
    table.string('challongeTournamentId').notNullable()
    table.string('url').notNullable()
  })
}
