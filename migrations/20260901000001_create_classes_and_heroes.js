/**
 * Flesh and Blood domain: classes + heroes.
 *
 * `classes` is a small, stable lookup (seeded here). `heroes` is admin-managed
 * from the app (Admin -> Heroes): admins add new heroes and toggle `active` as
 * heroes rotate in/out of the Classic Constructed pool (Living Legend, new sets).
 * Retiring a hero sets active = false; it is kept for historical match/participant data.
 */

const CLASSES = [
  'Assassin',
  'Bard',
  'Brute',
  'Guardian',
  'Illusionist',
  'Mechanologist',
  'Ninja',
  'Ranger',
  'Runeblade',
  'Shapeshifter',
  'Warrior',
  'Wizard',
]

// Starter roster of adult (non-Young) heroes. Not authoritative — admins curate
// the list in-app. `active: true` for every seeded hero; uncheck retired ones.
const HEROES = {
  Assassin: ['Arakni, Solitary Confinement', 'Nuu, Alluring Desire', 'Uzuri, Switchblade'],
  Bard: ['Enigma, Ledger of Ancestry', 'Aurora, Shooting Star'],
  Brute: ['Rhinar, Reckless Rampage', 'Kayo, Armed and Dangerous', 'Levia, Shadowborn Abomination'],
  Guardian: [
    'Bravo, Showstopper',
    'Oldhim, Grandfather of Eternity',
    'Valda, Winds of Deliverance',
  ],
  Illusionist: ['Prism, Sculptor of Arc Light', 'Dromai, Ash Artist'],
  Mechanologist: ['Dash, Inventor Extraordinaire', 'Dash I/O'],
  Ninja: [
    'Katsu, the Wanderer',
    'Benji, the Piercing Wind',
    'Zen, Tamer of Purpose',
    'Fai, Rising Rebellion',
    'Shiyana, Diamond in the Rough',
  ],
  Ranger: ['Azalea, Ace in the Hole', 'Lexi, Livewire', 'Riptide, Lurker of the Deep'],
  Runeblade: [
    'Viserai, Rune Blood',
    'Chane, Bound by Shadow',
    'Briar, Warden of Thorns',
    'Vynnset, Iron Tomb',
    'Cindra, Dracai of Retribution',
  ],
  Shapeshifter: [],
  Warrior: [
    'Dorinthea Ironsong',
    'Kassai, Cintari Sellsword',
    'Victor Goldmane, High and Mighty',
  ],
  Wizard: ['Kano, Dracai of Aether', 'Iyslander, Stormbind', 'Oscilio, Constellation of Wonder'],
}

exports.up = async function (knex) {
  await knex.schema.createTable('classes', function (table) {
    table.increments('id').primary()
    table.string('name').notNullable().unique()
    table.integer('sortOrder').notNullable().defaultTo(0)
    table.boolean('active').notNullable().defaultTo(true)
  })

  await knex.schema.createTable('heroes', function (table) {
    table.increments('id').primary()
    table.string('name').notNullable()
    table.integer('classId').notNullable().references('classes.id')
    table.boolean('active').notNullable().defaultTo(true)
    table.timestamps(true, true)
    table.index('classId')
    table.unique(['name', 'classId'])
  })

  const insertedClasses = await knex('classes')
    .insert(CLASSES.map((name, idx) => ({ name, sortOrder: idx })))
    .returning(['id', 'name'])

  const classIdByName = new Map(insertedClasses.map((c) => [c.name, c.id]))

  const heroRows = []
  for (const [className, heroNames] of Object.entries(HEROES)) {
    const classId = classIdByName.get(className)
    for (const name of heroNames) {
      heroRows.push({ name, classId, active: true })
    }
  }
  if (heroRows.length > 0) {
    await knex('heroes').insert(heroRows)
  }
}

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('heroes')
  await knex.schema.dropTableIfExists('classes')
}
