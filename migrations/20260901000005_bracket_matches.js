/**
 * In-app double-elimination bracket, replacing the old Challonge integration.
 *
 * One row per bracket slot across the winners half, losers half and the grand
 * final. `winnerToId` / `loserToId` point at the next slot (plain ints, not
 * FKs — the app always wipes + rebuilds a tournament's whole bracket at once).
 */

exports.up = async function (knex) {
  await knex.schema.dropTableIfExists('brackets')

  await knex.schema.createTable('bracket_matches', function (table) {
    table.increments('id').primary()
    table.integer('tournamentId').notNullable().index()
    // 'winners' | 'losers' | 'grandFinal'
    table.string('side').notNullable()
    table.integer('round').notNullable()
    // 0-based position of the match within its round
    table.integer('slot').notNullable()
    table.integer('participantAId')
    table.integer('participantBId')
    table.integer('winnerId')
    // original seed numbers (for display + bye handling)
    table.integer('seedA')
    table.integer('seedB')
    // routing: where the winner / loser of this match goes next
    table.integer('winnerToId')
    table.string('winnerToSlot') // 'A' | 'B'
    table.integer('loserToId')
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
