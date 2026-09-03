import { ParticipantRecord, MatchRecord } from '../../gateways/storage'

export type Player = ParticipantRecord
export type Match = MatchRecord

export interface Pod {
  players: Player[]
}
