import { Tournament, RankedParticipant, UserRowData } from '@dl/api'
import { Typography, Button, makeStyles, Theme, createStyles, Box } from '@material-ui/core'
import { useCallback, useReducer, useContext, useMemo, useState } from 'react'

import { UserContext } from '../App'
import { api } from '../api'
import { isAdmin } from '../hooks/useUsers'
import { EditParticipationModal } from '../modals/EditParticipationModal'
import { MessageSnackBar } from './MessageSnackBar'
import { ParticipationTable } from './ParticipationTable'
import { PlayersPieChart } from './PlayersPieChart'

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    button: {
      position: 'absolute',
      bottom: theme.spacing(2),
      right: theme.spacing(2),
    },
    container: {
      position: 'relative',
      minHeight: theme.spacing(8),
    },
    root: {
      paddingBottom: theme.spacing(5),
    },
    pieChartContainer: {
      marginTop: theme.spacing(3),
    },
  })
)

interface State {
  snackBarOpen: boolean
  requestError: boolean
  snackBarMessage: string
  modalOpen: boolean
}

const initialState: State = {
  snackBarOpen: false,
  requestError: false,
  snackBarMessage: '',
  modalOpen: false,
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function reducer(state: State, action: any) {
  switch (action.type) {
    case 'CLOSE_SNACKBAR':
      return { ...state, snackBarOpen: false }
    case 'OPEN_MODAL':
      return { ...state, modalOpen: true }
    case 'CLOSE_MODAL':
      return { ...state, modalOpen: false }
    case 'SUCCESS':
      return {
        ...state,
        requestError: false,
        snackBarMessage: action.payload,
        snackBarOpen: true,
        modalOpen: false,
      }
    case 'FAILURE':
      return {
        ...state,
        snackBarMessage: action.payload,
        requestError: true,
        snackBarOpen: true,
      }
    default:
      throw new Error(action.type)
  }
}

const useCreateParticipant = (
  tournamentId: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dispatch: any,
  onUpdate: () => void
) => {
  const [submitting, setSubmitting] = useState(false)
  const createParticipant = useCallback(
    (userId: string, heroId: number) => {
      if (submitting) return
      setSubmitting(true)
      api.Tournament.createParticipant({ tournamentId, body: { userId, heroId } })
        .then(() => {
          dispatch({
            type: 'SUCCESS',
            payload: "You've successfully registered for the tournament.",
          })
          onUpdate()
        })
        .catch((error: unknown) => {
          const detail =
            error && typeof (error as { data?: () => unknown }).data === 'function'
              ? String((error as { data: () => unknown }).data())
              : ''
          dispatch({
            type: 'FAILURE',
            payload: detail || 'An error occurred during tournament registration.',
          })
        })
        .finally(() => setSubmitting(false))
    },
    [dispatch, onUpdate, tournamentId, submitting]
  )
  return createParticipant
}

export function TournamentParticipationPanel({
  tournament,
  participants,
  onUpdate,
  users,
}: {
  tournament: Tournament
  participants: RankedParticipant[]
  users: UserRowData[]
  onUpdate: () => void
}) {
  const classes = useStyles()
  const [state, dispatch] = useReducer(reducer, initialState)
  const user = useContext(UserContext)
  const createParticipant = useCreateParticipant(tournament.id, dispatch, onUpdate)
  // Guard against any stale duplicate rows: one entry per Discord user.
  const uniqueParticipants = useMemo(() => {
    const seen = new Set<string>()
    return participants.filter((p) => (seen.has(p.userId) ? false : seen.add(p.userId)))
  }, [participants])
  const currentUserParticipation = useMemo(
    () => uniqueParticipants.find((participant) => participant.userId === user?.discordId),
    [uniqueParticipants, user]
  )
  // current user's row first, then everyone else
  const orderedParticipants = useMemo(() => {
    const rest = uniqueParticipants.filter((p) => p.userId !== currentUserParticipation?.userId)
    return currentUserParticipation ? [currentUserParticipation, ...rest] : rest
  }, [uniqueParticipants, currentUserParticipation])

  return (
    <div className={classes.root}>
      <Typography variant="h6" align="center">
        Players
      </Typography>
      <Box>
        {orderedParticipants.length > 0 && (
          <ParticipationTable
            data={orderedParticipants}
            title="Players"
            tournamentId={tournament.id}
            onUpdate={onUpdate}
            users={users}
            isEditable={!!user && isAdmin(user)}
            selfEditableUserId={
              tournament.statusId === 'upcoming' ? user?.discordId : undefined
            }
          />
        )}
      </Box>

      {tournament.statusId === 'upcoming' && user && (!currentUserParticipation || isAdmin(user)) && (
        <Box className={classes.container}>
          <Button
            variant="contained"
            color="secondary"
            className={classes.button}
            onClick={() => dispatch({ type: 'OPEN_MODAL' })}
          >
            Register
          </Button>
        </Box>
      )}

      <div className={classes.pieChartContainer}>
        <PlayersPieChart participants={uniqueParticipants} />
      </div>

      <EditParticipationModal
        modalOpen={state.modalOpen}
        onClose={() => dispatch({ type: 'CLOSE_MODAL' })}
        onSubmit={createParticipant}
        users={users}
        title={'Register for ' + tournament.name}
      />

      <MessageSnackBar
        open={state.snackBarOpen}
        onClose={() => dispatch({ type: 'CLOSE_SNACKBAR' })}
        error={state.requestError}
        message={state.snackBarMessage}
      />
    </div>
  )
}
