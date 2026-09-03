import { pg } from './pg'

export const CLASSES_TABLE = 'classes'
export const HEROES_TABLE = 'heroes'

export interface ClassRecord {
  id: number
  name: string
  sortOrder: number
  active: boolean
}

export interface HeroRecord {
  id: number
  name: string
  classId: number
  active: boolean
}

const heroColumns = ['id', 'name', 'classId', 'active']

export async function fetchClasses(): Promise<ClassRecord[]> {
  return pg(CLASSES_TABLE).select('id', 'name', 'sortOrder', 'active').orderBy('sortOrder')
}

export async function fetchHeroes(): Promise<HeroRecord[]> {
  return pg(HEROES_TABLE).select(heroColumns).orderBy('name')
}

export async function fetchHero(id: number): Promise<HeroRecord | undefined> {
  return pg(HEROES_TABLE).select(heroColumns).where('id', id).first()
}

export async function insertHero(
  hero: Pick<HeroRecord, 'name' | 'classId'> & Partial<Pick<HeroRecord, 'active'>>
): Promise<HeroRecord> {
  return pg(HEROES_TABLE)
    .insert({ active: true, ...hero }, heroColumns)
    .then(([row]) => row)
}

export async function updateHero(
  id: number,
  hero: Partial<Pick<HeroRecord, 'name' | 'classId' | 'active'>>
): Promise<HeroRecord> {
  const result = await pg(HEROES_TABLE)
    .where('id', id)
    .update({ ...hero, updated_at: new Date() }, heroColumns)
  return result[0]
}
