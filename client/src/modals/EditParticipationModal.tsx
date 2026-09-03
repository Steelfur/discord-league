import { UserRowData } from '@dl/api'
import { useReducer, useContext } from 'react'
import {
  Button,
  ButtonGroup,
  createStyles,
  Grid,
  makeStyles,
  MenuItem,
  Modal,
  Select,
  Theme,
} from '@material-ui/core'

import { UserContext } from '../App'
import { HeroSelect } from '../components/HeroSelect'
import { UserAvatar } from '../components/UserAvatar/UserAvatar'
import { isAdmin } from '../hooks/useUsers'

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    modal: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    paper: {
      position: 'relative',
      backgroundColor: theme.palette.background.paper,
      border: '2px solid #000',
      boxShadow: theme.shadows[5],
      padding: theme.spacing(2, 4, 3),
    },
    buttonGroup: {
      position: 'absolute',
      bottom: theme.spacing(2),
      right: theme.spacing(2),
    },
    inputField: {
      width: 350,
    },
  })
)

export interface ParticipationState {
  userId: string
  heroId: number
  participationId?: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function reducer(state: ParticipationState, action: any): ParticipationState {
  switch (action.type) {
    case 'CHANGE_HERO':
      return { ...state, heroId: action.payload }
    case 'CHANGE_USER':
      return { ...state, userId: action.payload }
    default:
      throw new Error()
  }
}

export function EditParticipationModal(props: {
  modalOpen: boolean
  onClose: () => void
  onSubmit: (userId: string, heroId: number, participationId?: number) => void
  title: string
  users: UserRowData[]
  initialState?: ParticipationState
}) {
  const user = useContext(UserContext)
  const classes = useStyles()
  const initialState: ParticipationState = props.initialState || {
    userId: user?.discordId || '',
    heroId: user?.preferredHeroId || 1,
    participationId: undefined,
  }
  const [state, dispatch] = useReducer(reducer, initialState)

  return user ? (
    <Modal
      aria-labelledby="edit-participation-modal-title"
      open={props.modalOpen}
      onClose={props.onClose}
      className={classes.modal}
    >
      <div className={classes.paper}>
        <h2 id="edit-participation-modal-title">{props.title}</h2>
        <br />
        <Grid container direction="column" alignItems="stretch" spacing={4}>
          <Grid item>
            {isAdmin(user) ? (
              <Select
                id="userId"
                value={state.userId}
                className={classes.inputField}
                onChange={(event) =>
                  dispatch({ type: 'CHANGE_USER', payload: event.target.value as string })
                }
              >
                {props.users
                  .slice()
                  .sort((a, b) => a.discordName.localeCompare(b.discordName))
                  .map((u: UserRowData) => (
                    <MenuItem value={u.userId} key={u.userId}>
                      <UserAvatar
                        displayAvatarURL={u.displayAvatarURL}
                        userName={u.discordName}
                        small
                      />
                    </MenuItem>
                  ))}
              </Select>
            ) : (
              <UserAvatar displayAvatarURL={user.displayAvatarURL} userId={user.discordId} small />
            )}
          </Grid>
          <Grid item>
            <HeroSelect
              heroId={state.heroId}
              label="Hero"
              onChange={(heroId) => dispatch({ type: 'CHANGE_HERO', payload: heroId })}
            />
          </Grid>
        </Grid>
        <br />
        <br />
        <ButtonGroup className={classes.buttonGroup}>
          <Button color="inherit" variant="contained" onClick={props.onClose}>
            Cancel
          </Button>
          <Button
            color="primary"
            variant="contained"
            onClick={() =>
              props.onSubmit(state.userId || user.discordId, state.heroId, state.participationId)
            }
          >
            {props.title}
          </Button>
        </ButtonGroup>
      </div>
    </Modal>
  ) : (
    <div />
  )
}
