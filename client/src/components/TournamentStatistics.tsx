import { RankedParticipant } from '@dl/api'
import { Typography } from '@material-ui/core'
import { PlayersPieChart } from './PlayersPieChart'
import { useTournamentStatistics } from '../hooks/useTournamentStatistics'
import { Loading } from './Loading'
import { RequestError } from './RequestError'
import { EmptyState } from './EmptyState'
import { ClassBadge } from './HeroTag'

function Row(props: { classId: number; power: number }) {
  return (
    <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
      <ClassBadge classId={props.classId} />
      <Typography variant="h6">{`${props.power}% share of tournament-winning power`}</Typography>
    </div>
  )
}

export function TournamentStatistics(props: {
  tournamentId: number
  participants: RankedParticipant[]
}) {
  const [data] = useTournamentStatistics(props.tournamentId)
  if (data.loading) {
    return <Loading />
  }
  if (data.error) {
    return <RequestError requestError={data.error} />
  }
  if (data.data == null) {
    return <EmptyState />
  }
  return (
    <>
      <Typography variant="h4" align="center">
        Tournament Statistics
      </Typography>

      <div style={{ margin: '10px 15px 0' }}>
        <Typography variant="h5" align="center">
          Class Power Ranking
        </Typography>
        <Typography>
          This ranking weighs every class matchup and how those matchups balance against the field.
          A spread of solid matchups beats a few lopsided ones, and a class ranks higher when it
          beats other strong classes. It is a Markov-stable estimate of each class&apos;s share of
          the tournament-winning power based on the games played so far.
        </Typography>
        <br />
        {data.data.ranking.map(([classId, power]) => (
          <Row key={classId} classId={classId} power={power} />
        ))}
      </div>

      <div>
        <Typography variant="h5" align="center">
          Signups
        </Typography>
        <PlayersPieChart participants={props.participants} />
      </div>
    </>
  )
}
