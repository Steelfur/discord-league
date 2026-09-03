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

const classColumns = ['id', 'name', 'sortOrder', 'active']
const heroColumns = ['id', 'name', 'classId', 'active']

// --- classes ---------------------------------------------------------------

export async function fetchClasses(): Promise<ClassRecord[]> {
  return pg(CLASSES_TABLE).select(classColumns).orderBy('sortOrder')
}

export async function fetchClass(id: number): Promise<ClassRecord | undefined> {
  return pg(CLASSES_TABLE).select(classColumns).where('id', id).first()
}

export async function insertClass(
  cls: Pick<ClassRecord, 'name'> & Partial<Pick<ClassRecord, 'sortOrder' | 'active'>>
): Promise<ClassRecord> {
  const [{ max }] = await pg(CLASSES_TABLE).max('sortOrder as max')
  return pg(CLASSES_TABLE)
    .insert({ active: true, sortOrder: (max ?? 0) + 1, ...cls }, classColumns)
    .then(([row]) => row)
}

export async function updateClass(
  id: number,
  cls: Partial<Pick<ClassRecord, 'name' | 'sortOrder' | 'active'>>
): Promise<ClassRecord> {
  const result = await pg(CLASSES_TABLE).where('id', id).update(cls, classColumns)
  return result[0]
}

export async function deleteClass(id: number): Promise<void> {
  await pg(CLASSES_TABLE).where('id', id).del()
}

export async function classHeroCount(id: number): Promise<number> {
  const [{ count }] = await pg(HEROES_TABLE).where('classId', id).count('id as count')
  return Number(count)
}

// --- heroes --------------------------------------------------------------

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

export async function deleteHero(id: number): Promise<void> {
  await pg(HEROES_TABLE).where('id', id).del()
}
