import { RankedParticipant } from '@dl/api'
import { Grid, Typography } from '@material-ui/core'
import { memo, useMemo } from 'react'
import ReactMinimalPieChart from 'react-minimal-pie-chart'

import { useHeroLookup } from '../hooks/useReferenceData'
import { classColor } from '../utils/heroUtils'
import { timezones } from '../utils/timezoneUtils'

export const PlayersPieChart = memo((props: { participants: RankedParticipant[] }) => {
  const { classes, className } = useHeroLookup()

  const pieChartData = useMemo(() => {
    const counts = new Map<string, number>()
    props.participants.forEach((p) => {
      const name = className(p.heroId) || 'Unknown'
      counts.set(name, (counts.get(name) ?? 0) + 1)
    })
    return Array.from(counts.entries())
      .map(([title, value]) => ({ title, value, color: classColor(title) }))
      .filter((d) => d.value > 0)
  }, [props.participants, classes, className])

  const timezoneData = timezones.map((timezone) => ({
    title: timezone.timezone,
    value: props.participants.filter((participant) => participant.timezoneId === timezone.id)
      .length,
  }))

  return (
    <Grid container>
      <Grid item xs={12} md={6}>
        {pieChartData.length > 0 && (
          <ReactMinimalPieChart
            data={[...pieChartData].sort((a, b) => b.value - a.value)}
            paddingAngle={0}
            radius={42}
            style={{ height: '300px' }}
            viewBoxSize={[300, 300]}
            label
            labelPosition={112}
            labelStyle={{ fontFamily: 'sans-serif', fontSize: '24px' }}
            startAngle={270}
            lengthAngle={360}
          />
        )}
      </Grid>
      <Grid item xs={12} md={6}>
        <Typography variant="h6">
          Total number of participants: {props.participants.length}
        </Typography>
        <Grid container>
          <Grid item xs={12} sm={6}>
            <Typography>By Class:</Typography>
            {pieChartData.map((data) => (
              <Typography key={data.title}>
                {data.title}: <b>{data.value}</b>
              </Typography>
            ))}
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography>By Timezone:</Typography>
            {timezoneData.map((data) => (
              <Typography key={data.title}>
                {data.title}: <b>{data.value}</b>
              </Typography>
            ))}
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  )
})
