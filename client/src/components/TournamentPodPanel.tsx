import { PodResult, RankedParticipant, UserRowData } from '@dl/api'
import { useMemo } from 'react'
import { Grid, Container } from '@material-ui/core'
import { PodTable } from './PodTable'

export function TournamentPodPanel({
  pods,
  participants,
  users,
  onUpdate,
}: {
  pods: PodResult[]
  participants: RankedParticipant[]
  users: UserRowData[]
  onUpdate?: () => void
}) {
  const prepedPods = useMemo(
    () =>
      pods.map((pod) => ({
        ...pod,
        participants: pod.participants.map(
          ({ id }) => participants.find((participant) => participant.id === id)!
        ),
      })),
    [pods, participants]
  )
  const allPods = useMemo(() => pods.map((p) => ({ id: p.id, name: p.name })), [pods])
  return (
    <Container>
      <Grid container spacing={2}>
        {prepedPods.map((pod) => (
          <Grid item xs={12} md={6} key={pod.id}>
            <PodTable pod={pod} podLink users={users} allPods={allPods} onUpdate={onUpdate} />
          </Grid>
        ))}
      </Grid>
    </Container>
  )
}
