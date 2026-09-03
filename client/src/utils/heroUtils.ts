import { Class, Hero } from '@dl/api'

// Colour per Flesh and Blood class. Keyed by name so it survives any class-id
// ordering. Falls back to a neutral grey for unknown / future classes.
const CLASS_COLORS: Record<string, string> = {
  Assassin: '#6a1b9a',
  Bard: '#00897b',
  Brute: '#bf360c',
  Guardian: '#f9a825',
  Illusionist: '#5c6bc0',
  Mechanologist: '#546e7a',
  Ninja: '#c62828',
  Ranger: '#2e7d32',
  Runeblade: '#4527a0',
  Shapeshifter: '#795548',
  Warrior: '#1565c0',
  Wizard: '#0277bd',
}

export const NEUTRAL_COLOR = '#7c7c7c'

export function classColor(className?: string): string {
  return (className && CLASS_COLORS[className]) || NEUTRAL_COLOR
}

export function findHero(heroes: Hero[], heroId?: number): Hero | undefined {
  return heroId == null ? undefined : heroes.find((h) => h.id === heroId)
}

export function findClass(classes: Class[], classId?: number): Class | undefined {
  return classId == null ? undefined : classes.find((c) => c.id === classId)
}

export function heroName(heroes: Hero[], heroId?: number): string {
  return findHero(heroes, heroId)?.name ?? ''
}

export function classNameForHero(heroes: Hero[], classes: Class[], heroId?: number): string {
  const hero = findHero(heroes, heroId)
  return hero ? findClass(classes, hero.classId)?.name ?? '' : ''
}

export function colorForHero(heroes: Hero[], classes: Class[], heroId?: number): string {
  return classColor(classNameForHero(heroes, classes, heroId))
}
