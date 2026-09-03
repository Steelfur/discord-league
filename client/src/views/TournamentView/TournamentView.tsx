import { Fab, Theme, createStyles, makeStyles } from '@material-ui/core'
import AddIcon from '@material-ui/icons/Add'
import { Dispatch, useCallback, useReducer } from 'react'

import { api } from '../../api'
import { useConfirm } from '../../components/ConfirmProvider'
import { useIsAdmin } from '../../hooks/useIsAdmin'
import { useTournaments } from '../../hooks/useTournaments'
import { Loading } from '../../components/Loading'
import { EmptyState } from '../../components/EmptyState'
import { MessageSnackBar } from '../../components/MessageSnackBar'
import { RequestError } from '../../components/RequestError'
import { EditTournamentModal } from '../../modals/EditTournamentModal'
import { TournamentIndex } from './TournamentIndex'

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    fab: {
      position: 'fixed',
      bottom: theme.spacing(2),
      right: theme.spacing(2),
    },
  })
)

interface State {
  snackBarOpen: boolean
  requestError: boolean
  snackBarMessage: string
  modalOpen: boolean
}
function initState() {
  return {
    snackBarOpen: false,
    requestError: false,
    snackBarMessage: '',
    modalOpen: false,
  }
}

type Action =
  | { type: 'CLOSE_SNACKBAR' | 'OPEN_MODAL' | 'CLOSE_MODAL' }
  | { type: 'SUCCESS' | 'FAILURE'; payload: string }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'CLOSE_SNACKBAR':
      return { ...state, snackBarOpen: false }
    case 'OPEN_MODAL':
      return { ...state, modalOpen: true }
    case 'CLOSE_MODAL':
      return { ...state, modalOpen: false }
    case 'SUCCESS':
      return {
        snackBarOpen: true,
        snackBarMessage: action.payload,
        requestError: false,
        modalOpen: false,
      }
    case 'FAILURE':
      return {
        ...state,
        snackBarOpen: true,
        snackBarMessage: action.payload,
        requestError: true,
      }
  }
}

const useCreateTournament = (dispatch: Dispatch<Action>, onSuccess: () => void) =>
  useCallback(
    (name: string, startDate: Date, description?: string) => {
      api.Tournament.create({
        body: {
          name,
          startDate,
          description,
          type: 'pod6',
          status: 'upcoming',
        },
      })
        .then(() => {
          dispatch({ type: 'SUCCESS', payload: 'The tournament was created successfully!' })
          onSuccess()
        })
        .catch(() =>
          dispatch({
            type: 'FAILURE',
            payload: 'The tournament could not be created',
          })
        )
    },
    [dispatch, onSuccess]
  )

export function TournamentView() {
  const classes = useStyles()
  const [state, dispatch] = useReducer(reducer, undefined, initState)
  const isAdmin = useIsAdmin()
  const [tournaments, refetchTournaments] = useTournaments()
  const createTournament = useCreateTournament(dispatch, refetchTournaments)
  const confirm = useConfirm()

  async function seedTestTournament() {
    if (
      !(await confirm({
        title: 'Generate test tournament',
        body: '18 fake players, group stage started, random results filled in. Safe to delete after.',
        confirmLabel: 'Generate',
      }))
    )
      return
    api.Tournament.seedTest({ body: { players: 18, start: true, withResults: true } })
      .then(() => {
        dispatch({ type: 'SUCCESS', payload: 'Test tournament created.' })
        refetchTournaments()
      })
      .catch((e: unknown) => {
        const d =
          e && typeof (e as { data?: () => unknown }).data === 'function'
            ? String((e as { data: () => unknown }).data())
            : ''
        dispatch({ type: 'FAILURE', payload: d || 'Could not create the test tournament' })
      })
  }

  if (typeof tournaments.error === 'string') {
    return <RequestError requestError={tournaments.error} />
  }
  if (tournaments.loading) {
    return <Loading />
  }
  if (tournaments.data == null) {
    return <EmptyState />
  }

  return (
    <>
      <TournamentIndex
        ongoingTournaments={tournaments.data.ongoing}
        pastTournaments={tournaments.data.past}
        upcomingTournaments={tournaments.data.upcoming}
      />
      <EditTournamentModal
        modalOpen={state.modalOpen}
        onClose={() => dispatch({ type: 'CLOSE_MODAL' })}
        onSubmit={createTournament}
        title="Create new Tournament"
      />
      <MessageSnackBar
        open={state.snackBarOpen}
        onClose={() => dispatch({ type: 'CLOSE_SNACKBAR' })}
        error={state.requestError}
        message={state.snackBarMessage}
      />
      {isAdmin && (
        <div className={classes.fab} style={{ display: 'flex', gap: 8 }}>
          <Fab color="default" variant="extended" onClick={seedTestTournament}>
            🧪 Test Tournament
          </Fab>
          <Fab
            color="primary"
            aria-label="new tournament"
            variant="extended"
            onClick={() => dispatch({ type: 'OPEN_MODAL' })}
          >
            <AddIcon />
            New Tournament
          </Fab>
        </div>
      )}
    </>
  )
}
