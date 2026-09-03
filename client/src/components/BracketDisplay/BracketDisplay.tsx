import { BracketMatch, RankedParticipant } from '@dl/api'
import { Typography } from '@material-ui/core'
import { FC, useMemo, useState } from 'react'

import { api } from '../../api'

type CanReport = (m: BracketMatch) => boolean

function nameOf(
  participants: RankedParticipant[],
  id: number | null,
  seed: number | null
): string {
  if (id != null) return participants.find((p) => p.id === id)?.discordTag ?? `#${id}`
  if (seed != null) return `Seed ${seed}`
  return 'TBD'
}

const MatchCard: FC<{
  match: BracketMatch
  participants: RankedParticipant[]
  canReport: CanReport
  onReported: () => void
}> = ({ match, participants, canReport, onReported }) => {
  const [busy, setBusy] = useState(false)
  const bothPresent = match.participantAId != null && match.participantBId != null
  const reportable = canReport(match) && bothPresent

  const report = async (winnerId: number) => {
    if (!window.confirm(`Set ${nameOf(participants, winnerId, null)} as the winner?`)) return
    setBusy(true)
    try {
      await api.BracketMatch.report({ matchId: match.id, body: { winnerId } })
      onReported()
    } catch {
      window.alert('Could not report this match')
    } finally {
      setBusy(false)
    }
  }

  const row = (id: number | null, seed: number | null, first: boolean) => {
    const isWinner = id != null && id === match.winnerId
    const clickable = reportable && !busy && id != null
    return (
      <div
        onClick={clickable ? () => report(id as number) : undefined}
        title={clickable ? 'Click to set as winner' : undefined}
        style={{
          padding: '4px 8px',
          fontWeight: isWinner ? 700 : 400,
          background: isWinner ? 'rgba(183,28,28,0.12)' : 'transparent',
          cursor: clickable ? 'pointer' : 'default',
          borderBottom: first ? '1px solid rgba(0,0,0,0.12)' : undefined,
        }}
      >
        {nameOf(participants, id, seed)}
      </div>
    )
  }

  return (
    <div
      style={{
        border: '1px solid rgba(0,0,0,0.2)',
        borderRadius: 4,
        minWidth: 170,
        fontSize: 13,
        background: '#fff',
      }}
    >
      {row(match.participantAId, match.seedA, true)}
      {row(match.participantBId, match.seedB, false)}
    </div>
  )
}

const Half: FC<{
  heading: string
  side: 'winners' | 'losers'
  bracketMatches: BracketMatch[]
  participants: RankedParticipant[]
  canReport: CanReport
  onReported: () => void
}> = ({ heading, side, bracketMatches, participants, canReport, onReported }) => {
  const rounds = useMemo(
    () =>
      Array.from(
        new Set(bracketMatches.filter((m) => m.side === side).map((m) => m.round))
      ).sort((a, b) => a - b),
    [bracketMatches, side]
  )
  if (rounds.length === 0) return null

  return (
    <div style={{ marginBottom: 24 }}>
      <Typography variant="h6">{heading}</Typography>
      <div style={{ display: 'flex', gap: 24, overflowX: 'auto', padding: '8px 0' }}>
        {rounds.map((round) => (
          <div key={round} style={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="caption" style={{ textAlign: 'center', fontWeight: 700 }}>
              Round {round}
            </Typography>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-around',
                gap: 12,
                flex: 1,
              }}
            >
              {bracketMatches
                .filter((m) => m.side === side && m.round === round)
                .sort((a, b) => a.slot - b.slot)
                .map((m) => (
                  <MatchCard
                    key={m.id}
                    match={m}
                    participants={participants}
                    canReport={canReport}
                    onReported={onReported}
                  />
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export const BracketDisplay: FC<{
  bracketMatches: BracketMatch[]
  participants: RankedParticipant[]
  currentUserDiscordId?: string
  isAdmin: boolean
  onReported: () => void
}> = ({ bracketMatches, participants, currentUserDiscordId, isAdmin, onReported }) => {
  const myParticipantIds = useMemo(
    () =>
      new Set(
        participants.filter((p) => p.discordId === currentUserDiscordId).map((p) => p.id)
      ),
    [participants, currentUserDiscordId]
  )

  if (bracketMatches.length === 0) {
    return <Typography>No bracket yet — it is seeded when the bracket phase starts.</Typography>
  }

  const canReport: CanReport = (m) =>
    isAdmin ||
    (m.participantAId != null && myParticipantIds.has(m.participantAId)) ||
    (m.participantBId != null && myParticipantIds.has(m.participantBId))

  const grandFinal = bracketMatches.find((m) => m.side === 'grandFinal')
  const champion =
    grandFinal && grandFinal.winnerId != null
      ? nameOf(participants, grandFinal.winnerId, null)
      : null

  return (
    <div style={{ padding: 8 }}>
      {champion && (
        <Typography variant="h5" gutterBottom>
          🏆 Champion: {champion}
        </Typography>
      )}
      <Half
        heading="Upper bracket"
        side="winners"
        bracketMatches={bracketMatches}
        participants={participants}
        canReport={canReport}
        onReported={onReported}
      />
      <Half
        heading="Lower bracket"
        side="losers"
        bracketMatches={bracketMatches}
        participants={participants}
        canReport={canReport}
        onReported={onReported}
      />
      {grandFinal && (
        <div>
          <Typography variant="h6">Grand final</Typography>
          <div style={{ padding: '8px 0' }}>
            <MatchCard
              match={grandFinal}
              participants={participants}
              canReport={canReport}
              onReported={onReported}
            />
          </div>
        </div>
      )}
    </div>
  )
}
