import { RankedParticipant } from '@dl/api'
import { Grid, Typography } from '@material-ui/core'
import { memo, useMemo } from 'react'
import ReactMinimalPieChart from 'react-minimal-pie-chart'

import { useHeroLookup } from '../hooks/useReferenceData'

interface Slice {
  title: string
  value: number
  color: string
}

const PieWithLegend = memo(({ heading, data }: { heading: string; data: Slice[] }) => {
  const sorted = [...data].sort((a, b) => b.value - a.value)
  return (
    <Grid item xs={12} md={6}>
      <Typography variant="h6" align="center">
        {heading}
      </Typography>
      {sorted.length > 0 ? (
        <>
          <ReactMinimalPieChart
            data={sorted}
            paddingAngle={0}
            radius={42}
            style={{ height: '260px' }}
            viewBoxSize={[300, 300]}
            label
            labelPosition={112}
            labelStyle={{ fontFamily: 'sans-serif', fontSize: '22px' }}
            startAngle={270}
            lengthAngle={360}
          />
          <div style={{ marginTop: 8 }}>
            {sorted.map((d) => (
              <Typography key={d.title}>
                <span
                  style={{
                    display: 'inline-block',
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: d.color,
                    marginRight: 6,
                  }}
                />
                {d.title}: <b>{d.value}</b>
              </Typography>
            ))}
          </div>
        </>
      ) : (
        <Typography align="center">No data yet.</Typography>
      )}
    </Grid>
  )
})

export const PlayersPieChart = memo((props: { participants: RankedParticipant[] }) => {
  const { className, heroName, classColor, heroColor } = useHeroLookup()

  const byClass = useMemo<Slice[]>(() => {
    const counts = new Map<string, number>()
    props.participants.forEach((p) => {
      const name = className(p.heroId) || 'Unknown'
      counts.set(name, (counts.get(name) ?? 0) + 1)
    })
    return Array.from(counts, ([title, value]) => ({ title, value, color: classColor(title) }))
  }, [props.participants, className, classColor])

  const byHero = useMemo<Slice[]>(() => {
    const counts = new Map<number, number>()
    props.participants.forEach((p) => {
      if (p.heroId != null) counts.set(p.heroId, (counts.get(p.heroId) ?? 0) + 1)
    })
    return Array.from(counts, ([heroId, value]) => ({
      title: heroName(heroId) || `#${heroId}`,
      value,
      color: heroColor(heroId),
    }))
  }, [props.participants, heroName, heroColor])

  return (
    <div>
      <Typography variant="h6" align="center" gutterBottom>
        Total participants: {props.participants.length}
      </Typography>
      <Grid container spacing={2}>
        <PieWithLegend heading="By Class" data={byClass} />
        <PieWithLegend heading="By Hero" data={byHero} />
      </Grid>
    </div>
  )
})
