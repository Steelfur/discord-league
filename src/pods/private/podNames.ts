import Chance from 'chance'
import { zipWith } from 'fp-ts/lib/Array'

import { Pod } from './types'

const chance = new Chance()

/**
 * Pod names drawn from the world of Rathe — regions, cities and creatures of
 * the Flesh and Blood universe. Edit freely.
 */
const podNames = [
  // places
  'Aria',
  'Volcor',
  'Metrix',
  'Misteria',
  'Solana',
  'Savage Lands',
  'Demonastery',
  'The Pits',
  'Northern Realms',
  'Sandkin',
  'Blistering Sands',
  'Cindering Hills',
  'Pale Fire Keep',
  'Halls of Judgement',
  'Ravenscroft',
  'Isle of Dracha',
  'Skagharren',
  'Rosetta',
  'The Needle',
  'Aell',
  "i'Arathael",
  'Silver Water',
  'Northern Cove',
  'Great Library',
  "Fyendal's Spring",
  'Vault of Earth',
  // creatures
  'Rok',
  'Cromai',
  'Salamander',
  'Wyvern',
  'Phoenix',
  'Manticore',
  'Sabertooth',
  'Direwolf',
  'Snapdragon',
  'Copperhide',
  'Ironhide',
  'Dune Racer',
  "Kaie'o",
  "Na'shari",
]

/**
 * Give a random name to each Pod in a list
 */
export const namePods = (pods: Pod[]): Array<Pod & { name: string }> =>
  zipWith(pods, chance.pickset(podNames, pods.length), (pod, name) => ({ ...pod, name }))
