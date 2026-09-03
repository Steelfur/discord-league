import { User } from '@dl/api'
import {
  Container,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  createStyles,
  Link,
  makeStyles,
  Theme,
} from '@material-ui/core'
import Typography from '@material-ui/core/Typography'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import { Link as RouterLink } from 'react-router-dom'

import { useMatchesForUser } from '../../hooks/useMatchesForUser'
import { Loading } from '../../components/Loading'
import { RequestError } from '../../components/RequestError'
import { EmptyState } from '../../components/EmptyState'
import { TournamentMatchView } from '../../components/TournamentMatchView'

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    expansionBody: {
      backgroundColor: theme.palette.grey[300],
      padding: theme.spacing(2),
    },
  })
)

export function MyMatches(props: { user: User }): JSX.Element {
  const classes = useStyles()
  const [matches, refetchMatches] = useMatchesForUser(props.user.discordId)

  if (matches.loading) {
    return <Loading />
  }

  if (matches.error) {
    return <RequestError requestError={matches.error} />
  }

  if (!matches.data) {
    return <EmptyState />
  }

  return (
    <Container>
      {matches.data.map(
        ({ tournament, matchesDone, matchesToPlay, bracketMatchesToPlay }) => (
          <Accordion key={tournament.id} defaultExpanded>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="unfinished-games-content"
              id="unfinished-games-header"
            >
              <Typography>
                {tournament.name}
                {tournament.statusId === 'bracket'
                  ? ` — bracket stage (${bracketMatchesToPlay} to report)`
                  : ` (${matchesToPlay.length} unfinished)`}
              </Typography>
            </AccordionSummary>
            <AccordionDetails className={classes.expansionBody}>
              {tournament.statusId === 'bracket' ? (
                <Typography>
                  {bracketMatchesToPlay > 0
                    ? `You have ${bracketMatchesToPlay} bracket match(es) waiting. `
                    : 'No bracket matches waiting on you right now. '}
                  <Link component={RouterLink} to={`/tournament/${tournament.id}`}>
                    Open the bracket
                  </Link>
                </Typography>
              ) : (
                <TournamentMatchView
                  matchesDone={matchesDone}
                  matchesToPlay={matchesToPlay}
                  onUpdate={refetchMatches}
                />
              )}
            </AccordionDetails>
          </Accordion>
        )
      )}
    </Container>
  )
}
