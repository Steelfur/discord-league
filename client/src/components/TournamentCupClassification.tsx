import { Decklist, ParticipantWithUserData } from '@dl/api'
import { memo, useCallback, useContext, useReducer } from 'react'
import {
  Chip,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
} from '@material-ui/core'

import { api } from '../api'
import { UserContext } from '../App'
import { useHeroLookup } from '../hooks/useReferenceData'
import { useTournamentDecklists } from '../hooks/useTournamentDecklists'
import { isAdmin } from '../hooks/useUsers'
import { SubmitDecklistModal } from '../modals/SubmitDecklistModal'
import { UserAvatarAndClan } from './UserAvatar/UserAvatar'

// `bracket === 'goldCup'` is the "made the cut" flag. Split into in / out.
function splitByCut<P extends { heroId: number; bracket: 'goldCup' | 'silverCup' | null }>(
  players: P[]
) {
  return players
    .sort((a, b) => a.heroId - b.heroId)
    .reduce<[P[], P[]]>(
      (acc, participant) => {
        acc[participant.bracket === 'goldCup' ? 0 : 1].push(participant)
        return acc
      },
      [[], []]
    )
}

const DecklistsTable: React.FC<{
  title: string
  decklists: Decklist[]
  participants: ParticipantWithUserData[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentUser: any
  dispatch: React.Dispatch<Action>
}> = (props) => {
  const lookup = useHeroLookup()
  if (props.participants.length === 0) return null
  return (
    <div style={{ marginBottom: 10 }}>
      <Typography variant="h4">{props.title}</Typography>
      <TableContainer component={Paper}>
        <Table aria-label={`${props.title} decklists`}>
          <TableBody>
            {props.participants.map((participant) => {
              const decklist = props.decklists.find((d) => d.participantId === participant.id)
              const canEdit =
                isAdmin(props.currentUser) ||
                (!decklist?.locked && props.currentUser?.discordId === participant.discordId)
              return (
                <TableRow key={participant.id}>
                  <TableCell width="45%">
                    <UserAvatarAndClan user={participant} />
                  </TableCell>
                  <TableCell width="25%">{lookup.heroName(participant.heroId)}</TableCell>
                  <TableCell width="15%">
                    {decklist?.link && (
                      <a
                        href={decklist.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={decklist.link}
                      >
                        Decklist ↗
                      </a>
                    )}
                  </TableCell>
                  <TableCell width="15%" align="right">
                    {canEdit && (
                      <Chip
                        clickable
                        label={decklist ? 'Edit link' : 'Add link'}
                        variant="outlined"
                        onClick={() =>
                          props.dispatch({
                            type: 'openModal',
                            participantId: participant.id,
                            change: decklist ? 'edit' : 'create',
                          })
                        }
                      />
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  )
}

interface State {
  isModalOpen: boolean
  change?: 'create' | 'edit'
  participantId?: number
}

const initialState = { isModalOpen: false }

type Action =
  | { type: 'openModal'; change: 'create' | 'edit'; participantId: number }
  | { type: 'closeModal' }
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'openModal':
      return { isModalOpen: true, change: action.change, participantId: action.participantId }
    case 'closeModal':
      return { isModalOpen: false }
  }
}

export const TournamentCupClassification = memo(
  (props: { tournamentId: number; participants: ParticipantWithUserData[] }) => {
    const currentUser = useContext(UserContext)
    const [state, dispatch] = useReducer(reducer, initialState)
    const [decklistFetching, refreshDecklists] = useTournamentDecklists(props.tournamentId)
    const submit = useCallback(
      async (decklist: { link: string; decklist?: string }) => {
        if (state.participantId != null && state.change != null) {
          const params = { participantId: state.participantId, body: decklist }
          if (state.change === 'create') {
            await api.Decklist.createForParticipant(params)
          } else {
            await api.Decklist.updateForParticipant(params)
          }

          dispatch({ type: 'closeModal' })
          refreshDecklists()
        }
      },
      [state.participantId, state.change, dispatch, refreshDecklists]
    )
    if (!decklistFetching.data) {
      return null
    }

    const [inCutParticipants] = splitByCut(props.participants)
    const [inCutDecklists] = splitByCut(decklistFetching.data)

    return (
      <Container>
        {inCutParticipants.length === 0 ? (
          <Typography>The cut is set once the group stage is finished.</Typography>
        ) : (
          <DecklistsTable
            title="In the cut"
            decklists={inCutDecklists}
            participants={inCutParticipants}
            currentUser={currentUser}
            dispatch={dispatch}
          />
        )}
        {state.isModalOpen && (
          <SubmitDecklistModal
            initialLink={
              decklistFetching.data.find((d) => d.participantId === state.participantId)?.link
            }
            onCancel={() => dispatch({ type: 'closeModal' })}
            onConfirm={submit}
          />
        )}
      </Container>
    )
  }
)
