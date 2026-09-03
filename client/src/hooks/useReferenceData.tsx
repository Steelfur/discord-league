import { Class, Hero } from '@dl/api'
import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react'

import { api } from '../api'
import {
  classColor,
  classNameForHero,
  colorForHero,
  findClass,
  findHero,
  heroName,
} from '../utils/heroUtils'

interface ReferenceData {
  heroes: Hero[]
  classes: Class[]
  loading: boolean
  reload: () => void
}

const ReferenceDataContext = createContext<ReferenceData>({
  heroes: [],
  classes: [],
  loading: false,
  reload: () => undefined,
})

export function ReferenceDataProvider(props: { children: ReactNode }) {
  const [heroes, setHeroes] = useState<Hero[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([api.Class.findAll(), api.Hero.findAll()])
      .then(([classesRes, heroesRes]) => {
        if (cancelled) return
        setClasses(classesRes.data<Class[]>())
        setHeroes(heroesRes.data<Hero[]>())
      })
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [nonce])

  const value = useMemo<ReferenceData>(
    () => ({ heroes, classes, loading, reload: () => setNonce((n) => n + 1) }),
    [heroes, classes, loading]
  )

  return (
    <ReferenceDataContext.Provider value={value}>{props.children}</ReferenceDataContext.Provider>
  )
}

export function useReferenceData(): ReferenceData {
  return useContext(ReferenceDataContext)
}

/** Convenience helpers bound to the current reference data. */
export function useHeroLookup() {
  const { heroes, classes } = useReferenceData()
  return useMemo(
    () => ({
      heroes,
      classes,
      activeHeroes: heroes.filter((h) => h.active),
      hero: (id?: number) => findHero(heroes, id),
      class: (id?: number) => findClass(classes, id),
      heroName: (id?: number) => heroName(heroes, id),
      className: (id?: number) => classNameForHero(heroes, classes, id),
      classColor: (name?: string) => classColor(name),
      heroColor: (id?: number) => colorForHero(heroes, classes, id),
    }),
    [heroes, classes]
  )
}
