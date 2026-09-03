import { useMemo, useState, useEffect } from 'react'
import { FormControl, InputLabel, MenuItem, Select } from '@material-ui/core'

import { useHeroLookup } from '../hooks/useReferenceData'
import { ClassDot } from './HeroTag'

/**
 * Two-step hero picker: choose a class, then a hero within that class.
 * Only active heroes are offered.
 */
export function HeroSelect(props: {
  heroId?: number
  allowNone?: boolean
  label: string
  onChange: (heroId?: number) => void
}) {
  const { classes, activeHeroes, hero } = useHeroLookup()

  const selectedHero = hero(props.heroId)
  const [classId, setClassId] = useState<number | undefined>(selectedHero?.classId)

  useEffect(() => {
    if (selectedHero) {
      setClassId(selectedHero.classId)
    }
  }, [selectedHero])

  const classesWithHeroes = useMemo(
    () => classes.filter((c) => activeHeroes.some((h) => h.classId === c.id)),
    [classes, activeHeroes]
  )
  const heroesForClass = useMemo(
    () => activeHeroes.filter((h) => h.classId === classId).sort((a, b) => a.name.localeCompare(b.name)),
    [activeHeroes, classId]
  )

  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <FormControl style={{ minWidth: 140 }}>
        <InputLabel id={`${props.label}-class`}>Class</InputLabel>
        <Select
          labelId={`${props.label}-class`}
          value={classId ?? ''}
          onChange={({ target: { value } }) => {
            setClassId(typeof value === 'number' ? value : undefined)
            props.onChange(undefined)
          }}
        >
          {props.allowNone && (
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
          )}
          {classesWithHeroes.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              <ClassDot classId={c.id} small /> &nbsp;{c.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl style={{ minWidth: 200 }} disabled={classId == null}>
        <InputLabel id={`${props.label}-hero`}>{props.label}</InputLabel>
        <Select
          labelId={`${props.label}-hero`}
          value={props.heroId ?? ''}
          onChange={({ target: { value } }) =>
            props.onChange(typeof value === 'number' ? value : undefined)
          }
        >
          {props.allowNone && (
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
          )}
          {heroesForClass.map((h) => (
            <MenuItem key={h.id} value={h.id}>
              {h.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </div>
  )
}
