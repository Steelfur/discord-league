import { FC, memo, ReactEventHandler } from 'react'
import styles from './styles.module.scss'
import { ClassDot } from '../HeroTag'

const avatarFallback = (id?: string) =>
  `https://cdn.discordapp.com/embed/avatars/${
    typeof id === 'string' ? parseInt(id, 10) % 5 : 1
  }.png`

const avatarSrc = (displayAvatarURL?: string, userId?: string, userAvatar?: string) =>
  typeof displayAvatarURL === 'string'
    ? displayAvatarURL
    : userId && userAvatar
    ? `https://cdn.discordapp.com/avatars/${userId}/${userAvatar}.webp`
    : avatarFallback(userId)

const useAvatarFallback: ReactEventHandler<HTMLImageElement> = (ev) => {
  ev.currentTarget.onerror = null
  ev.currentTarget.src = avatarFallback(ev.currentTarget.dataset.discordId)
}

export const UserAvatar: FC<{
  userId?: string
  userAvatar?: string
  displayAvatarURL?: string
  userName?: string
  large?: boolean
  small?: boolean
}> = memo((props) => {
  const src = `${avatarSrc(props.displayAvatarURL, props.userId, props.userAvatar)}?size=${
    props.large ? 128 : props.small ? 32 : 64
  }`

  return (
    <div className={styles.root}>
      <img
        src={src}
        className={`${styles.avatar} ${
          props.large ? styles.avatarLarge : props.small ? styles.avatarSmall : styles.avatarMedium
        }`}
        loading="lazy"
        onError={useAvatarFallback}
        data-discord-id={props.userId}
      />
      {props.userName && <p className={styles.username}>{' ' + props.userName}</p>}
    </div>
  )
})

export const UserAvatarAndClan: FC<{
  user: {
    discordId: string
    discordAvatar: string
    discordTag: string
    heroId: number
    displayAvatarURL?: string
  }
  dropped?: boolean
  firstStrike?: boolean
}> = memo((props) => {
  const src = `${avatarSrc(
    props.user.displayAvatarURL,
    props.user.discordId,
    props.user.discordAvatar
  )}?size=${32}`

  return (
    <div className={styles.root}>
      <ClassDot heroId={props.user.heroId} small />

      <img
        src={src}
        className={`${styles.avatar} ${styles.avatarSmall} ${styles.avatarOnClanMon}`}
        onError={useAvatarFallback}
        data-discord-id={props.user.discordId}
      />

      <p className={styles.username}>
        {props.firstStrike && (
          <span title="First Strike!" className={styles.indicator}>
            💥
          </span>
        )}
        {props.dropped && (
          <span title="Dropped" className={styles.indicator}>
            💧
          </span>
        )}
        <span>{props.user.discordTag}</span>
      </p>
    </div>
  )
})
