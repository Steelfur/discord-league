import { User$findAll, RankedParticipant, Tournament, BracketMatch, PodResult } from '@dl/api'
import { useCallback, useContext, useState } from 'react'
import {
  Container,
  createStyles,
  Fab,
  makeStyles,
  Paper,
  Theme,
  Tab,
  Tabs,
} from '@material-ui/core'

import { api } from '../../api'
import { UserContext } from '../../App'
import { useConfirm, useNotify } from '../../components/ConfirmProvider'
import { BracketDisplay } from '../../components/BracketDisplay/BracketDisplay'
import { TournamentAdminPanel } from '../../components/TournamentAdminPanel'
import { TournamentCupClassification } from '../../components/TournamentCupClassification'
import { TournamentHeaderPanel } from '../../components/TournamentHeaderPanel'
import { TournamentParticipationPanel } from '../../components/TournamentParticipationPanel'
import { TournamentPodPanel } from '../../components/TournamentPodPanel'
import { TournamentStatistics } from '../../components/TournamentStatistics'
import { useIsAdmin } from '../../hooks/useIsAdmin'

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    fab: {
      position: 'fixed',
      bottom: theme.spacing(2),
      right: theme.spacing(2),
    },
    tabs: { marginBottom: theme.spacing(3) },
  })
)

function errorText(err: unknown): string {
  // eslint-disable-next-line no-console
  console.error('[FaB League] request failed:', err)
  const e = err as { status?: () => number; data?: () => unknown; error?: () => unknown }
  const status = typeof e?.status === 'function' ? e.status() : undefined
  const body =
    (typeof e?.data === 'function' && e.data()) || (typeof e?.error === 'function' && e.error()) || ''
  const text = typeof body === 'string' && body ? body : ''
  return `Request failed${status ? ` (${status})` : ''}: ${text || 'no details'}`
}

function useStageAction(
  run: () => Promise<unknown>,
  question: string,
  onSuccess: () => void
): () => void {
  const confirm = useConfirm()
  const notify = useNotify()
  return useCallback(async () => {
    if (!(await confirm({ title: 'Confirm', body: question, confirmLabel: 'Yes' }))) return
    try {
      await run()
      onSuccess()
    } catch (err) {
      await notify({ title: 'Could not complete', body: errorText(err) })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirm, notify, onSuccess, question])
}

const useFinishGroupPhase = (tournamentId: number, onSuccess: () => void) =>
  useStageAction(
    () => api.Tournament.closeGroupStage({ tournamentId }),
    'End the group phase for this tournament? This cannot be undone.',
    onSuccess
  )

const useStartBracketPhase = (tournamentId: number, onSuccess: () => void) =>
  useStageAction(
    () => api.Tournament.startBracketStage({ tournamentId }),
    'Lock the decklists and start the bracket phase?',
    onSuccess
  )

const useFinishBracketPhase = (tournamentId: number, onSuccess: () => void) =>
  useStageAction(
    () => api.Tournament.closeBracketStage({ tournamentId }),
    'Finish this tournament? This cannot be undone.',
    onSuccess
  )

type AvailableTab = 'pods' | 'players' | 'admin' | 'decklists' | 'brackets' | 'statistics'
function initialTab(tournament: Tournament): AvailableTab {
  switch (tournament.statusId) {
    case 'upcoming':
      return 'players'
    case 'group':
      return 'pods'
    case 'endOfGroup':
      return 'decklists'
    case 'bracket':
    case 'finished':
      return 'brackets'
  }
}
export function TournamentDetail({
  tournament,
  pods,
  users,
  bracketMatches,
  participants,
  onTournamentUpdate,
}: {
  tournament: Tournament
  pods: PodResult[]
  bracketMatches: BracketMatch[]
  users: User$findAll['response']
  participants: RankedParticipant[]
  onTournamentUpdate: () => void
}) {
  const classes = useStyles()
  const isAdmin = useIsAdmin()
  const currentUser = useContext(UserContext)
  const [activeTab, setActiveTab] = useState(() => initialTab(tournament))
  const finishGroupPhase = useFinishGroupPhase(tournament.id, onTournamentUpdate)
  const startBracketPhase = useStartBracketPhase(tournament.id, onTournamentUpdate)
  const finishBracketPhase = useFinishBracketPhase(tournament.id, onTournamentUpdate)

  return (
    <>
      <Container>
        <Paper>
          <TournamentHeaderPanel tournament={tournament} />
          <Tabs
            value={activeTab}
            onChange={(_, newTab) => setActiveTab(newTab)}
            className={classes.tabs}
          >
            {(tournament.statusId === 'bracket' || tournament.statusId === 'finished') && (
              <Tab label="Brackets" value="brackets" />
            )}

            {(tournament.statusId === 'endOfGroup' ||
              tournament.statusId === 'bracket' ||
              tournament.statusId === 'finished') && <Tab label="Decklists" value="decklists" />}

            {(tournament.statusId === 'endOfGroup' ||
              tournament.statusId === 'bracket' ||
              tournament.statusId === 'finished') && <Tab label="Statistics" value="statistics" />}

            {(tournament.statusId === 'group' ||
              tournament.statusId === 'endOfGroup' ||
              tournament.statusId === 'bracket' ||
              tournament.statusId === 'finished') && <Tab label="Pods" value="pods" />}

            {tournament.statusId === 'group' && isAdmin && (
              <Tab label="Statistics" value="statistics" />
            )}

            <Tab label="Players" value="players" />
            {isAdmin && <Tab label="Admin" value="admin" />}
          </Tabs>

          {activeTab === 'brackets' && (
            <BracketDisplay
              bracketMatches={bracketMatches}
              participants={participants}
              isAdmin={isAdmin}
              currentUserDiscordId={currentUser?.discordId}
              onReported={onTournamentUpdate}
            />
          )}

          {activeTab === 'decklists' && (
            <TournamentCupClassification tournamentId={tournament.id} participants={participants} />
          )}

          {activeTab === 'pods' && (
            <TournamentPodPanel
              pods={pods}
              participants={participants}
              users={users}
              onUpdate={onTournamentUpdate}
            />
          )}

          {activeTab === 'statistics' && (
            <TournamentStatistics tournamentId={tournament.id} participants={participants} />
          )}

          {activeTab === 'players' && (
            <TournamentParticipationPanel
              tournament={tournament}
              participants={participants}
              onUpdate={onTournamentUpdate}
              users={users}
            />
          )}

          {activeTab === 'admin' && (
            <TournamentAdminPanel tournament={tournament} onTournamentUpdate={onTournamentUpdate} />
          )}
        </Paper>
      </Container>

      {isAdmin &&
        (tournament.statusId === 'group' ? (
          <Fab
            color="primary"
            aria-label="finish group phase"
            variant="extended"
            className={classes.fab}
            onClick={finishGroupPhase}
          >
            <span role="img" aria-label="">
              📆
            </span>
            Finish Group Phase
          </Fab>
        ) : tournament.statusId === 'endOfGroup' ? (
          <Fab
            color="primary"
            aria-label="Lock decks and start bracket phase"
            variant="extended"
            className={classes.fab}
            onClick={startBracketPhase}
          >
            <span role="img" aria-label="">
              ⚔️
            </span>
            Lock decks & Start bracket phase
          </Fab>
        ) : tournament.statusId === 'bracket' ? (
          <Fab
            color="primary"
            aria-label="Finish the tournament"
            variant="extended"
            className={classes.fab}
            onClick={finishBracketPhase}
          >
            <span role="img" aria-label="">
              ✅
            </span>
            Finish the tournament
          </Fab>
        ) : null)}
    </>
  )
}
