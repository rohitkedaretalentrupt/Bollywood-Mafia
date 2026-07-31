/** Emoji avatar pool for the player setup screen. */
export const AVATARS: string[] = [
  '🕺',
  '💃',
  '🎤',
  '🎭',
  '🎩',
  '👑',
  '🦚',
  '🐯',
  '🦁',
  '🐘',
  '🌶️',
  '🪔',
  '🎻',
  '🥁',
  '🪩',
  '🍛',
  '☕',
  '🛺',
  '🚂',
  '🕌',
  '🌙',
  '⭐',
  '🔥',
  '💎',
  '🌹',
  '🦋',
  '🧿',
  '🪷',
  '🥂',
  '🍿',
  '📽️',
  '🎞️',
]

export const BOT_AVATARS: string[] = [
  '🦚',
  '🐯',
  '🦁',
  '🐘',
  '🌶️',
  '🪔',
  '🎻',
  '🥁',
  '🪩',
  '🛺',
  '🌙',
  '⭐',
  '🔥',
  '💎',
  '🌹',
  '🦋',
  '🧿',
  '🪷',
  '🥂',
  '🎩',
]

export function randomAvatar(exclude: string[] = []): string {
  const pool = AVATARS.filter((a) => !exclude.includes(a))
  const source = pool.length > 0 ? pool : AVATARS
  return source[Math.floor(Math.random() * source.length)]
}
