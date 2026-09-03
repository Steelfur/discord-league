import { Tournament, Tournament$startGroupStage } from '@dl/api'
import {
  Typography,
  Button,
  Divider,
  makeStyles,
  Theme,
  createStyles,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from '@material-ui/core'
import DeleteForeverIcon from '@material-ui/icons/DeleteForever'
import EditIcon from '@material-ui/icons/Edit'
import PlayArrowIcon from '@material-ui/icons/PlayArrow'
import { useReducer, useContext, useState } from 'react'
import { useHistory } from 'react-router-dom'

import { UserContext } from '../App'
import { api } from '../api'
import { isAdmin } from '../hooks/useUsers'
import { EditTournamentModal } from '../modals/EditTournamentModal'
import { StartTournamentModal } from '../modals/StartTournamentModal'
import { DeletionDialog } from './DeletionDialog'
import { MessageSnackBar } from './MessageSnackBar'

const STATUS_LABELS: Record<Tournament['statusId'], string> = {
  upcoming: 'Upcoming',
  group: 'Group stage',
  endOfGroup: 'End of group stage',
  bracket: 'Bracket stage',
  finished: 'Finished',
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    container: { minHeight: theme.spacing(10), paddingBottom: theme.spacing(2) },
    row: { padding: theme.spacing(1, 2), display: 'flex', flexWrap: 'wrap', gap: theme.spacing(1), alignItems: 'center' },
    button: { margin: theme.spacing(0.5) },
    danger: { marginTop: theme.spacing(2) },
  })
)

interface State {
  dialogOpen: boolean
  snackBarOpen: boolean
  requestError: boolean
  snackBarMessage: string
  editModalOpen: boolean
  startTournamentModalOpen: boolean
  startModalMode: 'start' | 'regenerate'
}

const initialState = (): State => ({
  dialogOpen: false,
  snackBarMessage: '',
  snackBarOpen: false,
  requestError: false,
  editModalOpen: false,
  startTournamentModalOpen: false,
  startModalMode: 'start',
})
type Action =
  | { type: 'OPEN_DIALOG' }
  | { type: 'CLOSE_DIALOG' }
  | { type: 'OPEN_EDIT_MODAL' }
  | { type: 'CLOSE_EDIT_MODAL' }
  | { type: 'OPEN_START_MODAL'; mode: 'start' | 'regenerate' }
  | { type: 'CLOSE_START_MODAL' }
  | { type: 'UPDATE_SUCCESS'; payload: string }
  | { type: 'REQUEST_ERROR'; payload: string }
  | { type: 'CLOSE_SNACKBAR' }
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'OPEN_DIALOG':
      return { ...state, dialogOpen: true }
    case 'CLOSE_DIALOG':
      return { ...state, dialogOpen: false }
    case 'OPEN_EDIT_MODAL':
      return { ...state, editModalOpen: true }
    case 'CLOSE_EDIT_MODAL':
      return { ...state, editModalOpen: false }
    case 'OPEN_START_MODAL':
      return { ...state, startTournamentModalOpen: true, startModalMode: action.mode }
    case 'CLOSE_START_MODAL':
      return { ...state, startTournamentModalOpen: false }
    case 'UPDATE_SUCCESS':
      return {
        ...state,
        editModalOpen: false,
        startTournamentModalOpen: false,
        snackBarMessage: action.payload,
        requestError: false,
        snackBarOpen: true,
      }
    case 'REQUEST_ERROR':
      return { ...state, snackBarOpen: true, snackBarMessage: action.payload, requestError: true }
    case 'CLOSE_SNACKBAR':
      return { ...state, snackBarOpen: false }
  }
}

export function TournamentAdminPanel(props: {
  tournament: Tournament
  onTournamentUpdate: () => void
}) {
  const classes = useStyles()
  const user = useContext(UserContext)
  const history = useHistory()
  const [state, dispatch] = useReducer(reducer, undefined, initialState)
  const [overrideStatus, setOverrideStatus] = useState<Tournament['statusId']>(
    props.tournament.statusId
  )

  const id = props.tournament.id
  const ok = (msg: string) => {
    props.onTournamentUpdate()
    dispatch({ type: 'UPDATE_SUCCESS', payload: msg })
  }
  const fail = (msg: string) => dispatch({ type: 'REQUEST_ERROR', payload: msg })

  function deleteTournament() {
    api.Tournament.deleteById({ tournamentId: id })
      .then(() => history.push('/tournaments'))
      .catch(() => fail('The tournament could not be deleted'))
  }

  function updateTournamentInfo(name: string, startDate: Date, description?: string) {
    api.Tournament.updateById({
      tournamentId: id,
      body: {
        id,
        name,
        startDate: startDate.toJSON(),
        description,
        statusId: props.tournament.statusId,
        typeId: props.tournament.typeId,
      },
    })
      .then(() => ok('The tournament was updated.'))
      .catch(() => fail('The tournament could not be updated'))
  }

  function toUtcDeadline(deadline: Date) {
    return new Date(
      Date.UTC(deadline.getFullYear(), deadline.getMonth(), deadline.getDate())
    ).toJSON()
  }

  function onStartModalSubmit(deadline: Date) {
    const body: Tournament$startGroupStage['request']['body'] = { deadline: toUtcDeadline(deadline) }
    const call =
      state.startModalMode === 'regenerate'
        ? api.Tournament.regeneratePods({ tournamentId: id, body })
        : api.Tournament.startGroupStage({ tournamentId: id, body })
    call
      .then(() => ok(state.startModalMode === 'regenerate' ? 'Pods regenerated.' : 'Tournament started.'))
      .catch(() => fail('Could not create pods for this tournament'))
  }

  function applyStatusOverride() {
    if (
      !window.confirm(
        `Force this tournament to "${STATUS_LABELS[overrideStatus]}"? This does not undo data from other stages.`
      )
    )
      return
    api.Tournament.setStatus({ tournamentId: id, body: { statusId: overrideStatus } })
      .then(() => ok('Stage changed.'))
      .catch(() => fail('Could not change the stage'))
  }

  function reseedBracket() {
    if (!window.confirm('Rebuild the bracket from the current group standings? Reported bracket results are lost.'))
      return
    api.Tournament.reseedBracket({ tournamentId: id })
      .then(() => ok('Bracket re-seeded.'))
      .catch(() => fail('Could not re-seed the bracket'))
  }

  if (!user || !isAdmin(user)) return <div />

  return (
    <div className={classes.container}>
      <Divider />
      <Typography variant="h6" align="center" style={{ marginTop: 8 }}>
        Admin Features
      </Typography>

      <div className={classes.row}>
        <Button
          color="primary"
          startIcon={<EditIcon />}
          variant="contained"
          className={classes.button}
          onClick={() => dispatch({ type: 'OPEN_EDIT_MODAL' })}
        >
          Edit Tournament
        </Button>
        {props.tournament.statusId === 'upcoming' && (
          <Button
            color="primary"
            startIcon={<PlayArrowIcon />}
            variant="contained"
            className={classes.button}
            onClick={() => dispatch({ type: 'OPEN_START_MODAL', mode: 'start' })}
          >
            Start Tournament
          </Button>
        )}
        {props.tournament.statusId === 'group' && (
          <Button
            color="primary"
            variant="contained"
            className={classes.button}
            onClick={() => dispatch({ type: 'OPEN_START_MODAL', mode: 'regenerate' })}
          >
            Regenerate Pods
          </Button>
        )}
        {props.tournament.statusId === 'bracket' && (
          <Button
            color="primary"
            variant="contained"
            className={classes.button}
            onClick={reseedBracket}
          >
            Re-seed Bracket
          </Button>
        )}
      </div>

      <div className={classes.row}>
        <FormControl style={{ minWidth: 200 }}>
          <InputLabel id="stage-override">Force stage</InputLabel>
          <Select
            labelId="stage-override"
            value={overrideStatus}
            onChange={(e) => setOverrideStatus(e.target.value as Tournament['statusId'])}
          >
            {(Object.keys(STATUS_LABELS) as Tournament['statusId'][]).map((s) => (
              <MenuItem key={s} value={s}>
                {STATUS_LABELS[s]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="outlined"
          disabled={overrideStatus === props.tournament.statusId}
          onClick={applyStatusOverride}
        >
          Apply stage
        </Button>
      </div>

      <div className={`${classes.row} ${classes.danger}`}>
        <Button
          color="secondary"
          startIcon={<DeleteForeverIcon />}
          variant="contained"
          onClick={() => dispatch({ type: 'OPEN_DIALOG' })}
        >
          Delete Tournament
        </Button>
      </div>

      <DeletionDialog
        entity="tournament"
        dialogOpen={state.dialogOpen}
        onClose={() => dispatch({ type: 'CLOSE_DIALOG' })}
        handleDeleteAction={deleteTournament}
      />
      <StartTournamentModal
        modalOpen={state.startTournamentModalOpen}
        onClose={() => dispatch({ type: 'CLOSE_START_MODAL' })}
        onSubmit={onStartModalSubmit}
      />
      <EditTournamentModal
        modalOpen={state.editModalOpen}
        onClose={() => dispatch({ type: 'CLOSE_EDIT_MODAL' })}
        onSubmit={updateTournamentInfo}
        title="Edit Tournament"
        initialState={{
          name: props.tournament.name,
          startDate: new Date(props.tournament.startDate),
          description: props.tournament.description,
        }}
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
