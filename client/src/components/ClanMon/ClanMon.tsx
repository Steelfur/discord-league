import { FC } from 'react'

import NeutralMon from '../../assets/mons/neu_icon.svg?react'
import CrabMon from '../../assets/mons/crb_icon.svg?react'
import CraneMon from '../../assets/mons/crn_icon.svg?react'
import DragonMon from '../../assets/mons/drg_icon.svg?react'
import LionMon from '../../assets/mons/lio_icon.svg?react'
import PhoenixMon from '../../assets/mons/phx_icon.svg?react'
import ScorpionMon from '../../assets/mons/scp_icon.svg?react'
import UnicornMon from '../../assets/mons/uni_icon.svg?react'

import styles from './styles.module.scss'

export const ClanMon: FC<{ clanId?: number; small?: boolean; large?: boolean }> = (props) => {
  const className = props.large ? styles.large : props.small ? styles.small : styles.medium

  switch (props.clanId) {
    case 1:
      return <CrabMon className={className} />
    case 2:
      return <CraneMon className={className} />
    case 3:
      return <DragonMon className={className} />
    case 4:
      return <LionMon className={className} />
    case 5:
      return <PhoenixMon className={className} />
    case 6:
      return <ScorpionMon className={className} />
    case 7:
      return <UnicornMon className={className} />
    default:
      return <NeutralMon className={className} />
  }
}
