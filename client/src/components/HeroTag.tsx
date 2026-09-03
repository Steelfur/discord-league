import { CSSProperties, FC } from 'react'

import { useHeroLookup } from '../hooks/useReferenceData'
import { classColor, NEUTRAL_COLOR } from '../utils/heroUtils'

const sizeFor = (small?: boolean, large?: boolean) => (large ? 20 : small ? 12 : 16)

const dotStyle = (color: string, size: number): CSSProperties => ({
  display: 'inline-block',
  width: size,
  height: size,
  borderRadius: '50%',
  backgroundColor: color,
  flexShrink: 0,
  border: '1px solid rgba(0,0,0,0.25)',
  verticalAlign: 'middle',
})

/** A class-coloured dot. Standalone icon replacement for the old clan mon. */
export const ClassDot: FC<{ heroId?: number; classId?: number; small?: boolean; large?: boolean }> = (
  props
) => {
  const lookup = useHeroLookup()
  const size = sizeFor(props.small, props.large)
  const color =
    props.classId != null
      ? classColor(lookup.class(props.classId)?.name)
      : props.heroId != null
      ? lookup.heroColor(props.heroId)
      : NEUTRAL_COLOR
  return <span style={dotStyle(color, size)} />
}

/** Class-coloured dot followed by the hero's name. */
export const HeroTag: FC<{
  heroId?: number
  small?: boolean
  large?: boolean
  showClass?: boolean
}> = (props) => {
  const lookup = useHeroLookup()
  const name = lookup.heroName(props.heroId)
  const className = lookup.className(props.heroId)
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <ClassDot heroId={props.heroId} small={props.small} large={props.large} />
      <span>
        {name || 'No hero'}
        {props.showClass && className ? ` (${className})` : ''}
      </span>
    </span>
  )
}

/** Class-coloured chip with the class name. Used on the statistics page. */
export const ClassBadge: FC<{ classId?: number }> = (props) => {
  const lookup = useHeroLookup()
  const cls = lookup.class(props.classId)
  const color = classColor(cls?.name)
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '2px 10px',
        borderRadius: 12,
        backgroundColor: color,
        color: '#fff',
        fontWeight: 600,
      }}
    >
      {cls?.name ?? 'Unknown class'}
    </span>
  )
}
