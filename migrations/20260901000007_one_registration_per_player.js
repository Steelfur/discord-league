/**
 * A player may register for a tournament only once. Removes any existing
 * duplicate participant rows (keeping the earliest), then enforces it with a
 * unique constraint on (userId, tournamentId).
 */

exports.up = async function (knex) {
  await knex.raw(`
    CREATE TEMP TABLE dupe_participants AS
      SELECT p.id
      FROM participants p
      WHERE p.id > (
        SELECT MIN(p2.id) FROM participants p2
        WHERE p2."userId" = p."userId" AND p2."tournamentId" = p."tournamentId"
      );

    CREATE TEMP TABLE dupe_matches AS
      SELECT DISTINCT m.id FROM matches m
      WHERE m."playerAId" IN (SELECT id FROM dupe_participants)
         OR m."playerBId" IN (SELECT id FROM dupe_participants);

    DELETE FROM pods_matches WHERE "matchId" IN (SELECT id FROM dupe_matches);
    DELETE FROM matches WHERE id IN (SELECT id FROM dupe_matches);
    DELETE FROM decklists WHERE "participantId" IN (SELECT id FROM dupe_participants);
    DELETE FROM feedbacks WHERE "participantId" IN (SELECT id FROM dupe_participants);
    UPDATE bracket_matches SET "participantAId" = NULL
      WHERE "participantAId" IN (SELECT id FROM dupe_participants);
    UPDATE bracket_matches SET "participantBId" = NULL
      WHERE "participantBId" IN (SELECT id FROM dupe_participants);
    UPDATE bracket_matches SET "winnerId" = NULL
      WHERE "winnerId" IN (SELECT id FROM dupe_participants);
    DELETE FROM participants WHERE id IN (SELECT id FROM dupe_participants);

    DROP TABLE dupe_participants;
    DROP TABLE dupe_matches;

    ALTER TABLE participants
      ADD CONSTRAINT participants_user_tournament_unique UNIQUE ("userId", "tournamentId");
  `)
}

exports.down = async function (knex) {
  await knex.raw(`
    ALTER TABLE participants DROP CONSTRAINT IF EXISTS participants_user_tournament_unique;
  `)
}
