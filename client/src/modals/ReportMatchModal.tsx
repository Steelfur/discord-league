import { ShortMatchData, ParticipantWithUserData } from '@dl/api'
import { useMemo, useState } from 'react'
import {
  Button,
  ButtonGroup,
  createStyles,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  makeStyles,
  Modal,
  Radio,
  RadioGroup,
  Theme,
} from '@material-ui/core'

import { HeroSelect } from '../components/HeroSelect'
import { UserAvatar } from '../components/UserAvatar/UserAvatar'

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    modal: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      overflow: 'auto',
    },
    paper: {
      position: 'relative',
      marginTop: '5%',
      backgroundColor: theme.palette.background.paper,
      border: '2px solid #000',
      maxWidth: 720,
      width: '90%',
      boxShadow: theme.shadows[5],
      padding: theme.spacing(2, 4, 8, 4),
    },
    buttonGroup: {
      position: 'absolute',
      bottom: theme.spacing(2),
      right: theme.spacing(2),
    },
  })
)

export interface MatchReportState {
  winnerId?: number | null
  isDraw?: boolean
  noShow?: boolean
  firstPlayerId?: number
  playerAHeroId?: number
  playerBHeroId?: number
}

type Outcome = 'A' | 'B' | 'draw' | 'noShowA' | 'noShowB' | 'noShowBoth'

export function ReportMatchModal(props: {
  modalOpen: boolean
  onClose: () => void
  onSubmit: (state: MatchReportState) => void
  match: ShortMatchData
  participantA: ParticipantWithUserData
  participantB: ParticipantWithUserData
}) {
  const classes = useStyles()
  const { match, participantA, participantB } = props

  const initialOutcome: Outcome | undefined = match.isDraw
    ? 'draw'
    : match.noShow && match.winnerId === match.playerAId
    ? 'noShowB'
    : match.noShow && match.winnerId === match.playerBId
    ? 'noShowA'
    : match.noShow
    ? 'noShowBoth'
    : match.winnerId === match.playerAId
    ? 'A'
    : match.winnerId === match.playerBId
    ? 'B'
    : undefined

  const [outcome, setOutcome] = useState<Outcome | undefined>(initialOutcome)
  const [firstPlayerId, setFirstPlayerId] = useState<number | undefined>(
    match.firstPlayerId || undefined
  )
  const [playerAHeroId, setPlayerAHeroId] = useState<number | undefined>(
    match.playerAHeroId || undefined
  )
  const [playerBHeroId, setPlayerBHeroId] = useState<number | undefined>(
    match.playerBHeroId || undefined
  )
  const [outcomeError, setOutcomeError] = useState(false)

  const body = useMemo<MatchReportState | null>(() => {
    if (!outcome) return null
    const base = { firstPlayerId, playerAHeroId, playerBHeroId }
    switch (outcome) {
      case 'A':
        return { ...base, winnerId: match.playerAId, isDraw: false, noShow: false }
      case 'B':
        return { ...base, winnerId: match.playerBId, isDraw: false, noShow: false }
      case 'draw':
        return { ...base, winnerId: null, isDraw: true, noShow: false }
      case 'noShowA':
        return { ...base, winnerId: match.playerBId, isDraw: false, noShow: true }
      case 'noShowB':
        return { ...base, winnerId: match.playerAId, isDraw: false, noShow: true }
      case 'noShowBoth':
        return { ...base, winnerId: null, isDraw: false, noShow: true }
    }
  }, [outcome, firstPlayerId, playerAHeroId, playerBHeroId, match.playerAId, match.playerBId])

  const nameA = participantA.discordTag
  const nameB = participantB.discordTag

  function submit() {
    if (!body) {
      setOutcomeError(true)
      return
    }
    props.onSubmit(body)
  }

  return (
    <Modal open={props.modalOpen} onClose={props.onClose} className={classes.modal}>
      <div className={classes.paper}>
        <h2>Report Match</h2>
        <Grid container spacing={4}>
          <Grid item xs={12} sm={6}>
            <FormControl component="fieldset" error={outcomeError}>
              <FormLabel component="legend">Result</FormLabel>
              <RadioGroup
                value={outcome ?? ''}
                onChange={(e) => {
                  setOutcome(e.target.value as Outcome)
                  setOutcomeError(false)
                }}
              >
                <FormControlLabel value="A" control={<Radio />} label={`${nameA} won`} />
                <FormControlLabel value="B" control={<Radio />} label={`${nameB} won`} />
                <FormControlLabel value="draw" control={<Radio />} label="Draw" />
                <FormControlLabel
                  value="noShowA"
                  control={<Radio />}
                  label={`${nameA} no-show (${nameB} wins)`}
                />
                <FormControlLabel
                  value="noShowB"
                  control={<Radio />}
                  label={`${nameB} no-show (${nameA} wins)`}
                />
                <FormControlLabel
                  value="noShowBoth"
                  control={<Radio />}
                  label="Both no-show (double loss)"
                />
              </RadioGroup>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Who went first?</FormLabel>
              <RadioGroup
                value={firstPlayerId ?? ''}
                onChange={(e) => {
                  const v = Number.parseInt(e.target.value, 10)
                  setFirstPlayerId(Number.isNaN(v) ? undefined : v)
                }}
              >
                <FormControlLabel
                  value={match.playerAId}
                  control={<Radio />}
                  label={nameA}
                />
                <FormControlLabel
                  value={match.playerBId}
                  control={<Radio />}
                  label={nameB}
                />
                <FormControlLabel value="" control={<Radio />} label="Not sure" />
              </RadioGroup>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Divider />
            <br />
            <UserAvatar
              small
              userId={participantA.userId}
              userAvatar={participantA.discordAvatar}
              userName={nameA}
            />
            <br />
            <HeroSelect
              label="Hero played"
              heroId={playerAHeroId}
              allowNone
              onChange={setPlayerAHeroId}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Divider />
            <br />
            <UserAvatar
              small
              userId={participantB.userId}
              userAvatar={participantB.discordAvatar}
              userName={nameB}
            />
            <br />
            <HeroSelect
              label="Hero played"
              heroId={playerBHeroId}
              allowNone
              onChange={setPlayerBHeroId}
            />
          </Grid>
        </Grid>

        <ButtonGroup className={classes.buttonGroup}>
          <Button color="inherit" variant="contained" onClick={props.onClose}>
            Cancel
          </Button>
          <Button color="primary" variant="contained" onClick={submit}>
            Report Match!
          </Button>
        </ButtonGroup>
      </div>
    </Modal>
  )
}
